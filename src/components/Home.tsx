import { Logo } from './Logo';
import { PrimaryButton, ActionRow } from './Buttons';
import { Footer } from './Footer';
import { List, Play, RotateCcw } from './Icons';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { InterfaceLanguage, Translate } from '../i18n';
import type { Recommendation } from '../lib/practice/recommendations';

type HomeMode = 'first' | 'returning' | 'struggled';

export function Home({
  mode,
  recommendation,
  progressSummary,
  hasDifficultWords,
  recapWordCount,
  onStart,
  onContinue,
  onReview,
  onRecapReview,
  onSelectList,
  interfaceLanguage,
  onInterfaceLanguageChange,
  t
}: {
  mode: HomeMode;
  recommendation: Recommendation;
  progressSummary?: string | null;
  hasDifficultWords: boolean;
  recapWordCount: number;
  onStart: () => void;
  onContinue: () => void;
  onReview: () => void;
  onRecapReview: () => void;
  onSelectList: () => void;
  interfaceLanguage: InterfaceLanguage;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
}) {
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
  const showRecapEntry = mode === 'returning' && recapWordCount > 0 && !shouldPrioritiseReview;
  const recapCountLabel = recapWordCount >= 5 ? '5+' : String(recapWordCount);

  return (
    <main className="homepage-bg">
      <LanguageSwitcher
        interfaceLanguage={interfaceLanguage}
        onInterfaceLanguageChange={onInterfaceLanguageChange}
        t={t}
        variant="homepageTop"
      />
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
            icon={<List size={30} />}
            title={selectListLabel}
            arrowVariant="arrow"
            onClick={onSelectList}
          />

          {showRecapEntry && (
            <ActionRow
              icon={<RotateCcw size={28} />}
              title={t('home.revisitWords')}
              trailing={recapCountLabel}
              arrowVariant="arrow"
              onClick={onRecapReview}
            />
          )}
        </div>

        <Footer className="home-footer" variant="home" interfaceLanguage={interfaceLanguage} onInterfaceLanguageChange={onInterfaceLanguageChange} t={t} />
      </section>
    </main>
  );
}
