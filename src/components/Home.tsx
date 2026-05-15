import { useEffect, useId, useRef, useState } from 'react';
import { Logo } from './Logo';
import { PrimaryButton, ActionRow } from './Buttons';
import { Footer, shareCurrentPublicPage } from './Footer';
import { ListCheck, Menu, Play, RotateCcw, Settings } from './Icons';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SettingsModal } from './Practice';
import type { InterfaceLanguage, Translate } from '../i18n';
import type { Recommendation } from '../lib/practice/recommendations';
import type { SpelioSettings } from '../lib/practice/storage';
import { formatRecapWordCount } from '../lib/practice/sessionEngine';

type HomeMode = 'first' | 'returning' | 'struggled';
type SharedEntryMode = 'normal-share' | 'practice-test';

export function Home({
  mode,
  recommendation,
  sharedEntryMode,
  progressSummary,
  hasDifficultWords,
  difficultWordCount,
  recapWordCount,
  onStart,
  onContinue,
  onReview,
  onRecapReview,
  onSelectList,
  onHowSpelioWorks,
  onFeedback,
  onPrivacy,
  onAbout,
  settings,
  onSettingsChange,
  onResetProgress,
  interfaceLanguage,
  onInterfaceLanguageChange,
  t
}: {
  mode: HomeMode;
  recommendation: Recommendation;
  sharedEntryMode?: SharedEntryMode | null;
  progressSummary?: string | null;
  hasDifficultWords: boolean;
  difficultWordCount: number;
  recapWordCount: number;
  onStart: () => void;
  onContinue: () => void;
  onReview: () => void;
  onRecapReview: () => void;
  onSelectList: () => void;
  onHowSpelioWorks: () => void;
  onFeedback: () => void;
  onPrivacy: () => void;
  onAbout: () => void;
  settings: SpelioSettings;
  onSettingsChange: (patch: Partial<SpelioSettings>) => void;
  onResetProgress: () => void;
  interfaceLanguage: InterfaceLanguage;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isFirst = mode === 'first';
  const isSharedEntry = Boolean(sharedEntryMode);
  const isPracticeTestEntry = sharedEntryMode === 'practice-test';
  const shouldPrioritiseReview = !isSharedEntry && hasDifficultWords && (mode === 'struggled' || recommendation.kind === 'review');
  const shouldChooseAnotherList = !shouldPrioritiseReview && recommendation.kind === 'choose_list';
  const homeHeading = isSharedEntry
    ? isPracticeTestEntry ? t('wordLists.practiceTest') : t('wordLists.sharedWordList')
    : shouldPrioritiseReview ? t('home.focusTricky') : t('home.continueLearning');
  const primaryLabel = isSharedEntry
    ? isPracticeTestEntry ? t('home.startPracticeTest') : t('home.startPractice')
    : isFirst
    ? t('home.startPractice')
    : shouldPrioritiseReview
      ? t('home.reviewDifficult')
      : shouldChooseAnotherList
        ? t('home.chooseAnotherList')
        : t('home.continueLearning');
  const handlePrimary = shouldPrioritiseReview ? onReview : shouldChooseAnotherList ? onSelectList : onStart;
  const selectListLabel = isFirst ? t('home.selectWordList') : t('home.changeWordList');
  const selectListIconClassName = isFirst ? undefined : 'change-word-list-icon';
  const shellStateClass = isFirst ? 'home-shell-first' : shouldPrioritiseReview ? 'home-shell-review' : 'home-shell-returning';
  const mobileHeroClass = isFirst ? '' : 'home-shell-mobile-centered';
  const revisitCountLabel = formatRecapWordCount(recapWordCount);
  const showRecapEntry = !isSharedEntry && mode === 'returning' && revisitCountLabel !== null && !shouldPrioritiseReview;

  return (
    <main className="homepage-bg">
      <HomepageMenu
        t={t}
        onHowSpelioWorks={onHowSpelioWorks}
        onFeedback={onFeedback}
        onPrivacy={onPrivacy}
        onAbout={onAbout}
      />
      <div className="homepage-utility">
        <LanguageSwitcher
          interfaceLanguage={interfaceLanguage}
          onInterfaceLanguageChange={onInterfaceLanguageChange}
          t={t}
          variant="homepageTop"
        />
      </div>
      <section className={`page-shell home-shell ${shellStateClass} ${mobileHeroClass}`}>
        <div className="home-logo">
          <Logo animateCursor />
        </div>

        <div className={`home-copy ${isFirst ? 'home-copy-first' : ''}`}>
          <h1 className={`home-heading ${isFirst ? 'home-heading-first' : ''}`}>
            {isFirst ? (
              <><span>{t('home.firstHeadingLine1')}</span><br /><span>{t('home.firstHeadingLine2')}</span></>
            ) : homeHeading}
          </h1>

          {!isFirst && (
            <p className="home-support">
              {shouldPrioritiseReview ? t('home.basedOnLastSession') : recommendation.subtitle}
            </p>
          )}
        </div>

        <PrimaryButton className="home-primary" onClick={handlePrimary}>{primaryLabel}</PrimaryButton>

        {!isFirst && progressSummary && (
          <p className="home-progress-line">{progressSummary}</p>
        )}

        <div className="action-list home-action-list">
          {shouldPrioritiseReview && hasDifficultWords && (
            <ActionRow
              icon={<Play size={30} />}
              title={t('home.continueLearning')}
              accent="red"
              arrowVariant="arrow"
              onClick={onContinue}
            />
          )}

          <ActionRow
            icon={<ListCheck className={selectListIconClassName} size={30} />}
            title={selectListLabel}
            arrowVariant="arrow"
            onClick={onSelectList}
          />

          {showRecapEntry && (
            <ActionRow
              icon={<RotateCcw size={28} />}
              title={t('home.revisitWords')}
              trailing={revisitCountLabel}
              arrowVariant="arrow"
              onClick={onRecapReview}
            />
          )}
        </div>

        <div className="homepage-lower-settings">
          <button className="settings-cog" type="button" aria-label={t('settings.open')} onClick={() => setSettingsOpen(true)}>
            <Settings size={22} />
          </button>
        </div>

        <Footer className="home-footer" variant="home" interfaceLanguage={interfaceLanguage} onInterfaceLanguageChange={onInterfaceLanguageChange} t={t} />
      </section>
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          activePracticeSession={false}
          onChange={onSettingsChange}
          onClose={() => setSettingsOpen(false)}
          onResetProgress={onResetProgress}
          t={t}
        />
      )}
    </main>
  );
}

