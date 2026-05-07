import type { ReactNode } from 'react';

type Tone = 'red' | 'green' | 'amber' | 'slate' | 'blue';

export function StatusPill({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  const tones: Record<Tone, string> = {
    red: 'bg-red-50 text-red-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-orange-50 text-orange-700',
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-sky-50 text-sky-700'
  };
  const dot: Record<Tone, string> = {
    red: 'bg-red-600',
    green: 'bg-emerald-600',
    amber: 'bg-orange-500',
    slate: 'bg-slate-400',
    blue: 'bg-sky-600'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold ${tones[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[tone]}`} />
      {children}
    </span>
  );
}
