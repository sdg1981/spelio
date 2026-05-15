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
  CUSTOM_LIST_WELSH_MAX_LENGTH,
  normaliseCustomListTitle,
  type CustomListEntryInput,
  validateCustomListTitle,
  validateCustomListRows
} from '../src/lib/customListValidation.js';
import { getCustomListModerationDiagnostics, getDeploymentDiagnosticFields } from './custom-list-config.js';
import { AzureSynthesisError, synthesizeAzureWelshMp3BytesWithDiagnostics } from './azure-tts.js';

type ModerationStatus = 'pass' | 'rejected' | 'failed';

type ModerationResult = {
  status: ModerationStatus;
  provider: string;
  flaggedEntryIndexes?: number[];
  missingEnv?: string[];
  httpStatus?: number;
  errorSummary?: string;
};

type CustomListCreationStage =
  | 'azure_tts'
  | 'post_processing'
  | 'storage_upload'
  | 'storage_public_url'
  | 'db_insert_list'
  | 'db_insert_words'
  | 'cleanup_audio'
  | 'cleanup_list';

class CustomListCreationError extends Error {
  stage: CustomListCreationStage;
  details: Record<string, unknown>;

  constructor(stage: CustomListCreationStage, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'CustomListCreationError';
    this.stage = stage;
    this.details = details;
  }
}

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
    const titleInput = typeof body?.title === 'string' ? body.title : '';
    if (!validateCustomListTitle(titleInput)) {
      return response.status(400).json({ ok: false, error: 'validation_failed', titleError: 'titleTooLong' });
    }
    const listTitle = normaliseCustomListTitle(titleInput);
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
    logModerationResult(moderation, validation.entries.length);
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
        logCustomListCreationStep('azure_tts_start', {
          wordIndex: index + 1,
          textLength: entry.welsh.length
        });
        let audioResult: Awaited<ReturnType<typeof synthesizeAzureWelshMp3BytesWithDiagnostics>>;
        try {
          audioResult = await synthesizeAzureWelshMp3BytesWithDiagnostics(entry.welsh, { env: process.env });
        } catch (error) {
          throw createAudioStageError(error, index + 1);
        }
        logCustomListCreationStep('azure_tts_success', {
          wordIndex: index + 1,
          azureStatus: audioResult.azureStatus,
          wavByteLength: audioResult.wavByteLength,
          mp3ByteLength: audioResult.mp3ByteLength
        });
        const audioBytes = audioResult.mp3Bytes;
        const audioBuffer = audioBytes.buffer.slice(audioBytes.byteOffset, audioBytes.byteOffset + audioBytes.byteLength) as ArrayBuffer;
        const storagePath = `custom/cy/${publicId}/${String(index + 1).padStart(2, '0')}.mp3`;
        logCustomListCreationStep('storage_upload_start', {
          wordIndex: index + 1,
          bucket: 'audio',
          storagePath,
          mp3ByteLength: audioResult.mp3ByteLength
        });
        const upload = await client.storage
          .from('audio')
          .upload(storagePath, new Blob([audioBuffer], { type: 'audio/mpeg' }), {
            cacheControl: '1209600',
            contentType: 'audio/mpeg',
            upsert: false
          });
        if (upload.error) {
          throw new CustomListCreationError('storage_upload', 'Supabase storage upload failed.', {
            wordIndex: index + 1,
            bucket: 'audio',
            storagePath,
            uploadError: summarizeSupabaseError(upload.error)
          });
        }
        uploadedPaths.push(storagePath);
        logCustomListCreationStep('storage_upload_success', {
          wordIndex: index + 1,
          bucket: 'audio',
          storagePath
        });
        const { data } = client.storage.from('audio').getPublicUrl(storagePath);
        if (!data.publicUrl) {
          throw new CustomListCreationError('storage_public_url', 'Audio upload did not return a public URL.', {
            wordIndex: index + 1,
            bucket: 'audio',
            storagePath
          });
        }
        generatedWords.push({ ...entry, audioUrl: data.publicUrl, storagePath, order: index + 1 });
      }

      logCustomListCreationStep('db_insert_list_start', {
        publicId,
        wordCount: generatedWords.length
      });
      const listInsert = await client
        .from('custom_word_lists')
        .insert({
          public_id: publicId,
          title: listTitle,
          source_language: 'en',
          target_language: 'cy',
          status: 'ready',
          moderation_status: moderation.status,
          moderation_provider: moderation.provider,
          expires_at: expiresAt
        })
        .select('id,public_id')
        .single();
      if (listInsert.error) {
        throw new CustomListCreationError('db_insert_list', 'Custom list DB insert failed.', {
          publicId,
          insertError: summarizeSupabaseError(listInsert.error)
        });
      }

      const customListId = listInsert.data.id as string;
      createdListId = customListId;
      logCustomListCreationStep('db_insert_list_success', {
        publicId,
        customListId
      });
      logCustomListCreationStep('db_insert_words_start', {
        publicId,
        customListId,
        wordCount: generatedWords.length
      });
      const wordsInsert = await client.from('custom_words').insert(generatedWords.map(word => ({
        custom_list_id: customListId,
        welsh_answer: word.welsh,
        english_prompt: word.english || null,
        audio_url: word.audioUrl,
        audio_storage_path: word.storagePath,
        audio_status: 'ready',
        order_index: word.order
      })));
      if (wordsInsert.error) {
        throw new CustomListCreationError('db_insert_words', 'Custom words DB insert failed.', {
          publicId,
          customListId,
          wordCount: generatedWords.length,
          insertError: summarizeSupabaseError(wordsInsert.error)
        });
      }
      logCustomListCreationStep('db_insert_words_success', {
        publicId,
        customListId,
        wordCount: generatedWords.length
      });

      return response.status(201).json({
        ok: true,
        publicId,
        title: listTitle,
        sharePath: `/custom-list/${publicId}/share`,
        shareUrl: `/custom-list/${publicId}/share`,
        practicePath: `/custom/${publicId}`,
        expiresAt
      });
    } catch (error) {
      const creationError = normalizeCreationError(error);
      await cleanupUploadedAudio(client, uploadedPaths, creationError);
      if (createdListId) await cleanupInsertedList(client, createdListId, creationError);
      logCustomListCreationFailure(creationError);
      return response.status(502).json({ ok: false, error: 'audio_failed' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected custom list failure.';
    console.error('Custom list route failed', { error: message });
    return response.status(500).json({ ok: false, error: 'server_error' });
  }
}

export async function moderateCustomListEntries(entries: CustomListEntryInput[], env: Record<string, string | undefined> = process.env): Promise<ModerationResult> {
  const diagnostics = getCustomListModerationDiagnostics(env);
  if (diagnostics.selectedProvider === 'unsupported') {
    return {
      status: 'failed',
      provider: diagnostics.provider || 'unsupported',
      missingEnv: diagnostics.missing,
      errorSummary: `Unsupported custom list moderation provider: ${diagnostics.provider}`
    };
  }

  if (diagnostics.selectedProvider === 'azure') {
    return moderateWithAzureContentSafety(entries, env);
  }

  if (diagnostics.selectedProvider === 'openai') {
    return moderateWithOpenAI(entries, env);
  }

  if (diagnostics.selectedProvider === 'mock-safe') {
    return { status: 'pass', provider: 'mock-safe' };
  }

  return {
    status: 'failed',
    provider: 'none',
    missingEnv: diagnostics.missing,
    errorSummary: 'No custom list moderation provider is configured.'
  };
}

async function moderateWithAzureContentSafety(entries: CustomListEntryInput[], env: Record<string, string | undefined>): Promise<ModerationResult> {
  const endpoint = env.AZURE_CONTENT_SAFETY_ENDPOINT?.replace(/\/+$/, '');
  const key = env.AZURE_CONTENT_SAFETY_KEY;
  const missingEnv = [
    endpoint ? '' : 'AZURE_CONTENT_SAFETY_ENDPOINT',
    key ? '' : 'AZURE_CONTENT_SAFETY_KEY'
  ].filter(Boolean);
  if (missingEnv.length) {
    return {
      status: 'failed',
      provider: 'azure-content-safety',
      missingEnv,
      errorSummary: 'Azure AI Content Safety is missing required configuration.'
    };
  }
  const contentSafetyEndpoint = endpoint as string;
  const contentSafetyKey = key as string;

  try {
    const flaggedEntryIndexes: number[] = [];
    for (const [index, entry] of entries.entries()) {
      const result = await fetch(`${contentSafetyEndpoint}/contentsafety/text:analyze?api-version=2023-10-01`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': contentSafetyKey
        },
        body: JSON.stringify({
          text: formatEntryForModeration(entry),
          categories: ['Hate', 'SelfHarm', 'Sexual', 'Violence'],
          outputType: 'FourSeverityLevels'
        })
      });
      if (!result.ok) {
        return {
          status: 'failed',
          provider: 'azure-content-safety',
          httpStatus: result.status,
          errorSummary: await readSafeResponseSummary(result)
        };
      }
      const payload = await result.json().catch(() => null) as { categoriesAnalysis?: Array<{ severity?: number }> } | null;
      if (!payload?.categoriesAnalysis) {
        return {
          status: 'failed',
          provider: 'azure-content-safety',
          errorSummary: 'Azure Content Safety response did not include categoriesAnalysis.'
        };
      }
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
    return {
      status: 'failed',
      provider: 'azure-content-safety',
      errorSummary: 'Azure Content Safety request failed before a response was received.'
    };
  }
}

