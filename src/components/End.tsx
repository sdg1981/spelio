import { ActionRow, PrimaryButton } from './Buttons';
import { Footer } from './Footer';
import { Logo } from './Logo';
import { Check, Play, SlidersHorizontal } from './Icons';
import type { SessionResult } from '../lib/practice/storage';
import type { Recommendation } from '../lib/practice/recommendations';

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
  progressSummary,
  hasDifficultWords,
  onContinue,
  onReview,
  onChangeLists,
  onHome
}: {
  result: SessionResult;
  recommendation: Recommendation;
  progressSummary?: string | null;
  hasDifficultWords: boolean;
  onContinue: () => void;
  onReview: () => void;
  onChangeLists: () => void;
  onHome: () => void;
}) {
  const recommendationLooksLikeReview = recommendation.title.toLowerCase().includes('difficult');
  const shouldPrioritiseReview = hasDifficultWords && recommendation.kind === 'review';
  const shouldChooseAnotherList = recommendation.kind === 'choose_list';
  const recommendedListName = !hasDifficultWords && recommendationLooksLikeReview
    ? 'Keep building from your selected word list'
    : recommendation.subtitle;
  const primaryTitle = shouldPrioritiseReview
    ? 'Review difficult words'
    : shouldChooseAnotherList
      ? 'Choose another word list'
      : 'Continue learning';
  const handlePrimary = shouldPrioritiseReview
    ? onReview
    : shouldChooseAnotherList
      ? onChangeLists
      : onContinue;
  const encouragement = shouldPrioritiseReview
    ? 'That was a tricky one — let’s practise those words again.'
    : getEncouragement(result);
  const stats = [
    `${result.correctWords} correct`,
    `${result.incorrectWords} incorrect`,
    ...(result.revealedWords > 0 ? [`${result.revealedWords} revealed`] : [])
  ];

  return (
    <main className="end-bg">
      <section className="page-shell end-shell end-v2-shell">
        <div className="end-logo"><Logo onClick={onHome} /></div>

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
          {progressSummary && (
            <p className="end-progress-line">{progressSummary}</p>
          )}
          {!shouldPrioritiseReview && (
            <>
              <h2>Next up</h2>
              <p>{recommendedListName}</p>
            </>
          )}
        </div>

        <PrimaryButton className="end-primary" onClick={handlePrimary}>{primaryTitle}</PrimaryButton>

        <div className="action-list end-action-list">
          {shouldPrioritiseReview && (
            <ActionRow
              icon={<Play size={30} />}
              title="Continue learning"
              subtitle="Pick up where you left off"
              arrowVariant="arrow"
              onClick={onContinue}
            />
          )}
          {shouldChooseAnotherList && (
            <ActionRow
              icon={<Play size={30} />}
              title="Practise this mix again"
              subtitle="Repeat your selected lists"
              arrowVariant="arrow"
              onClick={onContinue}
            />
          )}
          <ActionRow
            icon={<SlidersHorizontal size={30} />}
            title={shouldChooseAnotherList ? 'Back to home' : 'Change word list'}
            subtitle={shouldChooseAnotherList ? 'Return to the homepage' : 'Choose different lists for your next session'}
            arrowVariant="arrow"
            onClick={shouldChooseAnotherList ? onHome : onChangeLists}
          />
        </div>

        <Footer />
      </section>
    </main>
  );
}
