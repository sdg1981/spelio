declare const process: {
  env: Record<string, string | undefined>;
};

type ApiRequest = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: Record<string, unknown>) => void;
  setHeader: (name: string, value: string | string[]) => void;
};

import { createClient } from '@supabase/supabase-js';
import {
  CUSTOM_LIST_ENGLISH_MAX_LENGTH,
  CUSTOM_LIST_MAX_ROWS,
  CUSTOM_LIST_TITLE,
  CUSTOM_LIST_WELSH_MAX_LENGTH,
  type CustomListEntryInput,
  validateCustomListRows
} from '../src/lib/customListValidation.js';
import { synthesizeAzureWelshMp3Bytes } from './azure-tts.js';

type ModerationStatus = 'pass' | 'rejected' | 'failed';

type ModerationResult = {
  status: ModerationStatus;
  provider: string;
  flaggedEntryIndexes?: number[];
};

const CREATE_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const CREATE_RATE_LIMIT_MAX = 6;
const AUDIO_RATE_LIMIT_MAX = 60;

const rateLimitBuckets = new Map<string, { count: number; audioCount: number; resetAt: number }>();

export default async function handler(request: ApiRequest, response: ApiResponse) {
  try {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return response.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const body = parseBody(request.body);
    const entriesInput = Array.isArray(body?.entries) ? body.entries : [];
    const rows = entriesInput.slice(0, CUSTOM_LIST_MAX_ROWS).map(normaliseIncomingEntry);
    const validation = validateCustomListRows(rows);
    if (validation.errors.length) {
      return response.status(400).json({ ok: false, error: 'validation_failed', errors: validation.errors });
    }

    const identifier = getRateLimitIdentifier(request);
    const limit = checkRateLimit(identifier, validation.entries.length);
    if (!limit.ok) {
      return response.status(429).json({ ok: false, error: 'rate_limited', retryAfterSeconds: Math.ceil((limit.resetAt - Date.now()) / 1000) });
    }

    const moderation = await moderateCustomListEntries(validation.entries, process.env);
    if (moderation.status === 'rejected') {
      return response.status(422).json({
        ok: false,
        error: 'moderation_rejected',
        errors: moderation.flaggedEntryIndexes?.map(index => ({
          row: index,
          code: 'moderationRejected'
        })) ?? []
      });
    }
    if (moderation.status === 'failed') {
      return response.status(503).json({ ok: false, error: 'moderation_failed' });
    }

    const client = createSupabaseServerClient(process.env);
    const publicId = createPublicId();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const uploadedPaths: string[] = [];
    const generatedWords: Array<CustomListEntryInput & { audioUrl: string; storagePath: string; order: number }> = [];
    let createdListId: string | null = null;

    try {
      for (const [index, entry] of validation.entries.entries()) {
        const audioBytes = await synthesizeAzureWelshMp3Bytes(entry.welsh, { env: process.env });
        const audioBuffer = audioBytes.buffer.slice(audioBytes.byteOffset, audioBytes.byteOffset + audioBytes.byteLength) as ArrayBuffer;
        const storagePath = `custom/cy/${publicId}/${String(index + 1).padStart(2, '0')}.mp3`;
        const upload = await client.storage
          .from('audio')
          .upload(storagePath, new Blob([audioBuffer], { type: 'audio/mpeg' }), {
            cacheControl: '1209600',
            contentType: 'audio/mpeg',
            upsert: false
          });
        if (upload.error) throw upload.error;
        uploadedPaths.push(storagePath);
        const { data } = client.storage.from('audio').getPublicUrl(storagePath);
        if (!data.publicUrl) throw new Error('Audio upload did not return a public URL.');
        generatedWords.push({ ...entry, audioUrl: data.publicUrl, storagePath, order: index + 1 });
      }

      const listInsert = await client
        .from('custom_word_lists')
        .insert({
          public_id: publicId,
          title: CUSTOM_LIST_TITLE,
          source_language: 'en',
          target_language: 'cy',
          status: 'ready',
          moderation_status: moderation.status,
          moderation_provider: moderation.provider,
          expires_at: expiresAt
        })
        .select('id,public_id')
        .single();
      if (listInsert.error) throw listInsert.error;

      const customListId = listInsert.data.id as string;
      createdListId = customListId;
      const wordsInsert = await client.from('custom_words').insert(generatedWords.map(word => ({
        custom_list_id: customListId,
        welsh_answer: word.welsh,
        english_prompt: word.english || null,
        audio_url: word.audioUrl,
        audio_storage_path: word.storagePath,
        audio_status: 'ready',
        order_index: word.order
      })));
      if (wordsInsert.error) throw wordsInsert.error;

      return response.status(201).json({
        ok: true,
        publicId,
        sharePath: `/custom-list/${publicId}/share`,
        shareUrl: `/custom-list/${publicId}/share`,
        practicePath: `/custom/${publicId}`,
        expiresAt
      });
    } catch (error) {
      await cleanupUploadedAudio(client, uploadedPaths);
      if (createdListId) await cleanupInsertedList(client, createdListId);
      const message = error instanceof Error ? error.message : 'Audio generation failed.';
      console.error('Custom list creation failed', { error: message });
      return response.status(502).json({ ok: false, error: 'audio_failed' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected custom list failure.';
    console.error('Custom list route failed', { error: message });
    return response.status(500).json({ ok: false, error: 'server_error' });
  }
}

export async function moderateCustomListEntries(entries: CustomListEntryInput[], env: Record<string, string | undefined> = process.env): Promise<ModerationResult> {
  const provider = (env.CUSTOM_LIST_MODERATION_PROVIDER ?? '').trim().toLowerCase();

  if (provider === 'azure' || (!provider && env.AZURE_CONTENT_SAFETY_ENDPOINT && env.AZURE_CONTENT_SAFETY_KEY)) {
    return moderateWithAzureContentSafety(entries, env);
  }

  if (provider === 'openai' || (!provider && env.OPENAI_API_KEY)) {
    return moderateWithOpenAI(entries, env);
  }

  if (env.CUSTOM_LIST_MODERATION_MOCK_SAFE === 'true' && env.NODE_ENV !== 'production' && env.VERCEL_ENV !== 'production') {
    return { status: 'pass', provider: 'mock-safe' };
  }

  return { status: 'failed', provider: 'none' };
}

async function moderateWithAzureContentSafety(entries: CustomListEntryInput[], env: Record<string, string | undefined>): Promise<ModerationResult> {
  const endpoint = env.AZURE_CONTENT_SAFETY_ENDPOINT?.replace(/\/+$/, '');
  const key = env.AZURE_CONTENT_SAFETY_KEY;
  if (!endpoint || !key) return { status: 'failed', provider: 'azure-content-safety' };

  try {
    const flaggedEntryIndexes: number[] = [];
    for (const [index, entry] of entries.entries()) {
      const result = await fetch(`${endpoint}/contentsafety/text:analyze?api-version=2023-10-01`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': key
        },
        body: JSON.stringify({
          text: formatEntryForModeration(entry),
          categories: ['Hate', 'SelfHarm', 'Sexual', 'Violence'],
          outputType: 'FourSeverityLevels'
        })
      });
      if (!result.ok) return { status: 'failed', provider: 'azure-content-safety' };
      const payload = await result.json().catch(() => null) as { categoriesAnalysis?: Array<{ severity?: number }> } | null;
      if (payload?.categoriesAnalysis?.some(category => (category.severity ?? 0) >= 2) === true) {
        flaggedEntryIndexes.push(index);
      }
    }

    return {
      status: flaggedEntryIndexes.length ? 'rejected' : 'pass',
      provider: 'azure-content-safety',
      flaggedEntryIndexes
    };
  } catch {
    return { status: 'failed', provider: 'azure-content-safety' };
  }
}

async function moderateWithOpenAI(entries: CustomListEntryInput[], env: Record<string, string | undefined>): Promise<ModerationResult> {
  const key = env.OPENAI_API_KEY;
  if (!key) return { status: 'failed', provider: 'openai' };

  try {
    const result = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: env.OPENAI_MODERATION_MODEL ?? 'omni-moderation-latest',
        input: entries.map(formatEntryForModeration)
      })
    });
    if (!result.ok) return { status: 'failed', provider: 'openai' };
    const payload = await result.json().catch(() => null) as { results?: Array<{ flagged?: boolean }> } | null;
    const flaggedEntryIndexes = payload?.results
      ?.map((item, index) => item.flagged ? index : -1)
      .filter(index => index >= 0) ?? [];
    return {
      status: flaggedEntryIndexes.length ? 'rejected' : 'pass',
      provider: 'openai',
      flaggedEntryIndexes
    };
  } catch {
    return { status: 'failed', provider: 'openai' };
  }
}

