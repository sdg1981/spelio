declare const process: {
  env: Record<string, string | undefined>;
};

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: AudioRouteJsonResponse) => void;
  setHeader: (name: string, value: string | string[]) => void;
  send: (body: unknown) => void;
};

declare const Buffer: {
  from: (value: ArrayBuffer | Uint8Array) => Uint8Array;
};

import { postProcessAzureWavToMp3 } from './audioPostProcessing.js';

console.info('audioPostProcessing helper loaded successfully', {
  helper: 'audioPostProcessing',
  importSpecifier: './audioPostProcessing.js'
});

export const AZURE_WELSH_VOICE = 'cy-GB-NiaNeural';
export const AZURE_SPEECH_LOCALE = 'cy-GB';
export const AZURE_SPEECH_PROSODY_RATE = '-4%';
export const AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT = 'riff-24khz-16bit-mono-pcm';
export const AZURE_TTS_USER_AGENT = 'SpelioAudioGeneration';
export const AUDIO_PIPELINE_VERSION = 'wav-24khz-ffmpeg-v2';
export const AZURE_TTS_ENDPOINT_PATH = '/cognitiveservices/v1';

type AudioErrorStage =
  | 'ssml_construction'
  | 'azure_configuration'
  | 'azure_request'
  | 'azure_response'
  | 'wav_received'
  | 'ffmpeg_post_processing'
  | 'mp3_returned'
  | 'unknown_route_failure';

type AudioRouteJsonResponse = {
  ok: boolean;
  error?: string;
  errorStage?: AudioErrorStage;
  audioPipelineVersion?: string;
  azureStatus?: number;
  azureErrorBody?: string;
};

type AzureFetchResponse = {
  ok: boolean;
  status: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
  text?: () => Promise<string>;
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
  logInfo?: (message: string, details: Record<string, unknown>) => void;
};

export default async function handler(request: ApiRequest, response: ApiResponse) {
  return handleAzureTtsRequest(request, response);
}

export async function handleAzureTtsRequest(request: ApiRequest, response: ApiResponse, dependencies: HandlerDependencies = {}) {
  const logInfo = dependencies.logInfo ?? console.info;
  const logError = dependencies.logError ?? console.error;

  try {
    logInfo('Azure TTS route invoked', {
      stage: 'route_start',
      audioPipelineVersion: AUDIO_PIPELINE_VERSION
    });

    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return sendJsonError(response, 405, 'Method not allowed', 'unknown_route_failure');
    }

    const body = parseBody(request.body);
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) return sendJsonError(response, 400, 'Welsh text is required.', 'ssml_construction');
    if (text.length > 500) return sendJsonError(response, 400, 'Welsh text is too long.', 'ssml_construction');

    const env = dependencies.env ?? process.env;
    const config = getAzureSpeechConfig(env);
    const key = config.key;
    const region = config.region;
    logInfo('Azure TTS configuration checked', {
      stage: 'azure_configuration',
      audioPipelineVersion: AUDIO_PIPELINE_VERSION,
      keyConfigured: Boolean(key),
      regionConfigured: Boolean(region),
      voice: AZURE_WELSH_VOICE,
      outputFormat: AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT
    });

    if (!key || !region) {
      return sendJsonError(response, 500, 'Azure Speech is not configured.', 'azure_configuration');
    }

    const ssml = createWelshSsml(text);
    logInfo('Azure TTS SSML constructed', {
      stage: 'ssml_construction',
      audioPipelineVersion: AUDIO_PIPELINE_VERSION,
      ssmlLength: ssml.length,
      textLength: text.length,
      voice: AZURE_WELSH_VOICE,
      locale: AZURE_SPEECH_LOCALE,
      prosodyRate: AZURE_SPEECH_PROSODY_RATE
    });

    const fetchImpl = dependencies.fetchImpl ?? fetch;
    const endpointHost = `${region}.tts.speech.microsoft.com`;
    const endpointUrl = `https://${endpointHost}${AZURE_TTS_ENDPOINT_PATH}`;
    logInfo('Azure TTS request starting', {
      stage: 'azure_request',
      audioPipelineVersion: AUDIO_PIPELINE_VERSION,
      endpointHost,
      endpointPath: AZURE_TTS_ENDPOINT_PATH,
      regionConfigured: true,
      keyConfigured: true,
      outputFormat: AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT,
      contentType: 'application/ssml+xml',
      userAgent: AZURE_TTS_USER_AGENT,
      voice: AZURE_WELSH_VOICE,
      ssmlLength: ssml.length
    });

    const azureResponse = await requestAzureWelshAudio(text, { key, region, fetchImpl });

    logInfo('Azure TTS response received', {
      stage: 'azure_response',
      audioPipelineVersion: AUDIO_PIPELINE_VERSION,
      status: azureResponse.status,
      ok: azureResponse.ok,
      outputFormat: AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT,
      voice: AZURE_WELSH_VOICE
    });

    if (!azureResponse.ok) {
      const azureError = await readAzureErrorBody(azureResponse);
      logError('Azure TTS synthesis failed', {
        stage: 'azure_response',
        audioPipelineVersion: AUDIO_PIPELINE_VERSION,
        status: azureResponse.status,
        outputFormat: AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT,
        voice: AZURE_WELSH_VOICE,
        regionConfigured: true,
        ssmlLength: ssml.length,
        azureError
      });
      return sendJsonError(
        response,
        azureResponse.status,
        azureResponse.status === 429 ? 'Azure rate limit reached.' : createAzureFailureMessage(azureResponse.status, azureError),
        'azure_response',
        {
          azureStatus: azureResponse.status,
          azureErrorBody: azureError
        }
      );
    }

    const wavBuffer = await azureResponse.arrayBuffer();
    logInfo('Azure TTS WAV buffer received', {
      stage: 'wav_received',
      audioPipelineVersion: AUDIO_PIPELINE_VERSION,
      byteLength: wavBuffer.byteLength,
      outputFormat: AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT
    });

    if (wavBuffer.byteLength < 100) {
      logError('Azure TTS returned a small WAV payload', {
        stage: 'wav_received',
        audioPipelineVersion: AUDIO_PIPELINE_VERSION,
        byteLength: wavBuffer.byteLength
      });
      return sendJsonError(response, 502, 'Azure returned an unexpectedly small audio payload.', 'wav_received');
    }

    let mp3Audio: Uint8Array;
    try {
      logInfo('Audio post-processing starting', {
        stage: 'ffmpeg_post_processing',
        audioPipelineVersion: AUDIO_PIPELINE_VERSION,
        inputBytes: wavBuffer.byteLength
      });
      mp3Audio = await processAzureWelshAudio(wavBuffer, dependencies.postProcess);
      logInfo('Audio post-processing finished', {
        stage: 'mp3_returned',
        audioPipelineVersion: AUDIO_PIPELINE_VERSION,
        outputBytes: mp3Audio.byteLength
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Audio processing failed.';
      logError('Azure audio post-processing failed', {
        stage: 'ffmpeg_post_processing',
        audioPipelineVersion: AUDIO_PIPELINE_VERSION,
        error: message
      });
      return sendJsonError(response, 500, `FFmpeg post-processing failed: ${message}`, 'ffmpeg_post_processing');
    }

    response.setHeader('Content-Type', 'audio/mpeg');
    response.setHeader('Cache-Control', 'no-store');
    return response.status(200).send(Buffer.from(mp3Audio));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown route failure.';
    logError('Azure TTS route failed unexpectedly', {
      stage: 'unknown_route_failure',
      audioPipelineVersion: AUDIO_PIPELINE_VERSION,
      error: message
    });
    return sendJsonError(response, 500, `Unknown audio route failure: ${message}`, 'unknown_route_failure');
  }
}

