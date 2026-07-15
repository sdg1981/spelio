import { useEffect, useId, useRef, useState } from 'react';
import type { Translate } from '../i18n';
import {
  detectNativeAppEnvironment,
  dismissNativeUpdate,
  fetchNativeUpdatePolicy,
  getNativeUpdateCandidate,
  isNativeUpdateDismissed,
  type NativeUpdateCandidate
} from '../lib/nativeUpdate';

export function NativeUpdateNotice({ enabled, t }: { enabled: boolean; t: Translate }) {
  const [candidate, setCandidate] = useState<NativeUpdateCandidate | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const updateButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || candidate) return;
    let cancelled = false;
    void (async () => {
      const environment = await detectNativeAppEnvironment();
      if (environment.kind !== 'capacitor-ios') return;
      const policy = await fetchNativeUpdatePolicy();
      if (!policy || cancelled) return;
      const nextCandidate = getNativeUpdateCandidate(environment, policy);
      if (!nextCandidate || isNativeUpdateDismissed(nextCandidate, window.localStorage, window.sessionStorage)) return;
      setCandidate(nextCandidate);
    })();
    return () => { cancelled = true; };
  }, [candidate, enabled]);

  useEffect(() => {
    if (!candidate || !enabled) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    updateButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      dismissNativeUpdate(candidate, window.localStorage, window.sessionStorage);
      setCandidate(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [candidate, enabled]);

  if (!candidate || !enabled) return null;

  const dismiss = (rememberForInterval = true) => {
    dismissNativeUpdate(candidate, window.localStorage, window.sessionStorage, Date.now(), rememberForInterval);
    setCandidate(null);
  };

  const openStore = () => {
    dismiss(false);
    window.location.assign(candidate.storeUrl);
  };

  return (
    <div className="overlay native-update-overlay">
      <section
        className="modal modal-small modal-accent native-update-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <h2 className="modal-title" id={titleId}>{t('nativeUpdate.title')}</h2>
        <p className="modal-text native-update-body" id={descriptionId}>{t('nativeUpdate.body')}</p>
        <div className="native-update-actions">
          <button ref={updateButtonRef} className="done-button native-update-primary" type="button" onClick={openStore}>
            {t('nativeUpdate.update')}
          </button>
          <button className="clear-button native-update-secondary" type="button" onClick={() => dismiss()}>
            {t('nativeUpdate.notNow')}
          </button>
        </div>
      </section>
    </div>
  );
}
