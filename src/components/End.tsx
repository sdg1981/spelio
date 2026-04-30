import { ActionRow } from './Buttons';
import { BookOpen, Check, SlidersHorizontal, Target } from './Icons';
import type { SessionResult } from '../lib/practice/storage';
import type { Recommendation } from '../lib/practice/recommendations';

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes === 0) return `${remaining}s`;
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

export function EndScreen({
  result,
  recommendation,
  hasDifficultWords,
  onContinue,
  onReview,
  onChangeLists,
  onHome
}: {
  result: SessionResult;
  recommendation: Recommendation;
  hasDifficultWords: boolean;
  onContinue: () => void;
  onReview: () => void;
  onChangeLists: () => void;
  onHome: () => void;
}) {
  const stats = [
    ['✓', String(result.correctWords), 'Correct', 'text-[#20a65a]'],
    ['×', String(result.incorrectWords), 'Incorrect', 'text-[#d90000]'],
    ['~', String(result.revealedWords), 'Revealed', 'text-[#c4a100]'],
    ['◷', formatTime(result.durationSeconds), 'Time taken', 'text-[#2b83d4]']
  ];

  const primaryTitle = result.state === 'struggled' && hasDifficultWords ? 'Review difficult words' : recommendation.title;
  const primarySubtitle = result.state === 'struggled' && hasDifficultWords ? 'Based on your last session' : recommendation.subtitle;

  return (
    <main className="app-bg relative">
      <div className="progress-top"><div className="progress-track"><div className="progress-fill" style={{ width: '100%' }} /></div></div>
      <section className="page-shell end-shell">
        <div className="text-[24px] md:text-[14px] font-bold text-[#6e7783]">{result.totalWords} / {result.totalWords}</div>
        <div className="success-orb mt-8 md:mt-6"><Check size={92} strokeWidth={1.75} /></div>
        <h1 className="mt-9 md:mt-6 text-center font-black tracking-[-.065em] text-[#19a352]">Excellent!</h1>
        <p className="mt-4 text-[#66717c]">You’ve completed this practice session.</p>

        <div className="stats-grid mt-12 md:mt-10">
          {stats.map(([icon, number, label, className]) => (
            <div className="stat" key={label}>
              <div className={`stat-icon ${className}`}>{icon}</div>
              <div className="stat-num">{number}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        <h2 className="mt-12 md:mt-10 w-full max-w-[620px] text-left text-[34px] md:text-[24px] font-black tracking-[-.055em]">What’s next?</h2>
        <div className="card-list mt-7">
          <ActionRow primary icon={<BookOpen size={30} />} title={primaryTitle} subtitle={primarySubtitle} onClick={result.state === 'struggled' && hasDifficultWords ? onReview : onContinue} />
          {hasDifficultWords && result.state !== 'struggled' && <ActionRow icon={<Target size={30} />} title="Review difficult words" subtitle="Go over words you found challenging" accent="blue" onClick={onReview} />}
          <ActionRow icon={<SlidersHorizontal size={30} />} title="Change word lists" subtitle="Choose different lists for your next session" onClick={onChangeLists} />
        </div>

        <button className="mt-10 border-0 bg-transparent text-[28px] md:text-[18px] text-[#d90000]" onClick={onHome}>⌂&nbsp;&nbsp;Back to home</button>
      </section>
    </main>
  );
}