function formatEntryForModeration(entry: CustomListEntryInput) {
  return [entry.welsh, entry.english].filter(Boolean).join('\n');
}

function createSupabaseServerClient(env: Record<string, string | undefined>) {
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase service credentials are not configured.');
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function normaliseIncomingEntry(value: unknown): CustomListEntryInput {
  const row = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const welsh = typeof row.welsh === 'string' ? row.welsh.trim().slice(0, CUSTOM_LIST_WELSH_MAX_LENGTH + 1) : '';
  const english = typeof row.english === 'string' ? row.english.trim().slice(0, CUSTOM_LIST_ENGLISH_MAX_LENGTH + 1) : '';
  return { welsh, english };
}

function parseBody(body: unknown): { entries?: unknown } | null {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as { entries?: unknown };
    } catch {
      return null;
    }
  }
  if (body && typeof body === 'object') return body as { entries?: unknown };
  return null;
}

function getRateLimitIdentifier(request: ApiRequest) {
  const clientId = readHeader(request, 'x-spelio-client-id')?.trim();
  const forwarded = readHeader(request, 'x-forwarded-for')?.split(',')[0]?.trim();
  return `${clientId || 'browser-unknown'}:${forwarded || request.socket?.remoteAddress || 'ip-unknown'}`;
}

