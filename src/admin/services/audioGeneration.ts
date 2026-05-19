import type { AdminWord, AudioStatus, ElevenLabsGenerationMode } from '../types';

export const AZURE_WELSH_VOICE = 'cy-GB-NiaNeural';
export const AZURE_SPEECH_LOCALE = 'cy-GB';
export const AZURE_MP3_OUTPUT_FORMAT = 'audio-16khz-32kbitrate-mono-mp3';
export const AZURE_SPEECH_PROSODY_RATE = '-4%';
export const ELEVENLABS_DEFAULT_VOICE_NAME = 'Sam - Soft, Slightly Welsh and Friendly';
export const FALLBACK_ELEVENLABS_DEFAULT_VOICE_ID = 'DikmR0aoFXAp1A3NcovW';
export const ELEVENLABS_DIRECT_TTS_MODEL_ID = 'eleven_v3';
export const ELEVENLABS_SPEECH_TO_SPEECH_MODEL_ID = 'eleven_multilingual_sts_v2';
export const ELEVENLABS_WELSH_LANGUAGE_OVERRIDE = 'Welsh';
export const ELEVENLABS_NOT_APPLICABLE = 'not_applicable';
export const ELEVENLABS_DIRECT_TTS_PROMPT = 'none - Welsh answer only';

export type AudioQueueCounts = Record<AudioStatus, number>;

export interface AudioQueueSnapshot<TWord extends AdminWord = AdminWord> {
  words: TWord[];
  counts: AudioQueueCounts;
}

export interface AudioGenerationResult {
  word: AdminWord;
  ok: boolean;
  error?: string;
}

export interface ElevenLabsAudioDiagnostics {
  model: string;
  voiceId: string;
  languageOverride: string;
  prompt: string;
}

export interface ElevenLabsAudioBlob {
  blob: Blob;
  diagnostics: ElevenLabsAudioDiagnostics;
}

type AudioRouteErrorPayload = {
  error?: string;
  errorStage?: string;
  audioPipelineVersion?: string;
  azureStatus?: number;
  azureErrorBody?: string;
};

export function createAudioQueueSnapshot<TWord extends AdminWord>(words: TWord[]): AudioQueueSnapshot<TWord> {
  return {
    words,
    counts: {
      missing: words.filter(word => word.audioStatus === 'missing').length,
      queued: words.filter(word => word.audioStatus === 'queued').length,
      generating: words.filter(word => word.audioStatus === 'generating').length,
      ready: words.filter(word => word.audioStatus === 'ready').length,
      failed: words.filter(word => word.audioStatus === 'failed').length
    }
  };
}

export function normalizeAudioStatus(status: unknown): AudioStatus {
  return status === 'ready' || status === 'queued' || status === 'generating' || status === 'failed'
    ? status
    : 'missing';
}

export function normalizeLegacyAudioStatus(status: unknown): AudioStatus {
  if (status === 'generated') return 'ready';
  return normalizeAudioStatus(status);
}

export async function synthesizeWelshMp3(text: string): Promise<Blob> {
  const response = await fetch('/api/azure-tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as AudioRouteErrorPayload | null;
    throw new Error(formatAudioRouteError(response.status, payload));
  }

  const contentType = response.headers.get('content-type') ?? '';
  const audioBuffer = await response.arrayBuffer();
  const audioBytes = new Uint8Array(audioBuffer);

  if (audioBytes.byteLength < 100) {
    throw new Error('Azure synthesis returned an unexpectedly small audio payload.');
  }

  if (audioBytes[0] === 123) {
    throw new Error('Azure synthesis returned JSON instead of MP3 audio.');
  }

  const looksLikeMp3 =
    (audioBytes[0] === 0x49 && audioBytes[1] === 0x44 && audioBytes[2] === 0x33) ||
    (audioBytes[0] === 0xff && (audioBytes[1] & 0xe0) === 0xe0);

  if (!looksLikeMp3) {
    throw new Error(`Azure synthesis returned a non-MP3 payload${contentType ? ` (${contentType})` : ''}.`);
  }

  return new Blob([audioBuffer], { type: 'audio/mpeg' });
}

export async function synthesizeElevenLabsWelshMp3(text: string): Promise<ElevenLabsAudioBlob> {
  return requestElevenLabsMp3({ mode: 'direct', text });
}

