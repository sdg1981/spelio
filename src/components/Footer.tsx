import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

type FooterProps = {
  className?: string;
  variant?: 'default' | 'home';
};

export function Footer({ className = '' }: FooterProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<'privacy' | 'about' | null>(null);
  const [shareStatus, setShareStatus] = useState<'shared' | 'copied' | null>(null);
  const shareStatusTimer = useRef<number | null>(null);
  const year = 2026;
  const classes = ['footer-copy', className].filter(Boolean).join(' ');

  useEffect(() => {
    return () => {
      if (shareStatusTimer.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(shareStatusTimer.current);
      }
    };
  }, []);

  function showShareStatus(status: 'shared' | 'copied') {
    setShareStatus(status);

    if (shareStatusTimer.current !== null) {
      window.clearTimeout(shareStatusTimer.current);
    }

    shareStatusTimer.current = window.setTimeout(() => {
      setShareStatus(null);
      shareStatusTimer.current = null;
    }, 1800);
  }

  async function handleShare() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    const shareUrl = window.location.origin;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Spelio',
          text: 'Really nice Welsh spelling practice app — well worth a try.',
          url: shareUrl
        });
        showShareStatus('shared');
        return;
      } catch {
        return;
      }
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showShareStatus('copied');
      } catch {
        // Sharing should never interrupt the footer.
      }
    }
  }

  return (
    <>
      <footer className={classes} aria-label={`Made with love for Wales. Copyright ${year} Spelio`}>
        <span className="footer-line">
          Made with <span className="footer-heart" aria-hidden="true">❤️</span> for Wales · © {year} Spelio
        </span>
        <span className="footer-links" aria-label="Footer links">
          <button className="footer-link" type="button" onClick={() => setFeedbackOpen(true)}>Feedback</button>
          <span aria-hidden="true">·</span>
          <button className="footer-link footer-share-link" type="button" onClick={handleShare}>Share</button>
          <span className="footer-share-separator" aria-hidden="true">·</span>
          <button className="footer-link" type="button" onClick={() => setInfoModal('privacy')}>Privacy</button>
          <span aria-hidden="true">·</span>
          <button className="footer-link" type="button" onClick={() => setInfoModal('about')}>About</button>
        </span>
      </footer>
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
      {infoModal === 'privacy' && (
        <InfoModal title="Privacy" titleId="privacy-title" onClose={() => setInfoModal(null)}>
          <p>Spelio is designed to work without an account.</p>
          <p>
            Your spelling progress, settings, difficult words, and session history are stored locally on your device using your browser’s storage.
            This helps Spelio remember what you have practised and recommend what to do next.
          </p>
          <p>You can delete this local progress at any time using Reset progress in Settings.</p>
          <p>
            Spelio may collect anonymous usage information during the beta to help improve the app, such as sessions started, sessions completed,
            word lists practised, and whether features like review or reveal are being used. This information is used only to understand what is
            useful and what needs improving.
          </p>
          <p>Spelio does not sell personal data, does not use advertising trackers, and does not require a user account.</p>
        </InfoModal>
      )}
      {infoModal === 'about' && (
        <InfoModal title="About Spelio" titleId="about-title" onClose={() => setInfoModal(null)}>
          <p>Beta version 0.2</p>
          <p>Spelio is a focused Welsh spelling practice app.</p>
          <p>
            It helps learners practise Welsh words and short phrases through short, repeatable spelling sessions designed to improve recall, spelling accuracy, confidence, and the connection between spoken and written Welsh.
          </p>
          <p>Spelio is designed to complement other ways of learning Welsh rather than replace them.</p>
          <p>
            The project started while learning Welsh personally. As a dyslexic learner, I found that hearing words often wasn’t enough — I needed
            to see words, type them, and practise their spelling to properly remember them. Spelio was built to create the kind of simple, focused
            practice tool I wished already existed alongside the other Welsh learning resources I was using.
          </p>
        </InfoModal>
      )}
      <div className={`app-toast ${shareStatus ? 'visible' : ''}`} role="status" aria-live="polite">
        {shareStatus === 'shared' && 'Shared'}
        {shareStatus === 'copied' && 'Link copied'}
      </div>
    </>
  );
}

function InfoModal({
  title,
  titleId,
  children,
  onClose
}: {
  title: string;
  titleId: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="overlay" role="presentation">
      <section className="modal modal-small footer-info-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="footer-info-modal-header">
          <h2 className="modal-title" id={titleId}>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label={`Close ${title}`} type="button">×</button>
        </div>
        <div className="footer-info-modal-body modal-text">
          {children}
        </div>
      </section>
    </div>
  );
}

type FeedbackState = 'idle' | 'sending' | 'sent' | 'error';

const feedbackSignalOptions = [
  'I found this useful',
  'I’d use this again',
  'This helped me practise Welsh spelling',
  'I’d recommend this to another learner',
  'I found something confusing or frustrating'
];

const learningMethodOptions = [
  'SaySomethinginWelsh',
  'Duolingo',
  'Dysgu Cymraeg',
  'School / college',
  'Self-study',
  'Multiple methods',
  'Other'
];

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function toggleSelection(value: string, selectedValues: string[]) {
  if (selectedValues.includes(value)) {
    return selectedValues.filter(selectedValue => selectedValue !== value);
  }

  return [...selectedValues, value];
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [feedbackSignals, setFeedbackSignals] = useState<string[]>([]);
  const [learningMethods, setLearningMethods] = useState<string[]>([]);
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
          feedbackSignals,
          learningMethods,
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

          <fieldset className="feedback-check-section">
            <legend>Quick notes <span className="feedback-optional">optional</span></legend>
            <div className="feedback-check-grid">
              {feedbackSignalOptions.map(option => (
                <label className="feedback-check" key={option}>
                  <input
                    type="checkbox"
                    checked={feedbackSignals.includes(option)}
                    onChange={() => setFeedbackSignals(current => toggleSelection(option, current))}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="feedback-check-section">
            <legend>I’m learning Welsh with <span className="feedback-optional">optional</span></legend>
            <div className="feedback-chip-grid">
              {learningMethodOptions.map(option => (
                <label className="feedback-chip" key={option}>
                  <input
                    type="checkbox"
                    checked={learningMethods.includes(option)}
                    onChange={() => setLearningMethods(current => toggleSelection(option, current))}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>

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
