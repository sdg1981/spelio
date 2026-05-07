import { ActionRow, PrimaryButton } from './Buttons';
import { Footer } from './Footer';
import { Logo } from './Logo';
import { Check, Play, SlidersHorizontal } from './Icons';
import type { InterfaceLanguage, Translate } from '../i18n';
import type { SessionResult } from '../lib/practice/storage';
import type { Recommendation } from '../lib/practice/recommendations';

function getEncouragement(result: SessionResult, t: Translate) {
  const mostlyRevealed = result.revealedWords >= Math.ceil(result.totalWords / 2);
  const veryDifficult = result.correctWords <= Math.floor(result.totalWords / 2) || result.revealedLetters >= result.totalWords;

  if (mostlyRevealed || veryDifficult) return t('end.trickyEncouragement');
  if (result.incorrectWords > 0 || result.revealedWords > 0 || result.incorrectAttempts > 0 || result.revealedLetters > 0) {
    return t('end.reviewHelps');
  }

  return t('end.greatWork');
}

export function EndScreen({
  result,
  recommendation,
  progressSummary,
  hasDifficultWords,
  onContinue,
  onReview,
  onChangeLists,
  onHome,
  interfaceLanguage,
  onInterfaceLanguageChange,
  t
}: {
  result: SessionResult;
  recommendation: Recommendation;
  progressSummary?: string | null;
  hasDifficultWords: boolean;
  onContinue: () => void;
  onReview: () => void;
  onChangeLists: () => void;
  onHome: () => void;
  interfaceLanguage: InterfaceLanguage;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
}) {
  const shouldPrioritiseReview = hasDifficultWords && recommendation.kind === 'review';
  const shouldChooseAnotherList = recommendation.kind === 'choose_list';
  const recommendedListName = !hasDifficultWords && recommendation.kind === 'review'
    ? t('end.keepBuilding')
    : recommendation.subtitle;
  const primaryTitle = shouldPrioritiseReview
    ? t('home.reviewDifficult')
    : shouldChooseAnotherList
      ? t('home.chooseAnotherList')
      : t('home.continueLearning');
  const handlePrimary = shouldPrioritiseReview
    ? onReview
    : shouldChooseAnotherList
      ? onChangeLists
      : onContinue;
  const encouragement = shouldPrioritiseReview
    ? t('end.trickyEncouragement')
    : getEncouragement(result, t);
  const stats = [
    `${result.correctWords} ${t('end.correct')}`,
    `${result.incorrectWords} ${t('end.incorrect')}`,
    ...(result.revealedWords > 0 ? [`${result.revealedWords} ${t('end.revealed')}`] : [])
  ];

  return (
    <main className="end-bg">
      <section className="page-shell end-shell end-v2-shell">
        <div className="end-logo"><Logo onClick={onHome} backHomeLabel={t('practice.backToHome')} /></div>

        <div className="end-success-orb"><Check size={52} strokeWidth={2.2} /></div>

        <div className="end-copy">
          <h1>{t('end.sessionComplete')}</h1>
          <p>{encouragement}</p>
        </div>

        <div className={`end-recommendation ${shouldPrioritiseReview ? '' : 'end-recommendation-next'}`.trim()}>
          {shouldPrioritiseReview && <h2>{t('home.focusTricky')}</h2>}
          <div className="end-stats-line" aria-label={t('end.sessionStats')}>
            {stats.map((item, index) => (
              <span key={item}>
                {index > 0 && <span className="end-stat-separator" aria-hidden="true">•</span>}
                {item}
              </span>
            ))}
          </div>
          {progressSummary && (
            <p className="end-progress-line">{progressSummary}</p>
          )}
          {!shouldPrioritiseReview && (
            <>
              <h2>{t('end.nextUp')}</h2>
              <p>{recommendedListName}</p>
            </>
          )}
        </div>

        <PrimaryButton className="end-primary" onClick={handlePrimary}>{primaryTitle}</PrimaryButton>

        <div className="action-list end-action-list">
          {shouldPrioritiseReview && (
            <ActionRow
              icon={<Play size={30} />}
              title={t('home.continueLearning')}
              subtitle={t('end.pickUpWhereLeftOff')}
              arrowVariant="arrow"
              onClick={onContinue}
            />
          )}
          {shouldChooseAnotherList && (
            <ActionRow
              icon={<Play size={30} />}
              title={t('end.practiseMixAgain')}
              subtitle={t('end.repeatSelectedLists')}
              arrowVariant="arrow"
              onClick={onContinue}
            />
          )}
          <ActionRow
            icon={<SlidersHorizontal size={30} />}
            title={shouldChooseAnotherList ? t('practice.backToHome') : t('home.changeWordList')}
            subtitle={shouldChooseAnotherList ? t('end.returnHomepage') : t('end.chooseDifferentNext')}
            arrowVariant="arrow"
            onClick={shouldChooseAnotherList ? onHome : onChangeLists}
          />
        </div>

        <Footer interfaceLanguage={interfaceLanguage} onInterfaceLanguageChange={onInterfaceLanguageChange} t={t} />
      </section>
    </main>
  );
}