export async function transformAzureMp3WithElevenLabs(audioUrl: string): Promise<ElevenLabsAudioBlob> {
  return requestElevenLabsMp3({ mode: 'azure_transform', audioUrl });
}

async function requestElevenLabsMp3(payload: { mode: ElevenLabsGenerationMode; text?: string; audioUrl?: string }): Promise<ElevenLabsAudioBlob> {
  const response = await fetch('/api/elevenlabs-transform', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as AudioRouteErrorPayload | null;
    throw new Error(payload?.error ?? `ElevenLabs route failed (${response.status}).`);
  }

  const audioBuffer = await response.arrayBuffer();
  const audioBytes = new Uint8Array(audioBuffer);
  const looksLikeMp3 =
    (audioBytes[0] === 0x49 && audioBytes[1] === 0x44 && audioBytes[2] === 0x33) ||
    (audioBytes[0] === 0xff && (audioBytes[1] & 0xe0) === 0xe0);

  if (audioBytes.byteLength < 100 || !looksLikeMp3) {
    throw new Error('ElevenLabs route returned an invalid MP3 payload.');
  }

  return {
    blob: new Blob([audioBuffer], { type: 'audio/mpeg' }),
    diagnostics: {
      model: response.headers.get('x-spelio-elevenlabs-model') || (payload.mode === 'direct' ? ELEVENLABS_DIRECT_TTS_MODEL_ID : ELEVENLABS_SPEECH_TO_SPEECH_MODEL_ID),
      voiceId: response.headers.get('x-spelio-elevenlabs-voice-id') || FALLBACK_ELEVENLABS_DEFAULT_VOICE_ID,
      languageOverride: response.headers.get('x-spelio-elevenlabs-language-override') || (payload.mode === 'direct' ? ELEVENLABS_WELSH_LANGUAGE_OVERRIDE : ELEVENLABS_NOT_APPLICABLE),
      prompt: response.headers.get('x-spelio-elevenlabs-prompt') || (payload.mode === 'direct' ? ELEVENLABS_DIRECT_TTS_PROMPT : ELEVENLABS_NOT_APPLICABLE)
    }
  };
}

function formatAudioRouteError(status: number, payload: AudioRouteErrorPayload | null) {
  if (!payload) return status === 429 ? 'Azure rate limit reached.' : `Audio route failed (${status}) before returning diagnostic details.`;

  const message = payload.error ?? (status === 429 ? 'Azure rate limit reached.' : `Audio route failed (${status}).`);
  const stage = payload.errorStage ? `stage: ${payload.errorStage}` : '';
  const version = payload.audioPipelineVersion ? `pipeline: ${payload.audioPipelineVersion}` : '';
  const details = [stage, version].filter(Boolean).join(', ');
  return details ? `${message} (${details})` : message;
}

export function createAudioStoragePath(word: Pick<AdminWord, 'id' | 'listId'>) {
  if (word.listId.startsWith('support_')) {
    return `cy/support/${slugify(word.listId)}/${slugify(word.id)}.mp3`;
  }
  return `cy/${slugify(word.listId)}/${slugify(word.id)}.mp3`;
}

export function createElevenLabsAudioStoragePath(word: Pick<AdminWord, 'id' | 'listId'>) {
  if (word.listId.startsWith('support_')) {
    return `cy-elevenlabs/support/${slugify(word.listId)}/${slugify(word.id)}.mp3`;
  }
  return `cy-elevenlabs/${slugify(word.listId)}/${slugify(word.id)}.mp3`;
}

export function createMockAudioUrl(word: Pick<AdminWord, 'id'>) {
  return `/audio/gweithio.m4a#${encodeURIComponent(word.id)}`;
}

export function createWelshSsml(text: string) {
  // TODO: Add dialect-specific voice selection if Azure Welsh regional voices become practical.
  const safeText = escapeXml(text.trim());
  return `<speak version="1.0" xml:lang="${AZURE_SPEECH_LOCALE}"><voice xml:lang="${AZURE_SPEECH_LOCALE}" name="${AZURE_WELSH_VOICE}"><prosody rate="${AZURE_SPEECH_PROSODY_RATE}">${safeText}</prosody></voice></speak>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'audio';
}
