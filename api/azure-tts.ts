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
  from: (value: ArrayBuffer) => Uint8Array;
};

const voice = 'cy-GB-NiaNeural';
const locale = 'cy-GB';
const outputFormat = 'audio-16khz-32kbitrate-mono-mp3';

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = parseBody(request.body);
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text) return response.status(400).json({ ok: false, error: 'Welsh text is required.' });
  if (text.length > 500) return response.status(400).json({ ok: false, error: 'Welsh text is too long.' });

  const key = process.env.AZURE_SPEECH_KEY ?? process.env.VITE_AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION ?? process.env.VITE_AZURE_SPEECH_REGION;
  if (!key || !region) {
    return response.status(500).json({ ok: false, error: 'Azure Speech is not configured.' });
  }

  const azureResponse = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/ssml+xml',
      'Ocp-Apim-Subscription-Key': key,
      'X-Microsoft-OutputFormat': outputFormat
    },
    body: createWelshSsml(text)
  });

  if (!azureResponse.ok) {
    return response
      .status(azureResponse.status)
      .json({ ok: false, error: azureResponse.status === 429 ? 'Azure rate limit reached.' : `Azure synthesis failed (${azureResponse.status}).` });
  }

  const audioBuffer = await azureResponse.arrayBuffer();
  if (audioBuffer.byteLength < 100) {
    return response.status(502).json({ ok: false, error: 'Azure returned an unexpectedly small audio payload.' });
  }

  response.setHeader('Content-Type', 'audio/mpeg');
  response.setHeader('Cache-Control', 'no-store');
  return response.status(200).send(Buffer.from(audioBuffer));
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

function createWelshSsml(text: string) {
  // TODO: Add dialect-specific voice selection if Azure Welsh regional voices become practical.
  return `<speak version="1.0" xml:lang="${locale}"><voice xml:lang="${locale}" name="${voice}">${escapeXml(text)}</voice></speak>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
