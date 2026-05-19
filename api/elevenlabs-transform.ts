declare const process: {
  env: Record<string, string | undefined>;
};

export const ELEVENLABS_DEFAULT_VOICE_NAME = 'Sam - Soft, Slightly Welsh and Friendly';
export const FALLBACK_ELEVENLABS_DEFAULT_VOICE_ID = 'DikmR0aoFXAp1A3NcovW';

export type ElevenLabsTransformConfig = {
  apiKey: string;
  defaultVoiceId: string;
};

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: { ok: boolean; error?: string; voiceId?: string; voiceName?: string }) => void;
  setHeader: (name: string, value: string | string[]) => void;
  send: (body: unknown) => void;
};

declare const Buffer: {
  from: (value: ArrayBuffer | Uint8Array) => Uint8Array;
};

type FetchResponse = {
  ok: boolean;
  status: number;
  headers: { get: (name: string) => string | null };
  arrayBuffer: () => Promise<ArrayBuffer>;
  text: () => Promise<string>;
};

type ElevenLabsFetch = (url: string, options?: RequestInit) => Promise<FetchResponse>;

type HandlerDependencies = {
  env?: Record<string, string | undefined>;
  fetchImpl?: ElevenLabsFetch;
};

export default async function handler(request: ApiRequest, response: ApiResponse) {
  return handleElevenLabsTransformRequest(request, response);
}

export async function handleElevenLabsTransformRequest(request: ApiRequest, response: ApiResponse, dependencies: HandlerDependencies = {}) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = parseBody(request.body);
  const audioUrl = typeof body?.audioUrl === 'string' ? body.audioUrl.trim() : '';
  if (!audioUrl) return response.status(400).json({ ok: false, error: 'Azure audio URL is required.' });

  const config = getElevenLabsTransformConfig(dependencies.env ?? process.env);
  if (!config.apiKey) return response.status(500).json({ ok: false, error: 'ElevenLabs is not configured.' });

  try {
    const fetchImpl = dependencies.fetchImpl ?? fetch;
    const azureAudio = await fetchExistingAzureMp3(audioUrl, fetchImpl);
    const transformedAudio = await transformAzureMp3WithElevenLabs(azureAudio, config, fetchImpl);

    response.setHeader('Content-Type', 'audio/mpeg');
    response.setHeader('Cache-Control', 'no-store');
    return response.status(200).send(Buffer.from(transformedAudio));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ElevenLabs transformation failed.';
    return response.status(502).json({
      ok: false,
      error: message,
      voiceId: config.defaultVoiceId,
      voiceName: ELEVENLABS_DEFAULT_VOICE_NAME
    });
  }
}

export function getElevenLabsTransformConfig(env: Record<string, string | undefined> = process.env): ElevenLabsTransformConfig {
  return {
    apiKey: env.ELEVENLABS_API_KEY ?? '',
    defaultVoiceId: env.ELEVENLABS_DEFAULT_VOICE_ID ?? FALLBACK_ELEVENLABS_DEFAULT_VOICE_ID
  };
}

export async function transformAzureMp3WithElevenLabs(
  azureMp3: Uint8Array,
  config = getElevenLabsTransformConfig(),
  fetchImpl: ElevenLabsFetch = fetch
): Promise<Uint8Array> {
  const audioBuffer = new ArrayBuffer(azureMp3.byteLength);
  new Uint8Array(audioBuffer).set(azureMp3);
  const form = new FormData();
  form.append('audio', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'azure-source.mp3');
  form.append('model_id', 'eleven_multilingual_sts_v2');
  form.append('remove_background_noise', 'false');
  form.append('voice_settings', JSON.stringify({
    stability: 0.62,
    similarity_boost: 0.92,
    style: 0.08,
    use_speaker_boost: true
  }));

  const endpoint = `https://api.elevenlabs.io/v1/speech-to-speech/${encodeURIComponent(config.defaultVoiceId)}?output_format=mp3_44100_128`;
  const result = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'xi-api-key': config.apiKey
    },
    body: form
  });

  if (!result.ok) {
    const details = await result.text().catch(() => '');
    throw new Error(result.status === 429 ? 'ElevenLabs rate limit reached.' : `ElevenLabs transformation failed (${result.status})${details ? `: ${details.slice(0, 300)}` : ''}`);
  }

  const buffer = await result.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  assertMp3Payload(bytes, 'ElevenLabs returned a non-MP3 payload.');
  return bytes;
}

async function fetchExistingAzureMp3(audioUrl: string, fetchImpl: ElevenLabsFetch) {
  const response = await fetchImpl(audioUrl);
  if (!response.ok) throw new Error(`Could not fetch Azure audio (${response.status}).`);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  assertMp3Payload(bytes, 'Azure source audio is not a valid MP3 payload.');
  return bytes;
}

function assertMp3Payload(bytes: Uint8Array, message: string) {
  if (bytes.byteLength < 100) throw new Error('Audio payload was unexpectedly small.');
  const looksLikeMp3 =
    (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  if (!looksLikeMp3) throw new Error(message);
}

function parseBody(body: unknown): Record<string, unknown> | null {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
    } catch {
      return null;
    }
  }
  return typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : null;
}
