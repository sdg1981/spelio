import { Logo } from './Logo';
import { PrimaryButton, ActionRow } from './Buttons';
import { Footer } from './Footer';
import { List, Play, RotateCcw } from './Icons';
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
  onSelectList
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
}) {
  const isFirst = mode === 'first';
  const shouldPrioritiseReview = hasDifficultWords && (mode === 'struggled' || recommendation.kind === 'review');
  const shouldChooseAnotherList = !shouldPrioritiseReview && recommendation.kind === 'choose_list';
  const homeHeading = shouldPrioritiseReview ? 'Focus on tricky words' : 'Continue learning';
  const primaryLabel = isFirst
    ? 'Start spelling practice'
    : shouldPrioritiseReview
      ? 'Review difficult words'
      : shouldChooseAnotherList
        ? 'Choose another word list'
        : 'Continue learning';
  const handlePrimary = shouldPrioritiseReview ? onReview : shouldChooseAnotherList ? onSelectList : onStart;
  const selectListLabel = isFirst ? 'Select word list' : 'Change word list';
  const shellStateClass = isFirst ? 'home-shell-first' : shouldPrioritiseReview ? 'home-shell-review' : 'home-shell-returning';
  const showRecapEntry = mode === 'returning' && recapWordCount > 0 && !shouldPrioritiseReview;
  const recapCountLabel = recapWordCount >= 5 ? '5+' : String(recapWordCount);

  return (
    <main className="homepage-bg">
      <section className={`page-shell home-shell ${shellStateClass}`}>
        <div className="home-logo">
          <Logo animateCursor />
        </div>

        <div className={`home-copy ${isFirst ? 'home-copy-first' : ''}`}>
          <h1 className={`home-heading ${isFirst ? 'home-heading-first' : ''}`}>
            {isFirst ? (
              <><span>Type what you hear.</span><br /><span>Learn Welsh spelling.</span></>
            ) : homeHeading}
          </h1>

          {!isFirst && (
            <p className="home-support">
              {shouldPrioritiseReview ? 'Based on your last session' : recommendation.subtitle}
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
              title="Continue learning"
              subtitle="From where you left off"
              accent="red"
              arrowVariant="arrow"
              onClick={onContinue}
            />
          )}

          <ActionRow
            icon={<List size={30} />}
            title={selectListLabel}
            subtitle={!isFirst ? 'Choose a different list' : undefined}
            subtitleClassName="home-desktop-subtitle"
            arrowVariant="arrow"
            onClick={onSelectList}
          />

          {showRecapEntry && (
            <ActionRow
              icon={<RotateCcw size={28} />}
              title="From earlier"
              subtitle="Revisit a few words"
              trailing={recapCountLabel}
              arrowVariant="arrow"
              onClick={onRecapReview}
            />
          )}
        </div>

        <Footer className="home-footer" variant="home" />
      </section>
    </main>
  );
}
