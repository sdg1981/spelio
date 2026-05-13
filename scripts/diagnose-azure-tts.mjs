const AUDIO_PIPELINE_VERSION = 'wav-24khz-ffmpeg-v2';
const AZURE_WELSH_VOICE = 'cy-GB-NiaNeural';
const AZURE_SPEECH_LOCALE = 'cy-GB';
const AZURE_SPEECH_PROSODY_RATE = '-4%';
const AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT = 'riff-24khz-16bit-mono-pcm';
const AZURE_TTS_USER_AGENT = 'SpelioAudioGeneration';
const AZURE_TTS_ENDPOINT_PATH = '/cognitiveservices/v1';

const text = (process.argv.slice(2).join(' ') || 'gwaith').trim();
const key = process.env.AZURE_SPEECH_KEY || process.env.VITE_AZURE_SPEECH_KEY;
const region = process.env.AZURE_SPEECH_REGION || process.env.VITE_AZURE_SPEECH_REGION;

if (!key || !region) {
  console.error('Azure Speech env vars are missing.', {
    audioPipelineVersion: AUDIO_PIPELINE_VERSION,
    keyConfigured: Boolean(key),
    regionConfigured: Boolean(region)
  });
  process.exit(1);
}

const endpointHost = `${region}.tts.speech.microsoft.com`;
const ssml = createWelshSsml(text);

console.info('Azure-only TTS diagnostic starting', {
  audioPipelineVersion: AUDIO_PIPELINE_VERSION,
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

console.info('Azure-only TTS diagnostic response', {
  audioPipelineVersion: AUDIO_PIPELINE_VERSION,
  status: response.status,
  ok: response.ok
});

if (!response.ok) {
  const body = (await response.text().catch(() => '')).trim().slice(0, 1000);
  console.error('Azure-only TTS diagnostic failed', {
    audioPipelineVersion: AUDIO_PIPELINE_VERSION,
    status: response.status,
    azureErrorBody: body
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
