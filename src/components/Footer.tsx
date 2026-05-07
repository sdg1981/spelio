import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Heart } from './Icons';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { InterfaceLanguage, Translate } from '../i18n';

type FooterProps = {
  className?: string;
  variant?: 'default' | 'home';
  interfaceLanguage: InterfaceLanguage;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
};

export function Footer({ className = '', interfaceLanguage, onInterfaceLanguageChange, t }: FooterProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<'privacy' | 'about' | null>(null);
  const [shareStatus, setShareStatus] = useState<'shared' | 'copied' | null>(null);
  const shareStatusTimer = useRef<number | null>(null);
  const year = 2026;
  const classes = ['footer-copy', className].filter(Boolean).join(' ');
  const feedbackSignalOptions = [
    t('footer.feedbackUseful'),
    t('footer.feedbackUseAgain'),
    t('footer.feedbackHelpedSpelling'),
    t('footer.feedbackRecommend'),
    t('footer.feedbackConfusing')
  ];
  const learningMethodOptions = [
    t('footer.methodSaySomething'),
    t('footer.methodDuolingo'),
    t('footer.methodDysguCymraeg'),
    t('footer.methodSchool'),
    t('footer.methodSelfStudy'),
    t('footer.methodMultiple'),
    t('footer.methodOther')
  ];

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
          text: t('footer.shareText'),
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
      <footer className={classes} aria-label={t('footer.ariaLabel')}>
        <LanguageSwitcher
          interfaceLanguage={interfaceLanguage}
          onInterfaceLanguageChange={onInterfaceLanguageChange}
          t={t}
          variant="footer"
        />
        <span className="footer-line">
          <span className="footer-made-with">
            {t('footer.madeWith')} <Heart className="footer-heart" size={14} strokeWidth={2.8} fill="currentColor" aria-hidden="true" /> {t('footer.forWales')}
          </span> · © {year} Spelio
        </span>
        <span className="footer-links" aria-label={t('footer.linksLabel')}>
          <button className="footer-link" type="button" onClick={() => setFeedbackOpen(true)}>{t('footer.feedback')}</button>
          <span aria-hidden="true">·</span>
          <button className="footer-link footer-share-link" type="button" onClick={handleShare}>{t('footer.share')}</button>
          <span className="footer-share-separator" aria-hidden="true">·</span>
          <button className="footer-link" type="button" onClick={() => setInfoModal('privacy')}>{t('footer.privacy')}</button>
          <span aria-hidden="true">·</span>
          <button className="footer-link" type="button" onClick={() => setInfoModal('about')}>{t('footer.about')}</button>
        </span>
      </footer>
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} t={t} feedbackSignalOptions={feedbackSignalOptions} learningMethodOptions={learningMethodOptions} />}
      {infoModal === 'privacy' && (
        <InfoModal title={t('footer.privacyTitle')} titleId="privacy-title" onClose={() => setInfoModal(null)} closeLabel={t('footer.close')}>
          <p>{t('footer.privacyBody1')}</p>
          <p>{t('footer.privacyBody2')}</p>
          <p>{t('footer.privacyBody3')}</p>
          <p>{t('footer.privacyBody4')}</p>
          <p>{t('footer.privacyBody5')}</p>
        </InfoModal>
      )}
      {infoModal === 'about' && (
        <InfoModal title={t('footer.aboutTitle')} titleId="about-title" onClose={() => setInfoModal(null)} closeLabel={t('footer.close')}>
          <p>{t('footer.aboutBody1')}</p>
          <p>{t('footer.aboutBody2')}</p>
          <p>{t('footer.aboutBody3')}</p>
          <p>{t('footer.aboutBody4')}</p>
          <p>{t('footer.aboutBody5')}</p>
        </InfoModal>
      )}
      <div className={`app-toast ${shareStatus ? 'visible' : ''}`} role="status" aria-live="polite">
        {shareStatus === 'shared' && t('footer.shared')}
        {shareStatus === 'copied' && t('footer.copied')}
      </div>
    </>
  );
}

function InfoModal({
  title,
  titleId,
  children,
  onClose,
  closeLabel
}: {
  title: string;
  titleId: string;
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
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
          <button className="modal-close" onClick={onClose} aria-label={`${closeLabel} ${title}`} type="button">×</button>
        </div>
        <div className="footer-info-modal-body modal-text">
          {children}
        </div>
      </section>
    </div>
  );
}

type FeedbackState = 'idle' | 'sending' | 'sent' | 'error';

const maxFeedbackMessageLength = 5000;
const maxFeedbackEmailLength = 254;
function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function toggleSelection(value: string, selectedValues: string[]) {
  if (selectedValues.includes(value)) {
    return selectedValues.filter(selectedValue => selectedValue !== value);
  }

  return [...selectedValues, value];
}

function FeedbackModal({
  onClose,
  t,
  feedbackSignalOptions,
  learningMethodOptions
}: {
  onClose: () => void;
  t: Translate;
  feedbackSignalOptions: string[];
  learningMethodOptions: string[];
}) {
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

    if (!trimmedMessage) nextErrors.message = t('footer.emailRequired');
    if (trimmedMessage.length > maxFeedbackMessageLength) nextErrors.message = t('footer.messageTooLong');
    if (trimmedEmail && !looksLikeEmail(trimmedEmail)) nextErrors.email = t('footer.invalidEmail');
    if (trimmedEmail.length > maxFeedbackEmailLength) nextErrors.email = t('footer.emailTooLong');

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

      setEmail('');
      setMessage('');
      setFeedbackSignals([]);
      setLearningMethods([]);
      setCompany('');
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
          <h2 className="modal-title" id={titleId}>{t('footer.feedback')}</h2>
          <button className="modal-close" onClick={onClose} aria-label={`${t('footer.close')} ${t('footer.feedback')}`} type="button">×</button>
        </div>

        <div className="feedback-modal-body">
          {state === 'sent' ? (
            <div className="feedback-success" role="status" aria-live="polite">
              <p>{t('footer.feedbackSent')}</p>
            </div>
          ) : (
            <>
              <p className="modal-text feedback-intro">
                {t('footer.feedbackIntro')}
              </p>

              <form className="feedback-form" onSubmit={handleSubmit} noValidate>
                <label className="feedback-field">
                  <span>{t('footer.emailAddress')} <span className="feedback-optional">{t('footer.optional')}</span></span>
                  <input
                    className="feedback-input"
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'feedback-email-error' : undefined}
                    autoComplete="email"
                    maxLength={maxFeedbackEmailLength}
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
                  <span>{t('footer.message')}</span>
                  <textarea
                    className="feedback-input feedback-message"
                    value={message}
                    onChange={event => setMessage(event.target.value)}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'feedback-message-error' : undefined}
                    maxLength={maxFeedbackMessageLength}
                    required
                  />
                  {errors.message && <span className="feedback-error" id="feedback-message-error">{errors.message}</span>}
                </label>

                <fieldset className="feedback-check-section">
                  <legend className="feedback-section-label">{t('footer.quickNotes')} <span className="feedback-optional">{t('footer.optional')}</span></legend>
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
                  <legend className="feedback-section-label">{t('footer.learningWith')} <span className="feedback-optional">{t('footer.optional')}</span></legend>
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
                    {state === 'sending' && t('footer.sending')}
                    {state === 'error' && t('footer.feedbackError')}
                  </span>
                  <button className="done-button feedback-submit" type="submit" disabled={state === 'sending'}>
                    {t('footer.sendFeedback')}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
