import {
  AZURE_SPEECH_PROSODY_RATE,
  AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT,
  createWelshSsml,
  handleAzureTtsRequest
} from '../api/azure-tts';
import {
  AUDIO_FADE_OUT_SECONDS,
  AUDIO_TRAILING_SILENCE_SAMPLES,
  AUDIO_TRAILING_SILENCE_SECONDS,
  createAudioPostProcessingFilter,
  createFfmpegPostProcessingArgs
} from '../api/audioPostProcessing';
import { createWelshSsml as createAdminWelshSsml } from '../src/admin/services/audioGeneration';

type TestResponseBody = Uint8Array | { ok: boolean; error?: string } | null;

type TestResponse = {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: TestResponseBody;
  status: (code: number) => TestResponse;
  json: (body: { ok: boolean; error?: string }) => void;
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

const ssml = createWelshSsml('cân & gwaith');
assert(
  ssml.includes(`<prosody rate="${AZURE_SPEECH_PROSODY_RATE}">cân &amp; gwaith</prosody>`),
  'Azure SSML should include escaped text inside the subtle prosody rate wrapper.'
);
assert(
  createAdminWelshSsml('cân').includes(`<prosody rate="${AZURE_SPEECH_PROSODY_RATE}">cân</prosody>`),
  'Admin SSML helper should expose the same subtle prosody rate.'
);

const filter = createAudioPostProcessingFilter();
assert(filter.includes('loudnorm=I=-20:TP=-3:LRA=13:linear=true'), 'Post-processing should include gentle loudness normalisation.');
assert(filter.includes(`afade=t=in:d=${AUDIO_FADE_OUT_SECONDS}`), 'Post-processing should include a tiny end fade.');
assertEqual(AUDIO_TRAILING_SILENCE_SECONDS, 0.15, 'Trailing silence should remain approximately 150ms.');
assert(filter.includes(`apad=pad_len=${AUDIO_TRAILING_SILENCE_SAMPLES}`), 'Post-processing should include trailing silence padding.');

const args = createFfmpegPostProcessingArgs('/tmp/input.wav', '/tmp/output.mp3');
assert(args.includes('libmp3lame'), 'FFmpeg should encode the final output as MP3.');
assert(args.includes('32k'), 'FFmpeg should preserve the existing 32k MP3 bitrate expectation.');

void runAsyncAssertions();

async function runAsyncAssertions() {
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
      logError: () => undefined
    }
  );

  assertEqual(response.statusCode, 200, 'Successful audio generation should return HTTP 200.');
  assertEqual(response.headers['Content-Type'], 'audio/mpeg', 'Processed audio response should remain MP3.');
  assertEqual(requestedOutputFormat, AZURE_WAV_INTERMEDIATE_OUTPUT_FORMAT, 'Azure should be asked for WAV intermediate audio.');
  assert(requestedSsml.includes(`<prosody rate="${AZURE_SPEECH_PROSODY_RATE}">gwaith</prosody>`), 'Azure request should include subtle prosody rate SSML.');
  assert(postProcessCalled, 'The route should post-process Azure audio before returning it for upload.');
  assert(response.body instanceof Uint8Array && response.body[0] === 0x49, 'The route should send the processed MP3 bytes.');

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
      logError: () => undefined
    }
  );

  assertEqual(failedResponse.statusCode, 500, 'Processing failures should use the existing non-ok generation failure path.');
  const failedBody = failedResponse.body;
  assert(
    isJsonErrorBody(failedBody) &&
      failedBody.ok === false &&
      failedBody.error === 'processing exploded',
    'Processing failures should return a meaningful JSON error.'
  );

  console.log('audio generation tests passed');
}

function isJsonErrorBody(body: TestResponseBody): body is { ok: boolean; error?: string } {
  return typeof body === 'object' && body !== null && !(body instanceof Uint8Array);
}