function HomepageMenu({
  t,
  onHowSpelioWorks,
  onFeedback,
  onPrivacy,
  onAbout
}: {
  t: Translate;
  onHowSpelioWorks: () => void;
  onFeedback: () => void;
  onPrivacy: () => void;
  onAbout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<'shared' | 'copied' | null>(null);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const firstItemRef = useRef<HTMLButtonElement | null>(null);
  const shareStatusTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (shareStatusTimer.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(shareStatusTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    }

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);

  function openFeedback() {
    setOpen(false);
    onFeedback();
  }

  function openHowSpelioWorks() {
    setOpen(false);
    onHowSpelioWorks();
  }

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

  function sharePage() {
    setOpen(false);
    void shareCurrentPublicPage(t, showShareStatus);
  }

  return (
    <>
      <div className="homepage-menu" ref={rootRef}>
        <button
          ref={buttonRef}
          className="homepage-menu-button"
          type="button"
          aria-label={t('home.openMenu')}
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-haspopup="true"
          onClick={() => setOpen(current => !current)}
        >
          <Menu size={20} />
        </button>

        {open && (
          <nav className="homepage-menu-popover" id={menuId} aria-label={t('home.menuLabel')}>
            <button ref={firstItemRef} className="homepage-menu-item" type="button" onClick={openHowSpelioWorks}>
              {t('home.howSpelioWorks')}
            </button>
            <button className="homepage-menu-item" type="button" onClick={openFeedback}>
              {t('footer.feedback')}
            </button>
            <button className="homepage-menu-item homepage-menu-mobile-only" type="button" onClick={sharePage} aria-label={t('footer.share')}>
              {t('footer.share')}
            </button>
            <button className="homepage-menu-item" type="button" onClick={() => {
              setOpen(false);
              onPrivacy();
            }}>
              {t('footer.privacy')}
            </button>
            <button className="homepage-menu-item" type="button" onClick={() => {
              setOpen(false);
              onAbout();
            }}>
              {t('footer.about')}
            </button>
          </nav>
        )}
      </div>

      <div className={`app-toast ${shareStatus ? 'visible' : ''}`} role="status" aria-live="polite">
        {shareStatus === 'shared' && t('footer.shared')}
        {shareStatus === 'copied' && t('footer.copied')}
      </div>
    </>
  );
}
