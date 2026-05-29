import {
  AUDIO_PIPELINE_VERSION,
  AZURE_ENGLISH_SPEECH_LOCALE,
  AZURE_ENGLISH_VOICE,
  AZURE_SPEECH_PROSODY_RATE,
  AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT,
  AzureSynthesisError,
  createEnglishSsml,
  createWelshSsml,
  handleAzureTtsRequest,
  synthesizeAzureWelshMp3BytesWithDiagnostics
} from '../api/azure-tts.js';
import {
  ELEVENLABS_DIRECT_TTS_MODEL_ID,
  ELEVENLABS_DIRECT_TTS_PROMPT,
  synthesizeWelshTextWithElevenLabs
} from '../api/elevenlabs-transform.js';
import {
  AUDIO_FADE_OUT_SECONDS,
  AUDIO_TRAILING_SILENCE_SAMPLES,
  AUDIO_TRAILING_SILENCE_SECONDS,
  AZURE_TRANSFORM_GAIN_DB,
  AZURE_TRANSFORM_LOUDNESS_TARGET,
  CONTEXT_EXTRACT_FADE_IN_SECONDS,
  createContextFinalChunkExtractionArgs,
  createAudioPostProcessingFilter,
  createAzureTransformPostProcessingArgs,
  createAzureTransformPostProcessingFilter,
  createFfmpegPostProcessingArgs,
  getContextExtractionFallbackSeconds,
  getContextExtractionWindowSeconds,
  resolveFfmpegPath
} from '../api/audioPostProcessing.js';
import { createAudioStoragePath, createInterfaceAudioStoragePath, createPrimerAudioStoragePath, createWelshSsml as createAdminWelshSsml } from '../src/admin/services/audioGeneration';

type TestResponseBody = Uint8Array | {
  ok: boolean;
  error?: string;
  errorStage?: string;
  audioPipelineVersion?: string;
  requestedLanguage?: string;
  requestedLocale?: string;
  requestedVoice?: string;
  azureStatus?: number;
  azureErrorBody?: string;
} | null;

type TestResponse = {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: TestResponseBody;
  status: (code: number) => TestResponse;
  json: (body: Exclude<TestResponseBody, Uint8Array | null>) => void;
  setHeader: (name: string, value: string | string[]) => void;
  send: (body: unknown) => void;
};

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function createResponse(): TestResponse {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    send(body) {
      this.body = body as TestResponseBody;
    }
  };
}

function makeAudioBuffer(byteLength = 128) {
  const bytes = new Uint8Array(byteLength);
  bytes[0] = 0x52;
  bytes[1] = 0x49;
  bytes[2] = 0x46;
  bytes[3] = 0x46;
  return bytes.buffer;
}

function makeMp3Buffer(byteLength = 128) {
  const bytes = new Uint8Array(byteLength);
  bytes[0] = 0x49;
  bytes[1] = 0x44;
  bytes[2] = 0x33;
  return bytes.buffer;
}

