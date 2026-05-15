import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Copy, FlaskConical, LockKeyhole, Share2, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft } from './Icons';
import { Footer } from './Footer';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import type { WordList } from '../data/wordLists';
import type { InterfaceLanguage, Translate } from '../i18n';
import {
  CUSTOM_LIST_ENGLISH_MAX_LENGTH,
  CUSTOM_LIST_MAX_ROWS,
  CUSTOM_LIST_TITLE,
  CUSTOM_LIST_WELSH_MAX_LENGTH,
  createEmptyCustomListRows,
  getCustomListCanonicalUrl,
  getCustomListPath,
  getVisibleCustomListRowCount,
  loadCustomWordList,
  validateCustomListRows,
  type CustomListEntryInput,
  type CustomListValidationError
} from '../lib/customLists';
import { resetPublicPageScrollToTop } from '../lib/scrollRestoration';
import { isPracticeTestShareMode } from '../lib/wordListSharing';

type ShareDataNavigator = Navigator & {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
};

const COPY_STATUS_VISIBLE_MS = 1600;
const CLIENT_ID_KEY = 'spelio-custom-list-client-id';

type CustomListShellProps = {
  children: ReactNode;
  interfaceLanguage: InterfaceLanguage;
  onBack: () => void;
  onHome: () => void;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
};

function CustomListPublicShell({
  children,
  interfaceLanguage,
  onBack,
  onHome,
  onInterfaceLanguageChange,
  t
}: CustomListShellProps) {
  return (
    <main className="how-page public-info-page custom-list-page">
      <button className="how-back-button custom-list-back" type="button" onClick={onBack} aria-label={t('publicPages.backLabel')}>
        <ArrowLeft size={25} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <div className="homepage-utility custom-list-language">
        <LanguageSwitcher
          interfaceLanguage={interfaceLanguage}
          onInterfaceLanguageChange={onInterfaceLanguageChange}
          t={t}
          variant="homepageTop"
        />
      </div>
      <div className="how-page-logo public-info-logo custom-list-logo">
        <Logo onClick={onHome} backHomeLabel={t('how.backHomeLabel')} />
      </div>
      {children}
      <Footer
        className="home-footer public-info-footer custom-list-footer"
        variant="home"
        interfaceLanguage={interfaceLanguage}
        onInterfaceLanguageChange={onInterfaceLanguageChange}
        t={t}
      />
    </main>
  );
}

