import { ActionRow, PrimaryButton } from './Buttons';
import { Footer } from './Footer';
import { Logo } from './Logo';
import { Check, List, SlidersHorizontal } from './Icons';
import type { SessionResult } from '../lib/practice/storage';
import type { Recommendation } from '../lib/practice/recommendations';

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
}

export function EndScreen({
  result,
  recommendation,
  hasDifficultWords,
  onContinue,
  onReview,
  onChangeLists
}: {
  result: SessionResult;
  recommendation: Recommendation;
  hasDifficultWords: boolean;
  onContinue: () => void;
  onReview: () => void;
  onChangeLists: () => void;
}) {
  const recommendationLooksLikeReview = recommendation.title.toLowerCase().includes('difficult');
  const shouldPrioritiseReview = hasDifficultWords && recommendation.kind === 'review';
  const recommendationTitle = shouldPrioritiseReview ? 'Focus on tricky words' : 'Continue learning';
  const recommendedListName = !hasDifficultWords && recommendationLooksLikeReview
    ? 'Keep building from your selected word list'
    : recommendation.subtitle;
  const primaryTitle = shouldPrioritiseReview ? 'Review difficult words' : 'Continue learning';
  const handlePrimary = shouldPrioritiseReview ? onReview : onContinue;
  const showDifficultReviewSecondary = hasDifficultWords && !shouldPrioritiseReview;
  const secondaryLearningTitle = shouldPrioritiseReview
    ? 'Continue learning'
    : showDifficultReviewSecondary
      ? 'Review difficult words'
      : 'Review recent words';
  const secondaryLearningSubtitle = shouldPrioritiseReview || showDifficultReviewSecondary
    ? shouldPrioritiseReview
      ? 'From where you left off'
      : 'Go over words you found challenging'
    : 'Go over words from this session';
  const handleSecondaryLearning = showDifficultReviewSecondary ? onReview : onContinue;
  const stats = [
    `${result.correctWords} correct`,
    `${result.incorrectWords} incorrect`,
    ...(result.revealedWords > 0 ? [`${result.revealedWords} revealed`] : []),
    formatTime(result.durationSeconds)
  ];

  return (
    <main className="end-bg">
      <section className="page-shell end-shell end-v2-shell">
        <div className="end-logo"><Logo /></div>

        <div className="end-success-orb"><Check size={52} strokeWidth={2.2} /></div>

        <div className="end-copy">
          <h1>Session complete</h1>
          <p>Great work! You’ve finished this session.</p>
        </div>

        <div className="end-recommendation">
          <h2>{recommendationTitle}</h2>
          {!shouldPrioritiseReview && <p>{recommendedListName}</p>}
          <div className="end-stats-line" aria-label="Session stats">
            {stats.map((item, index) => (
              <span key={item}>
                {index > 0 && <span className="end-stat-separator" aria-hidden="true">•</span>}
                {item}
              </span>
            ))}
          </div>
        </div>

        <PrimaryButton className="end-primary" onClick={handlePrimary}>{primaryTitle}</PrimaryButton>

        <div className="action-list end-action-list">
          <ActionRow
            icon={<List size={30} />}
            title={secondaryLearningTitle}
            subtitle={secondaryLearningSubtitle}
            arrowVariant="arrow"
            onClick={handleSecondaryLearning}
          />
          <ActionRow
            icon={<SlidersHorizontal size={30} />}
            title="Change word list"
            subtitle="Choose different lists for your next session"
            arrowVariant="arrow"
            onClick={onChangeLists}
          />
        </div>

        <Footer className="end-footer" />
      </section>
    </main>
  );
}