const ssml = createWelshSsml('cân & gwaith');
assert(
  ssml.includes(`<prosody rate="${AZURE_SPEECH_PROSODY_RATE}">cân &amp; gwaith</prosody>`),
  'Azure SSML should include escaped text inside the subtle prosody rate wrapper.'
);
assert(
  /^<speak version="1\.0" xml:lang="cy-GB"><voice xml:lang="cy-GB" name="cy-GB-NiaNeural"><prosody rate="-4%">.+<\/prosody><\/voice><\/speak>$/.test(ssml),
  'Azure SSML should keep prosody inside a valid voice element.'
);
const escapedSsml = createWelshSsml(' <tag> "quote" & \'apostrophe\' ');
assert(
  escapedSsml.includes('&lt;tag&gt; &quot;quote&quot; &amp; &apos;apostrophe&apos;'),
  'Azure SSML should XML-escape Welsh text before insertion.'
);
assert(
  createAdminWelshSsml('cân').includes(`<prosody rate="${AZURE_SPEECH_PROSODY_RATE}">cân</prosody>`),
  'Admin SSML helper should expose the same subtle prosody rate.'
);
const englishSsml = createEnglishSsml('You can replay the word.');
assert(
  englishSsml.includes(`xml:lang="${AZURE_ENGLISH_SPEECH_LOCALE}"`) && englishSsml.includes(`name="${AZURE_ENGLISH_VOICE}"`),
  'English helper audio should use the configured English Azure voice and locale.'
);
assertEqual(
  createAudioStoragePath({ listId: 'support_ff', id: 'support_ff_006' }),
  'cy/support/support-ff/support-ff-006.mp3',
  'Support-list audio should be stored under a support-list-specific path.'
);
assertEqual(
  createAudioStoragePath({ listId: 'support_w', id: 'support_w_001' }),
  'cy/support/support-w/support-w-001.mp3',
  'Split support W audio should use the support-w storage path.'
);
assertEqual(
  createAudioStoragePath({ listId: 'support_y', id: 'support_y_001' }),
  'cy/support/support-y/support-y-001.mp3',
  'Split support Y audio should use the support-y storage path.'
);
assertEqual(
  createAudioStoragePath({ listId: 'foundations_first_words', id: 'foundations_first_words_001' }),
  'cy/foundations-first-words/foundations-first-words-001.mp3',
  'Normal list audio should keep the existing list-scoped path.'
);
assertEqual(
  createInterfaceAudioStoragePath({ key: 'practice_struggle_assist', language: 'en' }),
  'interface/practice-struggle-assist/en.mp3',
  'Interface helper audio should use a stable non-word queue storage path.'
);
assertEqual(
  createPrimerAudioStoragePath('foundation_patterns_d_dd', 'dd_sound', 'azure'),
  'cy-primer/foundation-patterns-d-dd/dd-sound.mp3',
  'Primer Azure audio should use a stable list-scoped non-word storage path.'
);
assertEqual(
  createPrimerAudioStoragePath('foundation_patterns_d_dd', 'dd_sound', 'elevenlabs'),
  'cy-primer-elevenlabs/foundation-patterns-d-dd/dd-sound.mp3',
  'Primer ElevenLabs audio should use a separate list-scoped non-word storage path.'
);

const filter = createAudioPostProcessingFilter();
assert(filter.includes('loudnorm=I=-20:TP=-3:LRA=13:linear=true'), 'Post-processing should include gentle loudness normalisation.');
assert(filter.includes(`afade=t=in:d=${AUDIO_FADE_OUT_SECONDS}`), 'Post-processing should include a tiny end fade.');
assertEqual(AUDIO_TRAILING_SILENCE_SECONDS, 0.15, 'Trailing silence should remain approximately 150ms.');
assert(filter.includes(`apad=pad_len=${AUDIO_TRAILING_SILENCE_SAMPLES}`), 'Post-processing should include trailing silence padding.');

const args = createFfmpegPostProcessingArgs('/tmp/input.wav', '/tmp/output.mp3');
assert(args.includes('libmp3lame'), 'FFmpeg should encode the final output as MP3.');
assert(args.includes('32k'), 'FFmpeg should preserve the existing 32k MP3 bitrate expectation.');
const azureTransformFilter = createAzureTransformPostProcessingFilter();
assert(azureTransformFilter.includes(`loudnorm=${AZURE_TRANSFORM_LOUDNESS_TARGET}`), 'Azure-transform post-processing should use the stronger speech loudness target.');
assert(azureTransformFilter.includes(`volume=${AZURE_TRANSFORM_GAIN_DB}dB`), 'Azure-transform post-processing should apply the configured small gain lift.');
assert(azureTransformFilter.includes('alimiter=limit=0.95'), 'Azure-transform post-processing should include a conservative limiter after gain.');
assert(
  createAzureTransformPostProcessingArgs('/tmp/sts.mp3', '/tmp/matched.mp3').includes(createAzureTransformPostProcessingFilter()),
  'Azure-transform FFmpeg args should use the dedicated matched-loudness filter.'
);
assertEqual(getContextExtractionFallbackSeconds(1), 1.1, 'Context extraction should keep last-word fallback timing as the default.');
assertEqual(getContextExtractionFallbackSeconds(2), 1.8, 'Context extraction should support a wider fallback window for two final chunks.');
assertEqual(getContextExtractionFallbackSeconds(3), 2.5, 'Context extraction should support a wider fallback window for three final chunks.');
assert(
  createContextFinalChunkExtractionArgs('/tmp/context.mp3', '/tmp/final.mp3', 2).includes('-1.72'),
  'Context extraction FFmpeg args should respect the selected final chunk count and default start trim.'
);
assertEqual(getContextExtractionWindowSeconds(1, 80), 1.02, 'Context extraction should trim the extraction start by the default offset.');
assertEqual(getContextExtractionWindowSeconds(1, 140), 0.9600000000000001, 'Context extraction should support a tighter start offset.');
assert(
  createContextFinalChunkExtractionArgs('/tmp/context.mp3', '/tmp/final.mp3', 1, 220).includes('-0.8800000000000001'),
  'Context extraction FFmpeg args should apply the selected start trim offset.'
);
assert(
  createContextFinalChunkExtractionArgs('/tmp/context.mp3', '/tmp/final.mp3', 1, 80).some(arg => arg.includes(`afade=t=in:d=${CONTEXT_EXTRACT_FADE_IN_SECONDS}`)),
  'Context extraction should add a tiny fade-in after the tighter start cut.'
);