function readHeader(request: ApiRequest, name: string) {
  const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function checkRateLimit(identifier: string, audioCount: number) {
  const now = Date.now();
  const existing = rateLimitBuckets.get(identifier);
  const bucket = existing && existing.resetAt > now
    ? existing
    : { count: 0, audioCount: 0, resetAt: now + CREATE_RATE_LIMIT_WINDOW_MS };

  if (bucket.count + 1 > CREATE_RATE_LIMIT_MAX || bucket.audioCount + audioCount > AUDIO_RATE_LIMIT_MAX) {
    rateLimitBuckets.set(identifier, bucket);
    return { ok: false, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  bucket.audioCount += audioCount;
  rateLimitBuckets.set(identifier, bucket);
  return { ok: true, resetAt: bucket.resetAt };
}

function createPublicId() {
  const random = globalThis.crypto.randomUUID().replace(/-/g, '');
  return `cl_${random}`;
}

async function cleanupUploadedAudio(client: { storage: { from: (bucket: string) => { remove: (paths: string[]) => Promise<unknown> } } }, paths: string[]) {
  if (!paths.length) return;
  try {
    await client.storage.from('audio').remove(paths);
  } catch {
    // Cleanup should not mask the user-facing failure.
  }
}

async function cleanupInsertedList(client: any, listId: string) {
  try {
    await client.from('custom_word_lists').delete().eq('id', listId);
  } catch {
    // Cleanup should not mask the user-facing failure.
  }
}
