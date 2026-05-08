import { useState } from 'react';
import { Logo } from './Logo';
import { PrimaryButton, ActionRow } from './Buttons';
import { Footer } from './Footer';
import { ListCheck, Play, RotateCcw, Settings } from './Icons';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SettingsModal } from './Practice';
import type { InterfaceLanguage, Translate } from '../i18n';
import type { Recommendation } from '../lib/practice/recommendations';
import type { SpelioSettings } from '../lib/practice/storage';
import { formatRecapWordCount } from '../lib/practice/sessionEngine';

type HomeMode = 'first' | 'returning' | 'struggled';

export function Home({
  mode,
  recommendation,
  progressSummary,
  hasDifficultWords,
  difficultWordCount,
  recapWordCount,
  onStart,
  onContinue,
  onReview,
  onRecapReview,
  onSelectList,
  settings,
  onSettingsChange,
  onResetProgress,
  interfaceLanguage,
  onInterfaceLanguageChange,
  t
}: {
  mode: HomeMode;
  recommendation: Recommendation;
  progressSummary?: string | null;
  hasDifficultWords: boolean;
  difficultWordCount: number;
  recapWordCount: number;
  onStart: () => void;
  onContinue: () => void;
  onReview: () => void;
  onRecapReview: () => void;
  onSelectList: () => void;
  settings: SpelioSettings;
  onSettingsChange: (patch: Partial<SpelioSettings>) => void;
  onResetProgress: () => void;
  interfaceLanguage: InterfaceLanguage;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isFirst = mode === 'first';
  const shouldPrioritiseReview = hasDifficultWords && (mode === 'struggled' || recommendation.kind === 'review');
  const shouldChooseAnotherList = !shouldPrioritiseReview && recommendation.kind === 'choose_list';
  const homeHeading = shouldPrioritiseReview ? t('home.focusTricky') : t('home.continueLearning');
  const primaryLabel = isFirst
    ? t('home.startPractice')
    : shouldPrioritiseReview
      ? t('home.reviewDifficult')
      : shouldChooseAnotherList
        ? t('home.chooseAnotherList')
        : t('home.continueLearning');
  const handlePrimary = shouldPrioritiseReview ? onReview : shouldChooseAnotherList ? onSelectList : onStart;
  const selectListLabel = isFirst ? t('home.selectWordList') : t('home.changeWordList');
  const shellStateClass = isFirst ? 'home-shell-first' : shouldPrioritiseReview ? 'home-shell-review' : 'home-shell-returning';
  const revisitCountLabel = formatRecapWordCount(recapWordCount);
  const showRecapEntry = mode === 'returning' && revisitCountLabel !== null && !shouldPrioritiseReview;

  return (
    <main className="homepage-bg">
      <div className="homepage-utility">
        <LanguageSwitcher
          interfaceLanguage={interfaceLanguage}
          onInterfaceLanguageChange={onInterfaceLanguageChange}
          t={t}
          variant="homepageTop"
        />
        <button
          className="homepage-settings-button"
          type="button"
          aria-label={t('settings.open')}
          onClick={() => setSettingsOpen(true)}
        >
          <Settings size={15} strokeWidth={2} />
        </button>
      </div>
      <section className={`page-shell home-shell ${shellStateClass}`}>
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
            icon={<ListCheck size={30} />}
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
