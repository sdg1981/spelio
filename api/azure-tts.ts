declare const process: {
  env: Record<string, string | undefined>;
};

type ApiRequest = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
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
import { getAzureTtsTextLimit, normalizeAzureTtsPurpose, type AzureTtsPurpose } from '../src/lib/azureTtsLimits.js';
import {
  AZURE_ENGLISH_SPEECH_LOCALE,
  AZURE_ENGLISH_VOICE,
  AZURE_SPEECH_LOCALE,
  AZURE_SPEECH_PROSODY_RATE,
  AZURE_WELSH_VOICE,
  createAzureSsml,
  getAzureVoiceConfig,
  type AzureSpeechLanguage,
  type AzureVoiceConfig
} from '../src/lib/azureSpeech.js';

export {
  AZURE_ENGLISH_SPEECH_LOCALE,
  AZURE_ENGLISH_VOICE,
  AZURE_SPEECH_LOCALE,
  AZURE_SPEECH_PROSODY_RATE,
  AZURE_WELSH_VOICE,
  createEnglishSsml,
  createWelshSsml,
  getAzureVoiceConfig
} from '../src/lib/azureSpeech.js';

console.info('audioPostProcessing helper loaded successfully', {
  helper: 'audioPostProcessing',
  importSpecifier: './audioPostProcessing.js'
});

export const AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT = 'riff-24khz-16bit-mono-pcm';
export const AZURE_TTS_USER_AGENT = 'SpelioAudioGeneration';
export const AUDIO_PIPELINE_VERSION = 'wav-24khz-ffmpeg-v2';
export const AZURE_TTS_ENDPOINT_PATH = '/cognitiveservices/v1';
export const AZURE_SPEECH_KEY_ENV = 'AZURE_SPEECH_KEY';
export const AZURE_SPEECH_REGION_ENV = 'AZURE_SPEECH_REGION';
export const AZURE_SPEECH_ENDPOINT_ENV = 'AZURE_SPEECH_ENDPOINT';
export const LEGACY_VITE_AZURE_SPEECH_KEY_ENV = 'VITE_AZURE_SPEECH_KEY';
export const LEGACY_VITE_AZURE_SPEECH_REGION_ENV = 'VITE_AZURE_SPEECH_REGION';
export const AZURE_TTS_AUTH_MODE = 'subscription_key_header';

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
  audioPurpose?: AzureTtsPurpose;
  textLength?: number;
  textLimit?: number;
  requestedLanguage?: AzureSpeechLanguage;
  requestedLocale?: string;
  requestedVoice?: string;
  azureStatus?: number;
  azureErrorBody?: string;
  azureRequestId?: string | null;
};

type AzureFetchResponse = {
  ok: boolean;
  status: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
  text?: () => Promise<string>;
  headers?: {
    get: (name: string) => string | null;
  };
};

type AzureFetch = (url: string, options: {
  method: 'POST';
  headers: Record<string, string>;
  body: string;
}) => Promise<AzureFetchResponse>;

export type AzureSynthesisStage =
  | 'azure_configuration'
  | 'azure_request'
  | 'azure_response'
  | 'wav_received'
  | 'post_processing';

export class AzureSynthesisError extends Error {
  stage: AzureSynthesisStage;
  azureStatus?: number;
  azureError?: string;
  wavByteLength?: number;

  constructor(message: string, details: {
    stage: AzureSynthesisStage;
    azureStatus?: number;
    azureError?: string;
    wavByteLength?: number;
  }) {
    super(message);
    this.name = 'AzureSynthesisError';
    this.stage = details.stage;
    this.azureStatus = details.azureStatus;
    this.azureError = details.azureError;
    this.wavByteLength = details.wavByteLength;
  }
}

export type AzureWelshMp3Diagnostics = {
  mp3Bytes: Uint8Array;
  azureStatus: number;
  wavByteLength: number;
  mp3ByteLength: number;
};

type HandlerDependencies = {
  env?: Record<string, string | undefined>;
  fetchImpl?: AzureFetch;
  postProcess?: (wavAudio: ArrayBuffer) => Promise<Uint8Array>;
  logError?: (message: string, details: Record<string, unknown>) => void;
  logInfo?: (message: string, details: Record<string, unknown>) => void;
};

type AzureSpeechConfig = {
  key?: string;
  region?: string;
  keyEnvName?: string;
  regionEnvName?: string;
  requiredEnvPresent: Record<typeof AZURE_SPEECH_KEY_ENV | typeof AZURE_SPEECH_REGION_ENV, boolean>;
  legacyEnvPresent: Record<typeof LEGACY_VITE_AZURE_SPEECH_KEY_ENV | typeof LEGACY_VITE_AZURE_SPEECH_REGION_ENV, boolean>;
  missingRequiredEnv: string[];
  configuredEndpointHost?: string;
  configuredEndpointMatchesDerivedHost?: boolean;
  synthesisEndpointHost?: string;
  synthesisEndpointPath: typeof AZURE_TTS_ENDPOINT_PATH;
  authMode: typeof AZURE_TTS_AUTH_MODE;
  bearerTokenFlow: false;
};

