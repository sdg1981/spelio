const AUDIO_PIPELINE_VERSION = 'wav-24khz-ffmpeg-v2';
const AZURE_WELSH_VOICE = 'cy-GB-NiaNeural';
const AZURE_SPEECH_LOCALE = 'cy-GB';
const AZURE_SPEECH_PROSODY_RATE = '-4%';
const AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT = 'riff-24khz-16bit-mono-pcm';
const AZURE_TTS_USER_AGENT = 'SpelioAudioGeneration';
const AZURE_TTS_ENDPOINT_PATH = '/cognitiveservices/v1';
const AZURE_SPEECH_KEY_ENV = 'AZURE_SPEECH_KEY';
const AZURE_SPEECH_REGION_ENV = 'AZURE_SPEECH_REGION';
const AZURE_SPEECH_ENDPOINT_ENV = 'AZURE_SPEECH_ENDPOINT';
const LEGACY_VITE_AZURE_SPEECH_KEY_ENV = 'VITE_AZURE_SPEECH_KEY';
const LEGACY_VITE_AZURE_SPEECH_REGION_ENV = 'VITE_AZURE_SPEECH_REGION';
const AZURE_TTS_AUTH_MODE = 'subscription_key_header';

const text = (process.argv.slice(2).join(' ') || 'gwaith').trim();
const config = getAzureSpeechConfig(process.env);
const key = config.key;
const region = config.region;

console.info('Azure-only TTS diagnostic configuration', {
  audioPipelineVersion: AUDIO_PIPELINE_VERSION,
  authMode: config.authMode,
  bearerTokenFlow: config.bearerTokenFlow,
  selectedKeyEnvName: config.keyEnvName ?? null,
  selectedRegionEnvName: config.regionEnvName ?? null,
  requiredEnvPresent: config.requiredEnvPresent,
  legacyEnvPresent: config.legacyEnvPresent,
  missingRequiredEnv: config.missingRequiredEnv,
  configuredEndpointHost: config.configuredEndpointHost ?? null,
  synthesisEndpointHost: config.synthesisEndpointHost ?? null,
  synthesisEndpointPath: config.synthesisEndpointPath,
  configuredEndpointMatchesDerivedHost: config.configuredEndpointMatchesDerivedHost ?? null,
  note: 'This pipeline sends Ocp-Apim-Subscription-Key directly and does not request a bearer token.'
});

if (!key || !region || !config.synthesisEndpointHost) {
  console.error('Azure Speech env vars are missing.', {
    audioPipelineVersion: AUDIO_PIPELINE_VERSION,
    keyConfigured: Boolean(key),
    regionConfigured: Boolean(region),
    missingRequiredEnv: config.missingRequiredEnv
  });
  process.exit(1);
}

const endpointHost = config.synthesisEndpointHost;
const ssml = createWelshSsml(text);

console.info('Azure-only TTS diagnostic starting', {
  audioPipelineVersion: AUDIO_PIPELINE_VERSION,
  authMode: config.authMode,
  bearerTokenFlow: config.bearerTokenFlow,
  endpointHost,
  endpointPath: AZURE_TTS_ENDPOINT_PATH,
  outputFormat: AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT,
  contentType: 'application/ssml+xml',
  userAgent: AZURE_TTS_USER_AGENT,
  voice: AZURE_WELSH_VOICE,
  locale: AZURE_SPEECH_LOCALE,
  prosodyRate: AZURE_SPEECH_PROSODY_RATE,
  ssmlLength: ssml.length,
  textLength: text.length
});

const response = await fetch(`https://${endpointHost}${AZURE_TTS_ENDPOINT_PATH}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/ssml+xml',
    'Ocp-Apim-Subscription-Key': key,
    'X-Microsoft-OutputFormat': AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT,
    'User-Agent': AZURE_TTS_USER_AGENT
  },
  body: ssml
});

const azureRequestId = getAzureRequestId(response.headers);
console.info('Azure-only TTS diagnostic response', {
  audioPipelineVersion: AUDIO_PIPELINE_VERSION,
  status: response.status,
  ok: response.ok,
  azureRequestId
});

if (!response.ok) {
  const body = createSafeResponseBodySnippet(await response.text().catch(() => ''), 1000);
  console.error('Azure-only TTS diagnostic failed', {
    audioPipelineVersion: AUDIO_PIPELINE_VERSION,
    status: response.status,
    azureRequestId,
    azureErrorBodySnippet: body
  });
  process.exit(1);
}

const wavBuffer = await response.arrayBuffer();
console.info('Azure-only TTS diagnostic succeeded', {
  audioPipelineVersion: AUDIO_PIPELINE_VERSION,
  byteLength: wavBuffer.byteLength,
  startsWithRiff: startsWithRiff(new Uint8Array(wavBuffer))
});

function createWelshSsml(value) {
  return `<speak version="1.0" xml:lang="${AZURE_SPEECH_LOCALE}"><voice xml:lang="${AZURE_SPEECH_LOCALE}" name="${AZURE_WELSH_VOICE}"><prosody rate="${AZURE_SPEECH_PROSODY_RATE}">${escapeXml(value.trim())}</prosody></voice></speak>`;
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function startsWithRiff(bytes) {
  return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
}

function getAzureSpeechConfig(env) {
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
  };
}

function hasEnvValue(value) {
  return Boolean(value?.trim());
}

function selectAzureEnvValue(env, primaryName, legacyName) {
  const primary = env[primaryName]?.trim();
  if (primary) return { value: primary, envName: primaryName };

  const legacy = env[legacyName]?.trim();
  if (legacy) return { value: legacy, envName: legacyName };

  return { value: undefined, envName: undefined };
}

function getConfiguredEndpointHost(endpoint) {
  const trimmed = endpoint?.trim().replace(/\/+$/, '');
  if (!trimmed) return undefined;

  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    return parsed.host;
  } catch {
    return 'invalid_endpoint_url';
  }
}

function getAzureRequestId(headers) {
  return [
    'x-ms-requestid',
    'x-ms-request-id',
    'apim-request-id',
    'x-requestid'
  ].map(name => headers.get(name)?.trim()).find(Boolean) ?? null;
}

function createSafeResponseBodySnippet(value, maxLength) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}