async function moderateWithOpenAI(entries: CustomListEntryInput[], env: Record<string, string | undefined>): Promise<ModerationResult> {
  const key = env.OPENAI_API_KEY;
  if (!key) {
    return {
      status: 'failed',
      provider: 'openai',
      missingEnv: ['OPENAI_API_KEY'],
      errorSummary: 'OpenAI moderation is missing OPENAI_API_KEY.'
    };
  }

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
    if (!result.ok) {
      return {
        status: 'failed',
        provider: 'openai',
        httpStatus: result.status,
        errorSummary: await readSafeResponseSummary(result)
      };
    }
    const payload = await result.json().catch(() => null) as { results?: Array<{ flagged?: boolean }> } | null;
    if (!Array.isArray(payload?.results)) {
      return {
        status: 'failed',
        provider: 'openai',
        errorSummary: 'OpenAI moderation response did not include results.'
      };
    }
    const flaggedEntryIndexes = payload?.results
      ?.map((item, index) => item.flagged ? index : -1)
      .filter(index => index >= 0) ?? [];
    return {
      status: flaggedEntryIndexes.length ? 'rejected' : 'pass',
      provider: 'openai',
      flaggedEntryIndexes
    };
  } catch {
    return {
      status: 'failed',
      provider: 'openai',
      errorSummary: 'OpenAI moderation request failed before a response was received.'
    };
  }
}

