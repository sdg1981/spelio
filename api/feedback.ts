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
const maxMessageLength = 5000;
const maxEmailLength = 254;
const allowedFeedbackSignals = new Set([
  'I found this useful',
  'I’d use this again',
  'This helped me practise Welsh spelling',
  'I’d recommend this to another learner',
  'I found something confusing or frustrating'
]);
const allowedLearningMethods = new Set([
  'SaySomethinginWelsh',
  'Duolingo',
  'Dysgu Cymraeg',
  'School / college',
  'Self-study',
  'Multiple methods',
  'Other'
]);

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

function parseStringList(value: unknown, allowedValues: Set<string>) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(item => allowedValues.has(item))
    .slice(0, allowedValues.size);
}

function formatStringList(values: string[]) {
  return values.length ? values.join(', ') : 'None selected';
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
  const feedbackSignals = parseStringList(body.feedbackSignals, allowedFeedbackSignals);
  const learningMethods = parseStringList(body.learningMethods, allowedLearningMethods);

  if (!message) {
    return response.status(400).json({ ok: false, error: 'Message is required' });
  }

  if (message.length > maxMessageLength) {
    return response.status(400).json({ ok: false, error: 'Message is too long' });
  }

  if (email.length > maxEmailLength) {
    return response.status(400).json({ ok: false, error: 'Email address is too long' });
  }

  if (email && !emailPattern.test(email)) {
    return response.status(400).json({ ok: false, error: 'Invalid email address' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  const toEmail = process.env.FEEDBACK_TO_EMAIL;

  if (!apiKey || !fromEmail || !toEmail) {
    console.error('Feedback email is not configured');
    return response.status(500).json({ ok: false, error: 'Feedback email is not configured' });
  }

  const resend = new Resend(apiKey);
  const timestamp = new Date().toISOString();

  try {
    const text = [
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
    ].join('\n');
    const html = `
      <h2>New Spelio feedback</h2>
      <p><strong>Source:</strong> Spelio feedback form</p>
      <p><strong>Submitted email:</strong> ${escapeHtml(email || 'Not provided')}</p>
      <p><strong>Timestamp:</strong> ${escapeHtml(timestamp)}</p>
      <p><strong>Quick notes:</strong><br>${escapeHtml(formatStringList(feedbackSignals))}</p>
      <p><strong>Learning Welsh with:</strong><br>${escapeHtml(formatStringList(learningMethods))}</p>
      <p><strong>Feedback message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    `;
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'New Spelio feedback',
      replyTo: email || undefined,
      text,
      html
    });

    if (error) {
      console.error('Feedback email failed', error);
      return response.status(502).json({ ok: false, error: 'Unable to send feedback' });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Feedback email failed', error instanceof Error ? error.message : 'Unknown error');
    return response.status(500).json({ ok: false, error: 'Unable to send feedback' });
  }
}