export function CustomListCreatePage({
  interfaceLanguage,
  onBack,
  onHome,
  onInterfaceLanguageChange,
  t
}: {
  interfaceLanguage: InterfaceLanguage;
  onBack: () => void;
  onHome: () => void;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
}) {
  const [rows, setRows] = useState(() => createEmptyCustomListRows(CUSTOM_LIST_MAX_ROWS));
  const [errors, setErrors] = useState<CustomListValidationError[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const welshInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const englishInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const visibleRows = getVisibleCustomListRowCount(rows);

  useEffect(() => {
    if (!saving) return;
    setStatus(t('customLists.statusChecking'));
    const generating = window.setTimeout(() => setStatus(t('customLists.statusGenerating')), 900);
    const preparing = window.setTimeout(() => setStatus(t('customLists.statusPreparing')), 2600);
    return () => {
      window.clearTimeout(generating);
      window.clearTimeout(preparing);
    };
  }, [saving, t]);

  function updateRow(index: number, field: keyof CustomListEntryInput, value: string) {
    setRows(previous => previous.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
    setErrors([]);
    setSubmitError('');
  }

  function showErrors(nextErrors: CustomListValidationError[]) {
    setErrors(nextErrors);
    focusFirstProblemRow(nextErrors);
  }

  function focusFirstProblemRow(nextErrors: CustomListValidationError[]) {
    window.requestAnimationFrame(() => {
      const firstRowError = nextErrors
        .filter(error => typeof error.row === 'number')
        .sort((left, right) => (left.row ?? 0) - (right.row ?? 0))[0];
      const rowIndex = firstRowError?.row ?? 0;
      const rowElement = rowRefs.current[rowIndex];
      rowElement?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      const targetInput = firstRowError?.field === 'english'
        ? englishInputRefs.current[rowIndex]
        : welshInputRefs.current[rowIndex];
      targetInput?.focus({ preventScroll: true });
    });
  }

  async function submit() {
    if (saving) return;
    const validation = validateCustomListRows(rows);
    if (validation.errors.length) {
      showErrors(validation.errors);
      setSubmitError('');
      return;
    }

    const submittedRowIndexes = getSubmittedRowIndexes(rows);
    setSaving(true);
    setSubmitError('');
    logCustomListEvent('custom_list_create_started');

    try {
      const result = await fetch('/api/custom-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Spelio-Client-Id': getBrowserClientId()
        },
        body: JSON.stringify({ entries: validation.entries })
      });
      const payload = await result.json().catch(() => null) as { publicId?: string; error?: string; errors?: CustomListValidationError[] } | null;

      if (!result.ok || !payload?.publicId) {
        const serverErrors = mapServerErrorsToVisibleRows(payload?.errors ?? [], submittedRowIndexes);
        const moderationErrors = payload?.error === 'moderation_rejected'
          ? serverErrors.length
            ? serverErrors
            : submittedRowIndexes.map(row => ({ row, code: 'moderationRejected' as const }))
          : serverErrors;
        if (moderationErrors.length) showErrors(moderationErrors);
        else setErrors([]);
        setSubmitError(getCreateErrorMessage(payload?.error, t));
        logCustomListEvent('custom_list_create_failed');
        return;
      }

      logCustomListEvent('custom_list_create_succeeded');
      window.history.pushState({ spelioPublicPage: true }, '', `/custom-list/${payload.publicId}/share`);
      resetPublicPageScrollToTop();
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      setErrors([]);
      setSubmitError(t('customLists.moderationUnavailable'));
      logCustomListEvent('custom_list_create_failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <CustomListPublicShell
      interfaceLanguage={interfaceLanguage}
      onBack={onBack}
      onHome={onHome}
      onInterfaceLanguageChange={onInterfaceLanguageChange}
      t={t}
    >
      <section className="custom-list-create" aria-labelledby="custom-list-create-title">
        <div className="custom-list-intro">
          <span className="custom-list-preview-badge">
            <FlaskConical size={14} aria-hidden="true" />
            {t('customLists.experimental')}
          </span>
          <h1 id="custom-list-create-title">{t('customLists.createHeading')}</h1>
          <p>{t('customLists.createSupport')}</p>
        </div>

        <div className="custom-list-form" aria-label={t('customLists.createHeading')}>
          <div className="custom-list-column-headings" aria-hidden="true">
            <span />
            <b>{t('customLists.welshSpelling')}</b>
            <b>{t('customLists.englishMeaning')}</b>
          </div>
          {rows.slice(0, visibleRows).map((row, index) => {
            const welshError = findFieldError(errors, index, 'welsh');
            const englishError = findFieldError(errors, index, 'english');
            const rowError = findRowLevelError(errors, index);
            const hasRowProblem = Boolean(welshError || englishError || rowError);
            const rowErrorId = rowError ? `custom-row-error-${index}` : undefined;
            const welshDescribedBy = [
              welshError ? `custom-welsh-error-${index}` : '',
              rowErrorId ?? ''
            ].filter(Boolean).join(' ') || undefined;
            const englishDescribedBy = [
              englishError ? `custom-english-error-${index}` : '',
              rowErrorId ?? ''
            ].filter(Boolean).join(' ') || undefined;

            return (
            <div
              ref={element => {
                rowRefs.current[index] = element;
              }}
              className={`custom-list-row ${hasRowProblem ? 'custom-list-row-has-error' : ''}`.trim()}
              key={index}
            >
              <span className="custom-list-row-number" aria-hidden="true">{index + 1}</span>
              <div className="custom-list-field">
                <label htmlFor={`custom-welsh-${index}`}>{t('customLists.welshSpelling')}</label>
                <input
                  ref={element => {
                    welshInputRefs.current[index] = element;
                  }}
                  id={`custom-welsh-${index}`}
                  value={row.welsh}
                  maxLength={CUSTOM_LIST_WELSH_MAX_LENGTH + 1}
                  placeholder={t('customLists.welshPlaceholder')}
                  aria-invalid={Boolean(welshError || rowError)}
                  aria-describedby={welshDescribedBy}
                  onChange={event => updateRow(index, 'welsh', event.target.value)}
                />
                {welshError && (
                  <small id={`custom-welsh-error-${index}`} className="custom-list-error">
                    {formatValidationError(welshError, t)}
                  </small>
                )}
              </div>
              <div className="custom-list-field">
                <label htmlFor={`custom-english-${index}`}>{t('customLists.englishMeaning')}</label>
                <input
                  ref={element => {
                    englishInputRefs.current[index] = element;
                  }}
                  id={`custom-english-${index}`}
                  value={row.english}
                  maxLength={CUSTOM_LIST_ENGLISH_MAX_LENGTH + 1}
                  placeholder={t('customLists.englishPlaceholder')}
                  aria-invalid={Boolean(englishError || rowError)}
                  aria-describedby={englishDescribedBy}
                  onChange={event => updateRow(index, 'english', event.target.value)}
                />
                {englishError && (
                  <small id={`custom-english-error-${index}`} className="custom-list-error">
                    {formatValidationError(englishError, t)}
                  </small>
                )}
              </div>
              {rowError && (
                <small id={rowErrorId} className="custom-list-error custom-list-row-error">
                  {formatValidationError(rowError, t)}
                </small>
              )}
            </div>
          );
          })}
        </div>

        <div className="custom-list-create-footer">
          <div className="custom-list-expiry-note">
            <LockKeyhole size={20} strokeWidth={1.8} aria-hidden="true" />
            {t('customLists.expiryNote')}
          </div>
          <div className="custom-list-save-panel">
            {(errors.some(error => error.row === undefined && error.code !== 'welshRequired') || submitError) && (
              <p className="custom-list-submit-error" role="alert">
                {submitError || formatValidationError(errors.find(error => error.row === undefined), t)}
              </p>
            )}
            {saving && <p className="custom-list-status" role="status" aria-live="polite">{status}</p>}
            <button className="custom-list-primary" type="button" onClick={submit} disabled={saving}>
              {saving ? t('customLists.saving') : t('customLists.saveList')}
            </button>
            <p>{t('customLists.saveSupport')}</p>
          </div>
        </div>
      </section>
    </CustomListPublicShell>
  );
}

export function CustomListSharePage({
  publicId,
  interfaceLanguage,
  onBack,
  onHome,
  onInterfaceLanguageChange,
  t
}: {
  publicId: string;
  interfaceLanguage: InterfaceLanguage;
  onBack: () => void;
  onHome: () => void;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
}) {
  const [practiceTestLink, setPracticeTestLink] = useState(isPracticeTestShareMode(window.location.search));
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const copyTimerRef = useRef<number | null>(null);
  const shareUrl = useMemo(() => getCustomListCanonicalUrl(publicId, undefined, { practiceTest: practiceTestLink }), [practiceTestLink, publicId]);

  useEffect(() => {
    const shareNavigator = navigator as ShareDataNavigator;
    if (typeof shareNavigator.share !== 'function') return;
    const shareData = { title: CUSTOM_LIST_TITLE, text: t('customLists.shareNativeText'), url: shareUrl };
    setCanNativeShare(typeof shareNavigator.canShare === 'function' ? shareNavigator.canShare(shareData) : true);
  }, [shareUrl, t]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  async function copyShareUrl() {
    await copyTextToClipboard(shareUrl);
    logCustomListEvent('custom_list_shared');
    setCopied(true);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      copyTimerRef.current = null;
    }, COPY_STATUS_VISIBLE_MS);
  }

  async function nativeShare() {
    const shareNavigator = navigator as ShareDataNavigator;
    if (typeof shareNavigator.share !== 'function') return;
    await shareNavigator.share({ title: CUSTOM_LIST_TITLE, text: t('customLists.shareNativeText'), url: shareUrl });
    logCustomListEvent('custom_list_shared');
  }

  function practiceThisList() {
    window.history.pushState({ spelioPublicPage: true }, '', getCustomListPath(publicId, { practiceTest: practiceTestLink }));
    resetPublicPageScrollToTop();
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  return (
    <CustomListPublicShell
      interfaceLanguage={interfaceLanguage}
      onBack={onBack}
      onHome={onHome}
      onInterfaceLanguageChange={onInterfaceLanguageChange}
      t={t}
    >
      <section className="custom-list-share" aria-labelledby="custom-list-share-title">
        <div className="custom-list-share-intro">
          <span className="custom-list-preview-badge">
            <FlaskConical size={14} aria-hidden="true" />
            {t('customLists.experimental')}
          </span>
          <h1 id="custom-list-share-title">{t('customLists.shareHeading')}</h1>
          <h2>{t('customLists.title')}</h2>
          <p>{t('customLists.shareSupport')}</p>
        </div>

        <div className="custom-list-share-layout">
          <section aria-labelledby="custom-list-qr-title">
            <h3 id="custom-list-qr-title" className="group-title">{t('wordLists.qrCode')}</h3>
            <div className="custom-list-qr-card">
              <QRCodeSVG value={shareUrl} size={238} marginSize={2} className="custom-list-qr" />
              <span>{t('wordLists.scanToOpenList')}</span>
            </div>
          </section>
          <section aria-labelledby="custom-list-share-link-title" className="custom-list-share-actions">
            <h3 id="custom-list-share-link-title" className="group-title">{t('wordLists.shareLink')}</h3>
            <div className="custom-list-link-box">
              <a href={shareUrl} target="_blank" rel="noreferrer">{shareUrl}</a>
              <button type="button" onClick={copyShareUrl}>
                <Copy size={20} aria-hidden="true" />
                {copied ? t('wordLists.linkCopied') : t('wordLists.copyLink')}
              </button>
            </div>
            <label className="wordlist-practice-test-option custom-list-practice-test">
              <input
                type="checkbox"
                checked={practiceTestLink}
                onChange={event => setPracticeTestLink(event.target.checked)}
              />
              <span>
                <b>{t('wordLists.practiceTest')}</b>
                <small>{t('wordLists.practiceTestHelper')}</small>
              </span>
            </label>
            <button className="custom-list-primary custom-list-practice-cta" type="button" onClick={practiceThisList}>
              {t('customLists.practiceThisList')}
              <ArrowRight size={27} strokeWidth={2.1} aria-hidden="true" />
            </button>
            {canNativeShare && (
              <>
                <button className="custom-list-secondary-share" type="button" onClick={nativeShare}>
                  <Share2 size={22} aria-hidden="true" />
                  {t('wordLists.share')}
                </button>
                <p className="custom-list-share-sheet-note">{t('customLists.nativeShareNote')}</p>
              </>
            )}
          </section>
        </div>

        <div className="custom-list-privacy-card">
          <span aria-hidden="true"><ShieldCheck size={36} strokeWidth={1.8} /></span>
          <div>
            <h3>{t('wordLists.safeAndPrivate')}</h3>
            <p>{t('customLists.privacyBody')}</p>
          </div>
        </div>
      </section>
    </CustomListPublicShell>
  );
}

export function CustomListEntryPage({
  publicId,
  practiceTestMode,
  interfaceLanguage,
  onBack,
  onHome,
  onInterfaceLanguageChange,
  onStartPractice,
  t
}: {
  publicId: string;
  practiceTestMode: boolean;
  interfaceLanguage: InterfaceLanguage;
  onBack: () => void;
  onHome: () => void;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  onStartPractice: (list: WordList, publicId: string, practiceTestMode: boolean) => void;
  t: Translate;
}) {
  const [state, setState] = useState<'loading' | 'ready' | 'expired' | 'missing' | 'error'>('loading');
  const [list, setList] = useState<WordList | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    loadCustomWordList(publicId).then(result => {
      if (cancelled) return;
      if (result.state === 'ready') {
        setList(result.list);
        setState('ready');
        return;
      }
      if (result.state === 'expired') setState('expired');
      else if (result.state === 'not-found') setState('missing');
      else setState('error');
    });
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  function startPractice() {
    if (!list) return;
    logCustomListEvent('custom_list_practice_started');
    onStartPractice(list, publicId, practiceTestMode);
  }

  const heading = practiceTestMode ? t('customLists.practiceTestHeading') : t('customLists.entryHeading');
  const cta = practiceTestMode ? t('customLists.startPracticeTest') : t('customLists.startSpellingPractice');

  return (
    <CustomListPublicShell
      interfaceLanguage={interfaceLanguage}
      onBack={onBack}
      onHome={onHome}
      onInterfaceLanguageChange={onInterfaceLanguageChange}
      t={t}
    >
      <section className="custom-list-entry" aria-labelledby="custom-list-entry-title">
        <span className="custom-list-preview-badge">
          <FlaskConical size={14} aria-hidden="true" />
          {t('customLists.experimental')}
        </span>
        {state === 'loading' && <p className="custom-list-status" role="status">{t('customLists.loading')}</p>}
        {state === 'ready' && (
          <>
            <h1 id="custom-list-entry-title">{heading}</h1>
            <p>{practiceTestMode ? t('customLists.title') : CUSTOM_LIST_TITLE}</p>
            <button className="custom-list-primary" type="button" onClick={startPractice}>{cta}</button>
          </>
        )}
        {state === 'expired' && <CustomListMessage title={t('customLists.expiredTitle')} body={t('customLists.expiredBody')} />}
        {state === 'missing' && <CustomListMessage title={t('customLists.notFoundTitle')} body={t('customLists.notFoundBody')} />}
        {state === 'error' && <CustomListMessage title={t('customLists.loadErrorTitle')} body={t('customLists.loadErrorBody')} />}
      </section>
    </CustomListPublicShell>
  );
}

function CustomListMessage({ title, body }: { title: string; body: string }) {
  return (
    <>
      <h1>{title}</h1>
      <p>{body}</p>
    </>
  );
}

function findFieldError(errors: CustomListValidationError[], row: number, field: keyof CustomListEntryInput) {
  return errors.find(error => error.row === row && error.field === field);
}

function findRowLevelError(errors: CustomListValidationError[], row: number) {
  return errors.find(error => error.row === row && !error.field);
}

function getSubmittedRowIndexes(rows: CustomListEntryInput[]) {
  return rows
    .slice(0, CUSTOM_LIST_MAX_ROWS)
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.welsh.trim())
    .map(({ index }) => index);
}

function mapServerErrorsToVisibleRows(errors: CustomListValidationError[], submittedRowIndexes: number[]) {
  return errors.map(error => {
    if (typeof error.row !== 'number') return error;
    return {
      ...error,
      row: submittedRowIndexes[error.row] ?? error.row
    };
  });
}

function formatValidationError(error: CustomListValidationError | undefined, t: Translate) {
  if (!error) return '';
  if (error.code === 'welshRequired') return t('customLists.errorWelshRequired');
  if (error.code === 'welshTooLong') return t('customLists.errorWelshTooLong');
  if (error.code === 'englishTooLong') return t('customLists.errorEnglishTooLong');
  if (error.code === 'repeatedSpam') return t('customLists.errorRepeated');
  if (error.code === 'moderationRejected') return t('customLists.errorModerationRow');
  return t('customLists.errorNoEntries');
}

function getCreateErrorMessage(error: string | undefined, t: Translate) {
  if (error === 'rate_limited') return t('customLists.rateLimitError');
  if (error === 'moderation_rejected') return t('customLists.moderationError');
  if (error === 'moderation_failed' || error === 'server_error') return t('customLists.moderationUnavailable');
  if (error === 'validation_failed') return '';
  if (error === 'audio_failed') return t('customLists.audioError');
  return t('customLists.audioError');
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function getBrowserClientId() {
  try {
    const existing = window.localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const next = globalThis.crypto.randomUUID();
    window.localStorage.setItem(CLIENT_ID_KEY, next);
    return next;
  } catch {
    return 'unavailable';
  }
}

function logCustomListEvent(name: string) {
  window.dispatchEvent(new CustomEvent('spelio-analytics', { detail: { name, anonymous: true } }));
}