void runAsyncAssertions();

async function runAsyncAssertions() {
  const overrideFfmpegPath = await resolveFfmpegPath(
    {
      readFile: async () => new Uint8Array([1])
    },
    { FFMPEG_PATH: '/custom/ffmpeg' },
    '/bundled/ffmpeg'
  );
  assertEqual(overrideFfmpegPath, '/custom/ffmpeg', 'FFmpeg resolution should prefer explicit FFMPEG_PATH.');

  const packageFfmpegPath = await resolveFfmpegPath(
    {
      readFile: async () => new Uint8Array([1])
    },
    {},
    '/bundled/ffmpeg'
  );
  assertEqual(packageFfmpegPath, '/bundled/ffmpeg', 'FFmpeg resolution should fall back to bundled ffmpeg-static path.');

  let requestedOutputFormat = '';
  let requestedSsml = '';
  let postProcessCalled = false;
  const response = createResponse();
  await handleAzureTtsRequest(
    { method: 'POST', body: { text: 'gwaith' } },
    response,
    {
      env: {
        AZURE_SPEECH_KEY: 'test-key',
        AZURE_SPEECH_REGION: 'uksouth'
      },
      fetchImpl: async (_url, options) => {
        requestedOutputFormat = options.headers['X-Microsoft-OutputFormat'];
        requestedSsml = options.body;
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => makeAudioBuffer()
        };
      },
      postProcess: async wavAudio => {
        postProcessCalled = true;
        assertEqual(wavAudio.byteLength, 128, 'Post-processing should receive the Azure WAV payload before the response is sent.');
        const mp3Bytes = new Uint8Array(128);
        mp3Bytes[0] = 0x49;
        mp3Bytes[1] = 0x44;
        mp3Bytes[2] = 0x33;
        return mp3Bytes;
      },
      logError: () => undefined,
      logInfo: () => undefined
    }
  );

  assertEqual(response.statusCode, 200, 'Successful audio generation should return HTTP 200.');
  assertEqual(response.headers['Content-Type'], 'audio/mpeg', 'Processed audio response should remain MP3.');
  assertEqual(response.headers['X-Spelio-Azure-Language'], 'cy', 'Welsh route responses should expose the selected language diagnostic.');
  assertEqual(response.headers['X-Spelio-Azure-Locale'], 'cy-GB', 'Welsh route responses should expose the selected Azure locale.');
  assertEqual(response.headers['X-Spelio-Azure-Voice'], 'cy-GB-NiaNeural', 'Welsh route responses should expose the selected Azure voice.');
  assertEqual(requestedOutputFormat, AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT, 'Azure should be asked for WAV intermediate audio.');
  assertEqual(requestedOutputFormat, 'riff-24khz-16bit-mono-pcm', 'Azure should use a supported RIFF/WAV intermediate output format.');
  assert(requestedSsml.includes(`<prosody rate="${AZURE_SPEECH_PROSODY_RATE}">gwaith</prosody>`), 'Azure request should include subtle prosody rate SSML.');
  assert(postProcessCalled, 'The route should post-process Azure audio before returning it for upload.');
  assert(response.body instanceof Uint8Array && response.body[0] === 0x49, 'The route should send the processed MP3 bytes.');

  let englishRequestedSsml = '';
  const englishResponse = createResponse();
  await handleAzureTtsRequest(
    { method: 'POST', body: { text: 'You can replay the word.', language: 'en' } },
    englishResponse,
    {
      env: {
        AZURE_SPEECH_KEY: 'test-key',
        AZURE_SPEECH_REGION: 'uksouth'
      },
      fetchImpl: async (_url, options) => {
        englishRequestedSsml = options.body;
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => makeAudioBuffer()
        };
      },
      postProcess: async () => {
        const mp3Bytes = new Uint8Array(128);
        mp3Bytes[0] = 0x49;
        mp3Bytes[1] = 0x44;
        mp3Bytes[2] = 0x33;
        return mp3Bytes;
      },
      logError: () => undefined,
      logInfo: () => undefined
    }
  );
  assertEqual(englishResponse.headers['X-Spelio-Azure-Language'], 'en', 'English helper route responses should expose the selected language diagnostic.');
  assertEqual(englishResponse.headers['X-Spelio-Azure-Locale'], AZURE_ENGLISH_SPEECH_LOCALE, 'English helper route responses should expose the English Azure locale.');
  assertEqual(englishResponse.headers['X-Spelio-Azure-Voice'], AZURE_ENGLISH_VOICE, 'English helper route responses should expose the English Azure voice.');
  assert(
    englishRequestedSsml.includes(`xml:lang="${AZURE_ENGLISH_SPEECH_LOCALE}"`) &&
      englishRequestedSsml.includes(`name="${AZURE_ENGLISH_VOICE}"`),
    'English helper generation should send English SSML to Azure.'
  );

  const pipelineLogs: Array<Record<string, unknown>> = [];
  const versionResponse = createResponse();
  await handleAzureTtsRequest(
    { method: 'POST', body: { text: 'gwaith' } },
    versionResponse,
    {
      env: {
        AZURE_SPEECH_KEY: 'test-key',
        AZURE_SPEECH_REGION: 'uksouth'
      },
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        arrayBuffer: async () => makeAudioBuffer()
      }),
      postProcess: async () => new Uint8Array(128),
      logError: () => undefined,
      logInfo: (_message, details) => {
        pipelineLogs.push(details);
      }
    }
  );
  assert(
    pipelineLogs.some(entry => entry.audioPipelineVersion === AUDIO_PIPELINE_VERSION),
    'The route should log the internal audio pipeline version marker.'
  );

  let elevenLabsDirectText: unknown = null;
  let elevenLabsDirectModel: unknown = null;
  await synthesizeWelshTextWithElevenLabs(
    'penwythnos',
    { apiKey: 'test-elevenlabs-key', defaultVoiceId: 'test-voice-id' },
    async (_url, options) => {
      const payload = JSON.parse(String(options?.body ?? '{}')) as Record<string, unknown>;
      elevenLabsDirectText = payload.text;
      elevenLabsDirectModel = payload.model_id;
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        arrayBuffer: async () => makeMp3Buffer(),
        text: async () => ''
      };
    }
  );
  assertEqual(elevenLabsDirectText, 'penwythnos', 'ElevenLabs direct TTS should send only the Welsh answer as speakable text.');
  assertEqual(elevenLabsDirectModel, ELEVENLABS_DIRECT_TTS_MODEL_ID, 'ElevenLabs direct TTS should keep the explicit Eleven v3 model.');
  assertEqual(ELEVENLABS_DIRECT_TTS_PROMPT, 'none - Welsh answer only', 'ElevenLabs direct prompt diagnostic should make clear no instruction is spoken.');

  const diagnosticResult = await synthesizeAzureWelshMp3BytesWithDiagnostics('gwaith', {
    env: {
      AZURE_SPEECH_KEY: 'test-key',
      AZURE_SPEECH_REGION: 'uksouth'
    },
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => makeAudioBuffer(192)
    }),
    postProcess: async wavAudio => {
      assertEqual(wavAudio.byteLength, 192, 'Diagnostic synthesis should post-process the full Azure WAV payload.');
      return new Uint8Array(96);
    }
  });
  assertEqual(diagnosticResult.azureStatus, 200, 'Diagnostic synthesis should expose the Azure status.');
  assertEqual(diagnosticResult.wavByteLength, 192, 'Diagnostic synthesis should expose the WAV byte length.');
  assertEqual(diagnosticResult.mp3ByteLength, 96, 'Diagnostic synthesis should expose the processed MP3 byte length.');

  let diagnosticFailure: unknown = null;
  try {
    await synthesizeAzureWelshMp3BytesWithDiagnostics('gwaith', {
      env: {
        AZURE_SPEECH_KEY: 'test-key',
        AZURE_SPEECH_REGION: 'uksouth'
      },
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        arrayBuffer: async () => makeAudioBuffer(192)
      }),
      postProcess: async () => {
        throw new Error('processing exploded');
      }
    });
  } catch (error) {
    diagnosticFailure = error;
  }
  assert(
    diagnosticFailure instanceof AzureSynthesisError &&
      diagnosticFailure.stage === 'post_processing' &&
      diagnosticFailure.azureStatus === 200 &&
      diagnosticFailure.wavByteLength === 192,
    'Diagnostic synthesis should preserve the precise post-processing failure stage and safe byte-length details.'
  );

  const azureFailedResponse = createResponse();
  let azureFailurePostProcessCalled = false;
  await handleAzureTtsRequest(
    { method: 'POST', body: { text: 'gwaith' } },
    azureFailedResponse,
    {
      env: {
        AZURE_SPEECH_KEY: 'test-key',
        AZURE_SPEECH_REGION: 'uksouth'
      },
      fetchImpl: async () => ({
        ok: false,
        status: 500,
        arrayBuffer: async () => makeAudioBuffer(),
        text: async () => 'Unsupported audio format'
      }),
      postProcess: async () => {
        azureFailurePostProcessCalled = true;
        return new Uint8Array(128);
      },
      logError: () => undefined,
      logInfo: () => undefined
    }
  );

  assertEqual(azureFailedResponse.statusCode, 500, 'Azure failures should keep the Azure response status.');
  assert(!azureFailurePostProcessCalled, 'Azure failures should not run FFmpeg post-processing.');
  assert(
    isJsonErrorBody(azureFailedResponse.body) &&
      azureFailedResponse.body.error === 'Azure synthesis failed (500): Unsupported audio format',
    'Azure failures should surface the Azure response body.'
  );
  assert(
    isJsonErrorBody(azureFailedResponse.body) &&
      azureFailedResponse.body.errorStage === 'azure_response' &&
      azureFailedResponse.body.audioPipelineVersion === AUDIO_PIPELINE_VERSION &&
      azureFailedResponse.body.azureStatus === 500 &&
      azureFailedResponse.body.azureErrorBody === 'Unsupported audio format',
    'Azure failures should include structured route diagnostics.'
  );

  const failedResponse = createResponse();
  await handleAzureTtsRequest(
    { method: 'POST', body: { text: 'gwaith' } },
    failedResponse,
    {
      env: {
        AZURE_SPEECH_KEY: 'test-key',
        AZURE_SPEECH_REGION: 'uksouth'
      },
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        arrayBuffer: async () => makeAudioBuffer()
      }),
      postProcess: async () => {
        throw new Error('processing exploded');
      },
      logError: () => undefined,
      logInfo: () => undefined
    }
  );

  assertEqual(failedResponse.statusCode, 500, 'Processing failures should use the existing non-ok generation failure path.');
  const failedBody = failedResponse.body;
  assert(
    isJsonErrorBody(failedBody) &&
      failedBody.ok === false &&
      failedBody.error === 'FFmpeg post-processing failed: processing exploded' &&
      failedBody.errorStage === 'ffmpeg_post_processing' &&
      failedBody.audioPipelineVersion === AUDIO_PIPELINE_VERSION,
    'FFmpeg processing failures should return a meaningful JSON error distinct from Azure synthesis failures.'
  );

  console.log('audio generation tests passed');
}

function isJsonErrorBody(body: TestResponseBody): body is Exclude<TestResponseBody, Uint8Array | null> {
  return typeof body === 'object' && body !== null && !(body instanceof Uint8Array);
}