function formatEntryForModeration(entry: CustomListEntryInput) {
  return [entry.welsh, entry.english].filter(Boolean).join('\n');
}

async function readSafeResponseSummary(response: { text?: () => Promise<string>; status: number }) {
  if (typeof response.text !== 'function') return `Provider returned HTTP ${response.status}.`;
  const body = await response.text().catch(() => '');
  return body ? body.slice(0, 500) : `Provider returned HTTP ${response.status}.`;
}

function logModerationResult(result: ModerationResult, entryCount: number) {
  const diagnostics = getCustomListModerationDiagnostics(process.env);
  const details = {
    customListModerationProvider: diagnostics.provider,
    hasOpenAIKey: diagnostics.hasOpenAIKey,
    openAIModel: diagnostics.model,
    nodeEnv: diagnostics.nodeEnv,
    vercelEnv: diagnostics.vercelEnv,
    selectedProvider: diagnostics.selectedProvider,
    provider: result.provider,
    status: result.status,
    entryCount,
    flaggedEntryCount: result.flaggedEntryIndexes?.length ?? 0,
    missingEnv: result.missingEnv ?? diagnostics.missing,
    httpStatus: result.httpStatus ?? null,
    errorSummary: result.errorSummary ?? '',
    ...getDeploymentDiagnosticFields(process.env)
  };

  if (result.status === 'failed') {
    console.error('Custom list moderation failed', details);
    return;
  }

  console.info('Custom list moderation completed', details);
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

function parseBody(body: unknown): { entries?: unknown; title?: unknown } | null {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as { entries?: unknown; title?: unknown };
    } catch {
      return null;
    }
  }
  if (body && typeof body === 'object') return body as { entries?: unknown; title?: unknown };
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

