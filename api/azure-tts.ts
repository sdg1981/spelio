declare const process: {
  env: Record<string, string | undefined>;
};

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: { ok: boolean; error?: string }) => void;
  setHeader: (name: string, value: string | string[]) => void;
  send: (body: unknown) => void;
};

declare const Buffer: {
  from: (value: ArrayBuffer | Uint8Array) => Uint8Array;
};

import { postProcessAzureWavToMp3 } from './audioPostProcessing';

export const AZURE_WELSH_VOICE = 'cy-GB-NiaNeural';
export const AZURE_SPEECH_LOCALE = 'cy-GB';
export const AZURE_SPEECH_PROSODY_RATE = '-4%';
export const AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT = 'riff-16khz-16bit-mono-pcm';

type AzureFetchResponse = {
  ok: boolean;
  status: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

type AzureFetch = (url: string, options: {
  method: 'POST';
  headers: Record<string, string>;
  body: string;
}) => Promise<AzureFetchResponse>;

type HandlerDependencies = {
  env?: Record<string, string | undefined>;
  fetchImpl?: AzureFetch;
  postProcess?: (wavAudio: ArrayBuffer) => Promise<Uint8Array>;
  logError?: (message: string, details: Record<string, unknown>) => void;
};

export default async function handler(request: ApiRequest, response: ApiResponse) {
  return handleAzureTtsRequest(request, response);
}

export async function handleAzureTtsRequest(request: ApiRequest, response: ApiResponse, dependencies: HandlerDependencies = {}) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = parseBody(request.body);
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text) return response.status(400).json({ ok: false, error: 'Welsh text is required.' });
  if (text.length > 500) return response.status(400).json({ ok: false, error: 'Welsh text is too long.' });

  const env = dependencies.env ?? process.env;
  const key = env.AZURE_SPEECH_KEY ?? env.VITE_AZURE_SPEECH_KEY;
  const region = env.AZURE_SPEECH_REGION ?? env.VITE_AZURE_SPEECH_REGION;
  if (!key || !region) {
    return response.status(500).json({ ok: false, error: 'Azure Speech is not configured.' });
  }

  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const azureResponse = await fetchImpl(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/ssml+xml',
      'Ocp-Apim-Subscription-Key': key,
      'X-Microsoft-OutputFormat': AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT
    },
    body: createWelshSsml(text)
  });

  if (!azureResponse.ok) {
    return response
      .status(azureResponse.status)
      .json({ ok: false, error: azureResponse.status === 429 ? 'Azure rate limit reached.' : `Azure synthesis failed (${azureResponse.status}).` });
  }

  const wavBuffer = await azureResponse.arrayBuffer();
  if (wavBuffer.byteLength < 100) {
    return response.status(502).json({ ok: false, error: 'Azure returned an unexpectedly small audio payload.' });
  }

  let mp3Audio: Uint8Array;
  try {
    mp3Audio = await (dependencies.postProcess ?? postProcessAzureWavToMp3)(wavBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Audio processing failed.';
    (dependencies.logError ?? console.error)('Azure audio post-processing failed', { error: message });
    return response.status(500).json({ ok: false, error: message });
  }

  response.setHeader('Content-Type', 'audio/mpeg');
  response.setHeader('Cache-Control', 'no-store');
  return response.status(200).send(Buffer.from(mp3Audio));
}

function parseBody(body: unknown): { text?: unknown } | null {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as { text?: unknown };
    } catch {
      return null;
    }
  }

  if (body && typeof body === 'object') return body as { text?: unknown };
  return null;
}

export function createWelshSsml(text: string) {
  // TODO: Add dialect-specific voice selection if Azure Welsh regional voices become practical.
  return `<speak version="1.0" xml:lang="${AZURE_SPEECH_LOCALE}"><voice xml:lang="${AZURE_SPEECH_LOCALE}" name="${AZURE_WELSH_VOICE}"><prosody rate="${AZURE_SPEECH_PROSODY_RATE}">${escapeXml(text)}</prosody></voice></speak>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