export function getAzureSpeechConfig(env: Record<string, string | undefined>) {
  return {
    key: env.AZURE_SPEECH_KEY ?? env.VITE_AZURE_SPEECH_KEY,
    region: env.AZURE_SPEECH_REGION ?? env.VITE_AZURE_SPEECH_REGION
  };
}

export async function synthesizeAzureWelshMp3Bytes(
  text: string,
  dependencies: Pick<HandlerDependencies, 'env' | 'fetchImpl' | 'postProcess'> = {}
) {
  const env = dependencies.env ?? process.env;
  const { key, region } = getAzureSpeechConfig(env);
  if (!key || !region) {
    throw new Error('Azure Speech is not configured.');
  }

  const azureResponse = await requestAzureWelshAudio(text, {
    key,
    region,
    fetchImpl: dependencies.fetchImpl ?? fetch
  });

  if (!azureResponse.ok) {
    const azureError = await readAzureErrorBody(azureResponse);
    throw new Error(azureResponse.status === 429 ? 'Azure rate limit reached.' : createAzureFailureMessage(azureResponse.status, azureError));
  }

  const wavBuffer = await azureResponse.arrayBuffer();
  if (wavBuffer.byteLength < 100) {
    throw new Error('Azure returned an unexpectedly small audio payload.');
  }

  return processAzureWelshAudio(wavBuffer, dependencies.postProcess);
}

function requestAzureWelshAudio(text: string, options: {
  key: string;
  region: string;
  fetchImpl: AzureFetch;
}) {
  const endpointUrl = `https://${options.region}.tts.speech.microsoft.com${AZURE_TTS_ENDPOINT_PATH}`;
  return options.fetchImpl(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/ssml+xml',
      'Ocp-Apim-Subscription-Key': options.key,
      'X-Microsoft-OutputFormat': AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT,
      'User-Agent': AZURE_TTS_USER_AGENT
    },
    body: createWelshSsml(text)
  });
}

function processAzureWelshAudio(wavBuffer: ArrayBuffer, postProcess?: (wavAudio: ArrayBuffer) => Promise<Uint8Array>) {
  return (postProcess ?? postProcessAzureWavToMp3)(wavBuffer);
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
  return `<speak version="1.0" xml:lang="${AZURE_SPEECH_LOCALE}"><voice xml:lang="${AZURE_SPEECH_LOCALE}" name="${AZURE_WELSH_VOICE}"><prosody rate="${AZURE_SPEECH_PROSODY_RATE}">${escapeXml(text.trim())}</prosody></voice></speak>`;
}

async function readAzureErrorBody(azureResponse: AzureFetchResponse) {
  if (!azureResponse.text) return '';

  try {
    return (await azureResponse.text()).trim().slice(0, 500);
  } catch {
    return '';
  }
}

function createAzureFailureMessage(status: number, azureError: string) {
  const suffix = azureError ? `: ${azureError}` : '';
  return `Azure synthesis failed (${status})${suffix}`;
}

function sendJsonError(
  response: ApiResponse,
  status: number,
  error: string,
  errorStage: AudioErrorStage,
  extra: Partial<AudioRouteJsonResponse> = {}
) {
  return response.status(status).json({
    ok: false,
    error,
    errorStage,
    audioPipelineVersion: AUDIO_PIPELINE_VERSION,
    ...extra
  });
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