export default async function handler(request: ApiRequest, response: ApiResponse) {
  return handleAzureTtsRequest(request, response);
}

export async function handleAzureTtsRequest(request: ApiRequest, response: ApiResponse, dependencies: HandlerDependencies = {}) {
  const logInfo = dependencies.logInfo ?? console.info;
  const logError = dependencies.logError ?? console.error;

  try {
    setNativeWebViewCorsHeaders(request, response);

    logInfo('Azure TTS route invoked', {
      stage: 'route_start',
      audioPipelineVersion: AUDIO_PIPELINE_VERSION
    });

    if (request.method === 'OPTIONS') {
      response.setHeader('Allow', 'OPTIONS, POST');
      return response.status(204).send('');
    }

    if (request.method !== 'POST') {
      response.setHeader('Allow', 'OPTIONS, POST');
      return sendJsonError(response, 405, 'Method not allowed', 'unknown_route_failure');
    }

    const body = parseBody(request.body);
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const audioPurpose = normalizeAzureTtsPurpose(body?.purpose);
    const textLimit = getAzureTtsTextLimit(audioPurpose);
    const voiceConfig = getAzureVoiceConfig(body?.language);
    if (!text) return sendJsonError(response, 400, 'Text is required.', 'ssml_construction');
    if (text.length > textLimit) {
      return sendJsonError(
        response,
        400,
        `Text is too long for ${audioPurpose === 'collection_intro' ? 'collection intro narration' : 'short audio'} (max ${textLimit} characters).`,
        'ssml_construction',
        { audioPurpose, textLength: text.length, textLimit }
      );
    }

    const env = dependencies.env ?? process.env;
    const config = getAzureSpeechConfig(env);
    const key = config.key;
    const region = config.region;
    const endpointHost = config.synthesisEndpointHost;
    logInfo('Azure TTS configuration checked', {
      stage: 'azure_configuration',
      audioPipelineVersion: AUDIO_PIPELINE_VERSION,
      authMode: config.authMode,
      bearerTokenFlow: config.bearerTokenFlow,
      keyConfigured: Boolean(key),
      regionConfigured: Boolean(region),
      selectedKeyEnvName: config.keyEnvName ?? null,
      selectedRegionEnvName: config.regionEnvName ?? null,
      requiredEnvPresent: config.requiredEnvPresent,
      legacyEnvPresent: config.legacyEnvPresent,
      missingRequiredEnv: config.missingRequiredEnv,
      configuredEndpointHost: config.configuredEndpointHost ?? null,
      synthesisEndpointHost: config.synthesisEndpointHost ?? null,
      synthesisEndpointPath: config.synthesisEndpointPath,
      configuredEndpointMatchesDerivedHost: config.configuredEndpointMatchesDerivedHost ?? null,
      voice: voiceConfig.voice,
      locale: voiceConfig.locale,
      outputFormat: AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT,
      audioPurpose,
      textLength: text.length,
      textLimit
    });

    if (!key || !region || !endpointHost) {
      return sendJsonError(response, 500, 'Azure Speech is not configured.', 'azure_configuration');
    }

    const ssml = createAzureSsml(text, voiceConfig);
    logInfo('Azure TTS SSML constructed', {
      stage: 'ssml_construction',
      audioPipelineVersion: AUDIO_PIPELINE_VERSION,
      ssmlLength: ssml.length,
      textLength: text.length,
      textLimit,
      audioPurpose,
      voice: voiceConfig.voice,
      locale: voiceConfig.locale,
      prosodyRate: AZURE_SPEECH_PROSODY_RATE
    });

    const fetchImpl = dependencies.fetchImpl ?? fetch;
    logInfo('Azure TTS request starting', {
      stage: 'azure_request',
      audioPipelineVersion: AUDIO_PIPELINE_VERSION,
      endpointHost,
      endpointPath: AZURE_TTS_ENDPOINT_PATH,
      authMode: config.authMode,
      bearerTokenFlow: config.bearerTokenFlow,
      regionConfigured: true,
      keyConfigured: true,
      outputFormat: AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT,
      contentType: 'application/ssml+xml',
      userAgent: AZURE_TTS_USER_AGENT,
      voice: voiceConfig.voice,
      ssmlLength: ssml.length,
      audioPurpose
    });

    const azureResponse = await requestAzureAudio(text, { key, endpointHost, fetchImpl, voiceConfig });
    const azureRequestId = getAzureRequestId(azureResponse);

    logInfo('Azure TTS response received', {
      stage: 'azure_response',
      audioPipelineVersion: AUDIO_PIPELINE_VERSION,
      status: azureResponse.status,
      ok: azureResponse.ok,
      azureRequestId,
      outputFormat: AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT,
      voice: voiceConfig.voice
    });

    if (!azureResponse.ok) {
      const azureError = await readAzureErrorBody(azureResponse);
      logError('Azure TTS synthesis failed', {
        stage: 'azure_response',
        audioPipelineVersion: AUDIO_PIPELINE_VERSION,
        status: azureResponse.status,
        azureRequestId,
        authMode: config.authMode,
        bearerTokenFlow: config.bearerTokenFlow,
        endpointHost,
        endpointPath: AZURE_TTS_ENDPOINT_PATH,
        outputFormat: AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT,
        voice: voiceConfig.voice,
        regionConfigured: true,
        ssmlLength: ssml.length,
        azureErrorSnippet: azureError
      });
      return sendJsonError(
        response,
        azureResponse.status,
        azureResponse.status === 429 ? 'Azure rate limit reached.' : createAzureFailureMessage(azureResponse.status, azureError),
        'azure_response',
        {
          azureStatus: azureResponse.status,
          azureErrorBody: azureError,
          azureRequestId
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
      mp3Audio = await processAzureAudio(wavBuffer, dependencies.postProcess);
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
    response.setHeader('X-Spelio-Azure-Language', voiceConfig.language);
    response.setHeader('X-Spelio-Azure-Locale', voiceConfig.locale);
    response.setHeader('X-Spelio-Azure-Voice', voiceConfig.voice);
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
  const key = selectAzureEnvValue(env, AZURE_SPEECH_KEY_ENV, LEGACY_VITE_AZURE_SPEECH_KEY_ENV);
  const region = selectAzureEnvValue(env, AZURE_SPEECH_REGION_ENV, LEGACY_VITE_AZURE_SPEECH_REGION_ENV);
  const synthesisEndpointHost = region.value ? `${region.value}.tts.speech.microsoft.com` : undefined;
  const configuredEndpointHost = getConfiguredEndpointHost(env[AZURE_SPEECH_ENDPOINT_ENV]);

  return {
    key: key.value,
    region: region.value,
    keyEnvName: key.envName,
    regionEnvName: region.envName,
    requiredEnvPresent: {
      [AZURE_SPEECH_KEY_ENV]: hasEnvValue(env[AZURE_SPEECH_KEY_ENV]),
      [AZURE_SPEECH_REGION_ENV]: hasEnvValue(env[AZURE_SPEECH_REGION_ENV])
    },
    legacyEnvPresent: {
      [LEGACY_VITE_AZURE_SPEECH_KEY_ENV]: hasEnvValue(env[LEGACY_VITE_AZURE_SPEECH_KEY_ENV]),
      [LEGACY_VITE_AZURE_SPEECH_REGION_ENV]: hasEnvValue(env[LEGACY_VITE_AZURE_SPEECH_REGION_ENV])
    },
    missingRequiredEnv: [
      key.value ? '' : AZURE_SPEECH_KEY_ENV,
      region.value ? '' : AZURE_SPEECH_REGION_ENV
    ].filter(Boolean),
    configuredEndpointHost,
    configuredEndpointMatchesDerivedHost: configuredEndpointHost && synthesisEndpointHost
      ? configuredEndpointHost === synthesisEndpointHost
      : undefined,
    synthesisEndpointHost,
    synthesisEndpointPath: AZURE_TTS_ENDPOINT_PATH,
    authMode: AZURE_TTS_AUTH_MODE,
    bearerTokenFlow: false
  } satisfies AzureSpeechConfig;
}

export async function synthesizeAzureWelshMp3Bytes(
  text: string,
  dependencies: Pick<HandlerDependencies, 'env' | 'fetchImpl' | 'postProcess'> = {}
) {
  const result = await synthesizeAzureWelshMp3BytesWithDiagnostics(text, dependencies);
  return result.mp3Bytes;
}

export async function synthesizeAzureWelshMp3BytesWithDiagnostics(
  text: string,
  dependencies: Pick<HandlerDependencies, 'env' | 'fetchImpl' | 'postProcess'> = {}
): Promise<AzureWelshMp3Diagnostics> {
  const env = dependencies.env ?? process.env;
  const config = getAzureSpeechConfig(env);
  const { key } = config;
  const endpointHost = config.synthesisEndpointHost;
  if (!key || !endpointHost) {
    throw new AzureSynthesisError('Azure Speech is not configured.', { stage: 'azure_configuration' });
  }

  let azureResponse: AzureFetchResponse;
  try {
    azureResponse = await requestAzureAudio(text, {
      key,
      endpointHost,
      fetchImpl: dependencies.fetchImpl ?? fetch,
      voiceConfig: getAzureVoiceConfig('cy')
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Azure Speech request failed.';
    throw new AzureSynthesisError(message, { stage: 'azure_request' });
  }

  if (!azureResponse.ok) {
    const azureError = await readAzureErrorBody(azureResponse);
    throw new AzureSynthesisError(
      azureResponse.status === 429 ? 'Azure rate limit reached.' : createAzureFailureMessage(azureResponse.status, azureError),
      { stage: 'azure_response', azureStatus: azureResponse.status, azureError }
    );
  }

  const wavBuffer = await azureResponse.arrayBuffer();
  if (wavBuffer.byteLength < 100) {
    throw new AzureSynthesisError('Azure returned an unexpectedly small audio payload.', {
      stage: 'wav_received',
      azureStatus: azureResponse.status,
      wavByteLength: wavBuffer.byteLength
    });
  }

  try {
    const mp3Bytes = await processAzureAudio(wavBuffer, dependencies.postProcess);
    return {
      mp3Bytes,
      azureStatus: azureResponse.status,
      wavByteLength: wavBuffer.byteLength,
      mp3ByteLength: mp3Bytes.byteLength
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Audio post-processing failed.';
    throw new AzureSynthesisError(message, {
      stage: 'post_processing',
      azureStatus: azureResponse.status,
      wavByteLength: wavBuffer.byteLength
    });
  }
}

function requestAzureAudio(text: string, options: {
  key: string;
  endpointHost: string;
  fetchImpl: AzureFetch;
  voiceConfig: AzureVoiceConfig;
}) {
  const endpointUrl = `https://${options.endpointHost}${AZURE_TTS_ENDPOINT_PATH}`;
  return options.fetchImpl(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/ssml+xml',
      'Ocp-Apim-Subscription-Key': options.key,
      'X-Microsoft-OutputFormat': AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT,
      'User-Agent': AZURE_TTS_USER_AGENT
    },
    body: createAzureSsml(text, options.voiceConfig)
  });
}

function processAzureAudio(wavBuffer: ArrayBuffer, postProcess?: (wavAudio: ArrayBuffer) => Promise<Uint8Array>) {
  return (postProcess ?? postProcessAzureWavToMp3)(wavBuffer);
}

function parseBody(body: unknown): { text?: unknown; language?: unknown; purpose?: unknown } | null {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as { text?: unknown; language?: unknown; purpose?: unknown };
    } catch {
      return null;
    }
  }

  if (body && typeof body === 'object') return body as { text?: unknown; language?: unknown; purpose?: unknown };
  return null;
}

const NATIVE_WEB_VIEW_ORIGINS = new Set([
  'capacitor://localhost',
  'ionic://localhost'
]);

function setNativeWebViewCorsHeaders(request: ApiRequest, response: ApiResponse) {
  const originHeader = Object.entries(request.headers ?? {})
    .find(([name]) => name.toLowerCase() === 'origin')?.[1];
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  if (!origin || !NATIVE_WEB_VIEW_ORIGINS.has(origin)) return;

  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Vary', 'Origin');
}

async function readAzureErrorBody(azureResponse: AzureFetchResponse) {
  if (!azureResponse.text) return '';

  try {
    return createSafeResponseBodySnippet(await azureResponse.text(), 500);
  } catch {
    return '';
  }
}

function getAzureRequestId(azureResponse: AzureFetchResponse) {
  if (!azureResponse.headers) return null;
  return [
    'x-ms-requestid',
    'x-ms-request-id',
    'apim-request-id',
    'x-requestid'
  ].map(name => azureResponse.headers?.get(name)?.trim()).find(Boolean) ?? null;
}

function createSafeResponseBodySnippet(value: string, maxLength: number) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function hasEnvValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function selectAzureEnvValue(
  env: Record<string, string | undefined>,
  primaryName: string,
  legacyName: string
) {
  const primary = env[primaryName]?.trim();
  if (primary) return { value: primary, envName: primaryName };

  const legacy = env[legacyName]?.trim();
  if (legacy) return { value: legacy, envName: legacyName };

  return { value: undefined, envName: undefined };
}

function getConfiguredEndpointHost(endpoint: string | undefined) {
  const trimmed = endpoint?.trim().replace(/\/+$/, '');
  if (!trimmed) return undefined;

  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    return parsed.host;
  } catch {
    return 'invalid_endpoint_url';
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
