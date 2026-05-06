import { Resend } from 'resend';

declare const process: {
  env: Record<string, string | undefined>;
};

type JsonBody = {
  email?: unknown;
  message?: unknown;
  feedbackSignals?: unknown;
  learningMethods?: unknown;
  company?: unknown;
};

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: { ok: boolean; error?: string }) => void;
  setHeader: (name: string, value: string | string[]) => void;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseBody(body: unknown): JsonBody | null {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as JsonBody;
    } catch {
      return null;
    }
  }

  if (body && typeof body === 'object') return body as JsonBody;
  return null;
}

function parseStringList(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean);
}

function formatStringList(values: string[]) {
  return values.length ? values.join(', ') : 'None selected';
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = parseBody(request.body);

  if (!body) {
    return response.status(400).json({ ok: false, error: 'Invalid JSON body' });
  }

  if (typeof body.company === 'string' && body.company.trim()) {
    return response.status(200).json({ ok: true });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const feedbackSignals = parseStringList(body.feedbackSignals);
  const learningMethods = parseStringList(body.learningMethods);

  if (!message) {
    return response.status(400).json({ ok: false, error: 'Message is required' });
  }

  if (email && !emailPattern.test(email)) {
    return response.status(400).json({ ok: false, error: 'Invalid email address' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.SPELIO_FEEDBACK_TO_EMAIL;
  // Placeholder only: configure a verified sender/domain in Resend before production use.
  const fromEmail = process.env.SPELIO_FEEDBACK_FROM_EMAIL ?? 'Spelio Feedback <feedback@example.com>';

  if (!apiKey || !toEmail) {
    console.error('Feedback email is not configured');
    return response.status(500).json({ ok: false, error: 'Feedback email is not configured' });
  }

  const resend = new Resend(apiKey);
  const timestamp = new Date().toISOString();

  try {
    await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: 'New Spelio feedback',
      text: [
        'Source: Spelio feedback form',
        `Submitted email: ${email || 'Not provided'}`,
        `Timestamp: ${timestamp}`,
        '',
        'Quick notes:',
        formatStringList(feedbackSignals),
        '',
        'Learning Welsh with:',
        formatStringList(learningMethods),
        '',
        'Feedback message:',
        message
      ].join('\n')
    });

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Feedback email failed', error instanceof Error ? error.message : 'Unknown error');
    return response.status(500).json({ ok: false, error: 'Unable to send feedback' });
  }
}
