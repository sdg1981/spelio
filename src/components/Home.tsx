import { Logo } from './Logo';
import { PrimaryButton, ActionRow } from './Buttons';
import { List, Play, Target } from './Icons';
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
  const isStruggled = mode === 'struggled';

  return (
    <main className="app-bg">
      <section className="page-shell home-shell">
        <Logo />

        <button className="play-orb play-orb-lg mt-[78px] md:mt-14" aria-label="Start practice" onClick={onStart}>
          <span><Play size={70} strokeWidth={1.8} /></span>
        </button>

        <div className="home-copy min-h-[82px] text-center">
          <h1 className={`${isFirst ? 'font-semibold' : 'font-extrabold'} tracking-[-.055em] text-[#071522]`}>
            {isFirst ? (
              <><span>Type what you hear.</span><br /><span>Learn Welsh spelling.</span></>
            ) : isStruggled ? 'Focus on tricky words' : 'Continue learning'}
          </h1>

          {!isFirst && (
            <p className="mt-5 text-[17px] md:text-[16px] text-[#697481]">
              {isStruggled ? 'Based on your last session' : recommendation.subtitle}
            </p>
          )}
        </div>

        <div className="mt-7 w-full">
          <PrimaryButton onClick={onStart}>{isStruggled ? 'Review difficult words' : 'Start spelling practice'}</PrimaryButton>
        </div>

        <div className="mt-12 action-list">
          {!isFirst && !isStruggled && hasDifficultWords && (
            <ActionRow icon={<Target size={30} />} title="Review difficult words" accent="red" onClick={onReview} />
          )}

          {isStruggled && (
            <ActionRow icon={<Play size={30} />} title="Continue learning" subtitle={recommendation.subtitle} accent="red" onClick={onContinue} />
          )}

          <ActionRow icon={<List size={30} />} title="Select word list" onClick={onSelectList} />
        </div>

        <p className="footer-copy mt-16">© 2025 Spelio</p>
      </section>
    </main>
  );
}
