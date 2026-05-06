import { ActionRow, PrimaryButton } from './Buttons';
import { Footer } from './Footer';
import { Logo } from './Logo';
import { Check, Play, SlidersHorizontal } from './Icons';
import type { SessionResult } from '../lib/practice/storage';
import type { Recommendation } from '../lib/practice/recommendations';

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
}

function getEncouragement(result: SessionResult) {
  const mostlyRevealed = result.revealedWords >= Math.ceil(result.totalWords / 2);
  const veryDifficult = result.correctWords <= Math.floor(result.totalWords / 2) || result.revealedLetters >= result.totalWords;

  if (mostlyRevealed || veryDifficult) return 'That was a tricky one — let’s practise those words again.';
  if (result.incorrectWords > 0 || result.revealedWords > 0 || result.incorrectAttempts > 0 || result.revealedLetters > 0) {
    return 'Good effort — a quick review will help these stick.';
  }

  return 'Great work — you’re ready to keep going.';
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
  const recommendedListName = !hasDifficultWords && recommendationLooksLikeReview
    ? 'Keep building from your selected word list'
    : recommendation.subtitle;
  const primaryTitle = shouldPrioritiseReview ? 'Review difficult words' : 'Continue learning';
  const handlePrimary = shouldPrioritiseReview ? onReview : onContinue;
  const encouragement = getEncouragement(result);
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
          <p>{encouragement}</p>
        </div>

        <div className={`end-recommendation ${shouldPrioritiseReview ? '' : 'end-recommendation-next'}`.trim()}>
          {shouldPrioritiseReview && <h2>Focus on tricky words</h2>}
          <div className="end-stats-line" aria-label="Session stats">
            {stats.map((item, index) => (
              <span key={item}>
                {index > 0 && <span className="end-stat-separator" aria-hidden="true">•</span>}
                {item}
              </span>
            ))}
          </div>
          {!shouldPrioritiseReview && <p>Next up: {recommendedListName}</p>}
        </div>

        <PrimaryButton className="end-primary" onClick={handlePrimary}>{primaryTitle}</PrimaryButton>

        <div className="action-list end-action-list">
          {shouldPrioritiseReview && (
            <ActionRow
              icon={<Play size={30} />}
              title="Continue learning"
              subtitle="From where you left off"
              arrowVariant="arrow"
              onClick={onContinue}
            />
          )}
          <ActionRow
            icon={<SlidersHorizontal size={30} />}
            title="Change word list"
            subtitle="Choose different lists for your next session"
            arrowVariant="arrow"
            onClick={onChangeLists}
          />
        </div>

        <Footer />
      </section>
    </main>
  );
}
