import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';

type FooterProps = {
  className?: string;
  variant?: 'default' | 'home';
};

export function Footer({ className = '', variant = 'default' }: FooterProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const year = variant === 'home' ? 2026 : new Date().getFullYear();
  const classes = ['footer-copy', className].filter(Boolean).join(' ');
  const separator = variant === 'home' ? ' · ' : '. ';

  return (
    <>
      <footer className={classes} aria-label={`Made with love for Wales. Copyright ${year} Spelio`}>
        <span>
          Made with <span className="footer-heart" aria-hidden="true">♥</span> for Wales{separator}© {year} Spelio
        </span>
        <button className="footer-feedback-link" type="button" onClick={() => setFeedbackOpen(true)}>
          Feedback
        </button>
      </footer>
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </>
  );
}

type FeedbackState = 'idle' | 'sending' | 'sent' | 'error';

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState('');
  const [state, setState] = useState<FeedbackState>('idle');
  const [errors, setErrors] = useState<{ email?: string; message?: string }>({});

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    const nextErrors: { email?: string; message?: string } = {};

    if (!trimmedMessage) nextErrors.message = 'Message is required.';
    if (trimmedEmail && !looksLikeEmail(trimmedEmail)) nextErrors.email = 'Enter a valid email address.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setState('idle');
      return;
    }

    setState('sending');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail || undefined,
          message: trimmedMessage,
          company
        })
      });
      const result = await response.json().catch(() => ({ ok: false }));

      if (!response.ok || !result.ok) throw new Error('Feedback request failed');

      setMessage('');
      setErrors({});
      setState('sent');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="overlay" role="presentation">
      <section className="modal modal-small feedback-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="feedback-modal-header">
          <h2 className="modal-title" id={titleId}>Feedback</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close feedback" type="button">×</button>
        </div>

        <p className="modal-text feedback-intro">
          Spelio is still early — feedback, corrections, and suggestions are welcome.
        </p>

        <form className="feedback-form" onSubmit={handleSubmit} noValidate>
          <label className="feedback-field">
            <span>Email address <span className="feedback-optional">optional</span></span>
            <input
              className="feedback-input"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'feedback-email-error' : undefined}
              autoComplete="email"
            />
            {errors.email && <span className="feedback-error" id="feedback-email-error">{errors.email}</span>}
          </label>

          <label className="feedback-field feedback-honeypot" aria-hidden="true">
            <span>Company</span>
            <input
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={event => setCompany(event.target.value)}
            />
          </label>

          <label className="feedback-field">
            <span>Message</span>
            <textarea
              className="feedback-input feedback-message"
              value={message}
              onChange={event => setMessage(event.target.value)}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'feedback-message-error' : undefined}
              required
            />
            {errors.message && <span className="feedback-error" id="feedback-message-error">{errors.message}</span>}
          </label>

          <div className="feedback-actions">
            <span className={`feedback-status feedback-status-${state}`} role="status" aria-live="polite">
              {state === 'sending' && 'Sending...'}
              {state === 'sent' && 'Thank you — feedback sent.'}
              {state === 'error' && 'Sorry, something went wrong. Please try again.'}
            </span>
            <button className="done-button feedback-submit" type="submit" disabled={state === 'sending'}>
              Send feedback
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