function createAudioStageError(error: unknown, wordIndex: number) {
  if (error instanceof AzureSynthesisError) {
    return new CustomListCreationError(
      error.stage === 'post_processing' ? 'post_processing' : 'azure_tts',
      error.message,
      {
        wordIndex,
        azureStage: error.stage,
        azureStatus: error.azureStatus ?? null,
        azureError: error.azureError ?? '',
        wavByteLength: error.wavByteLength ?? null
      }
    );
  }

  return new CustomListCreationError('azure_tts', readErrorMessage(error, 'Azure audio synthesis failed.'), { wordIndex });
}

function normalizeCreationError(error: unknown) {
  if (error instanceof CustomListCreationError) return error;
  return new CustomListCreationError('azure_tts', readErrorMessage(error, 'Audio generation failed.'));
}

function logCustomListCreationStep(step: string, details: Record<string, unknown>) {
  if (process.env.VERCEL_ENV === 'production' && process.env.CUSTOM_LIST_VERBOSE_LOGS !== 'true') return;
  console.info('Custom list creation step', { step, ...details });
}

function logCustomListCreationFailure(error: CustomListCreationError) {
  console.error('Custom list creation failed', {
    stage: error.stage,
    error: error.message,
    ...error.details
  });
}

function summarizeSupabaseError(error: unknown) {
  const value = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  return {
    message: typeof value.message === 'string' ? value.message : readErrorMessage(error, 'Unknown Supabase error.'),
    code: typeof value.code === 'string' ? value.code : '',
    statusCode: typeof value.statusCode === 'string' || typeof value.statusCode === 'number' ? value.statusCode : '',
    details: typeof value.details === 'string' ? value.details.slice(0, 500) : '',
    hint: typeof value.hint === 'string' ? value.hint.slice(0, 500) : ''
  };
}

function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function cleanupUploadedAudio(client: { storage: { from: (bucket: string) => { remove: (paths: string[]) => Promise<unknown> } } }, paths: string[], originalError: CustomListCreationError) {
  if (!paths.length) return;
  try {
    logCustomListCreationStep('cleanup_audio_start', {
      originalStage: originalError.stage,
      bucket: 'audio',
      paths
    });
    const result = await client.storage.from('audio').remove(paths);
    const error = result && typeof result === 'object' && 'error' in result ? (result as { error?: unknown }).error : null;
    if (error) {
      console.error('Custom list cleanup failed', {
        stage: 'cleanup_audio',
        originalStage: originalError.stage,
        bucket: 'audio',
        paths,
        cleanupError: summarizeSupabaseError(error)
      });
      return;
    }
    logCustomListCreationStep('cleanup_audio_success', {
      originalStage: originalError.stage,
      bucket: 'audio',
      paths
    });
  } catch (error) {
    console.error('Custom list cleanup failed', {
      stage: 'cleanup_audio',
      originalStage: originalError.stage,
      bucket: 'audio',
      paths,
      cleanupError: readErrorMessage(error, 'Audio cleanup failed.')
    });
    // Cleanup should not mask the user-facing failure.
  }
}

async function cleanupInsertedList(client: any, listId: string, originalError: CustomListCreationError) {
  try {
    logCustomListCreationStep('cleanup_list_start', {
      originalStage: originalError.stage,
      customListId: listId
    });
    const result = await client.from('custom_word_lists').delete().eq('id', listId);
    if (result?.error) {
      console.error('Custom list cleanup failed', {
        stage: 'cleanup_list',
        originalStage: originalError.stage,
        customListId: listId,
        cleanupError: summarizeSupabaseError(result.error)
      });
      return;
    }
    logCustomListCreationStep('cleanup_list_success', {
      originalStage: originalError.stage,
      customListId: listId
    });
  } catch (error) {
    console.error('Custom list cleanup failed', {
      stage: 'cleanup_list',
      originalStage: originalError.stage,
      customListId: listId,
      cleanupError: readErrorMessage(error, 'List cleanup failed.')
    });
    // Cleanup should not mask the user-facing failure.
  }
}
