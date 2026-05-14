import type { CSSProperties } from 'react';
import { ActionRow, PrimaryButton } from './Buttons';
import { Footer } from './Footer';
import { Logo } from './Logo';
import { ListCheck, Play, SlidersHorizontal } from './Icons';
import type { InterfaceLanguage, Translate } from '../i18n';
import type { SessionResult } from '../lib/practice/storage';
import type { Recommendation } from '../lib/practice/recommendations';

function clampScore(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function CircularScore({
  correctWords,
  totalWords,
  correctLabel
}: {
  correctWords?: number;
  totalWords?: number;
  correctLabel: string;
}) {
  const total = clampScore(totalWords ?? 0, 0, Number.MAX_SAFE_INTEGER);
  const correct = clampScore(correctWords ?? 0, 0, total);
  const percentage = total > 0 ? clampScore((correct / total) * 100, 0, 100) : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage / 100);
  const ringStyle = {
    '--end-score-circumference': circumference,
    '--end-score-offset': strokeDashoffset
  } as CSSProperties;

  return (
    <div className="end-score-ring" style={ringStyle} aria-label={`${correct}/${total} ${correctLabel}`} role="img">
      <svg className="end-score-ring-svg" viewBox="0 0 132 132" aria-hidden="true">
        <circle className="end-score-ring-track" cx="66" cy="66" r={radius} />
        <circle
          className="end-score-ring-progress"
          cx="66"
          cy="66"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <span className="end-score-ring-text">{correct}/{total}</span>
    </div>
  );
}

function ProgressSummaryLine({ summary }: { summary: string }) {
  const [firstPart, ...remainingParts] = summary.split(' · ');

  if (remainingParts.length === 0) {
    return <p className="end-progress-line">{summary}</p>;
  }

  return (
    <p className="end-progress-line">
      {firstPart}
      {remainingParts.map(part => (
        <span className="end-progress-line-chunk" key={part}> · {part}</span>
      ))}
    </p>
  );
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
  sharedSession,
  onReturnToLearning,
  onPractiseSharedListAgain,
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
  sharedSession?: { listName: string; hasPriorLearningHistory: boolean } | null;
  onReturnToLearning?: () => void;
  onPractiseSharedListAgain?: () => void;
  interfaceLanguage: InterfaceLanguage;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
}) {
  const isSharedSession = Boolean(sharedSession);
  const shouldPrioritiseReview = !isSharedSession && hasDifficultWords && recommendation.kind === 'review';
  const shouldChooseAnotherList = !isSharedSession && recommendation.kind === 'choose_list';
  const recommendedListName = !hasDifficultWords && recommendation.kind === 'review'
    ? t('end.keepBuilding')
    : recommendation.subtitle;
  const primaryTitle = isSharedSession
    ? sharedSession?.hasPriorLearningHistory ? t('end.returnToYourLearning') : t('end.keepLearning')
    : shouldPrioritiseReview
    ? t('home.reviewDifficult')
    : shouldChooseAnotherList
      ? t('home.chooseAnotherList')
      : t('home.continueLearning');
  const handlePrimary = isSharedSession
    ? onReturnToLearning ?? onHome
    : shouldPrioritiseReview
    ? onReview
    : shouldChooseAnotherList
      ? onChangeLists
      : onContinue;
  const secondaryActionIcon = shouldChooseAnotherList
    ? <SlidersHorizontal size={30} />
    : <ListCheck className="change-word-list-icon" size={30} />;

  return (
    <main className="end-bg">
      <section className="page-shell end-shell end-v2-shell">
        <div className="end-logo"><Logo onClick={onHome} backHomeLabel={t('practice.backToHome')} /></div>

        <CircularScore
          correctWords={result.correctWords}
          totalWords={result.totalWords}
          correctLabel={t('end.correct')}
        />

        <div className="end-copy">
          <h1>{t('end.sessionComplete')}</h1>
          {progressSummary && (
            <ProgressSummaryLine summary={progressSummary} />
          )}
        </div>

        <div className={`end-recommendation ${shouldPrioritiseReview ? '' : 'end-recommendation-next'}`.trim()}>
          {isSharedSession ? (
            <>
              <h2>{t('wordLists.sharedWordList')}</h2>
              <p>{sharedSession?.listName}</p>
            </>
          ) : !shouldPrioritiseReview && (
            <>
              <h2>{t('end.nextUp')}</h2>
              <p>{recommendedListName}</p>
            </>
          )}
        </div>

        <PrimaryButton className="end-primary" onClick={handlePrimary}>{primaryTitle}</PrimaryButton>

        <div className="action-list end-action-list">
          {isSharedSession && onPractiseSharedListAgain && (
            <ActionRow
              icon={<Play size={30} />}
              title={t('end.practiseThisListAgain')}
              arrowVariant="arrow"
              onClick={onPractiseSharedListAgain}
            />
          )}
          {shouldPrioritiseReview && (
            <ActionRow
              icon={<Play size={30} />}
              title={t('home.continueLearning')}
              arrowVariant="arrow"
              onClick={onContinue}
            />
          )}
          {shouldChooseAnotherList && (
            <ActionRow
              icon={<Play size={30} />}
              title={t('end.practiseMixAgain')}
              arrowVariant="arrow"
              onClick={onContinue}
            />
          )}
          <ActionRow
            icon={secondaryActionIcon}
            title={shouldChooseAnotherList ? t('practice.backToHome') : t('home.changeWordList')}
            arrowVariant="arrow"
            onClick={shouldChooseAnotherList ? onHome : onChangeLists}
          />
        </div>

        <Footer interfaceLanguage={interfaceLanguage} onInterfaceLanguageChange={onInterfaceLanguageChange} t={t} />
      </section>
    </main>
  );
}
