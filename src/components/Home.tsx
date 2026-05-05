import { Logo } from './Logo';
import { PrimaryButton, ActionRow } from './Buttons';
import { Footer } from './Footer';
import { List } from './Icons';
import type { Recommendation } from '../lib/practice/recommendations';

type HomeMode = 'first' | 'returning' | 'struggled';

export function Home({
  mode,
  recommendation,
  hasDifficultWords,
  onStart,
  onContinue,
  onReview,
  onSelectList
}: {
  mode: HomeMode;
  recommendation: Recommendation;
  hasDifficultWords: boolean;
  onStart: () => void;
  onContinue: () => void;
  onReview: () => void;
  onSelectList: () => void;
}) {
  const isFirst = mode === 'first';
  const shouldPrioritiseReview = hasDifficultWords && (mode === 'struggled' || recommendation.kind === 'review');
  const homeHeading = shouldPrioritiseReview ? 'Focus on tricky words' : 'Continue learning';
  const primaryLabel = isFirst
    ? 'Start spelling practice'
    : shouldPrioritiseReview
      ? 'Review difficult words'
      : 'Continue learning';
  const handlePrimary = shouldPrioritiseReview ? onReview : onStart;
  const selectListLabel = isFirst ? 'Select word list' : 'Change word list';
  const shellStateClass = isFirst ? 'home-shell-first' : shouldPrioritiseReview ? 'home-shell-review' : 'home-shell-returning';

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

        <div className="action-list home-action-list">
          {shouldPrioritiseReview && hasDifficultWords && (
            <ActionRow
              icon={<List size={30} />}
              title="Continue learning"
              subtitle="From where you left off"
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
        </div>

        <Footer className="home-footer" variant="home" />
      </section>
    </main>
  );
}
