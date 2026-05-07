import { FileText } from 'lucide-react';
import type { AdminWordList } from '../types';
import { AdminButton, AdminCard } from './primitives';

export function ContentHealthCard({ list }: { list: AdminWordList }) {
  const missingAudio = list.words.filter(word => word.audioStatus === 'missing').length;
  const missingDialect = list.words.filter(word => !word.dialect).length;
  const missingNotes = list.words.filter(word => !word.usageNote && !word.dialectNote).length;
  const hasVariants = list.words.filter(word => word.variantGroupId).length;
  const issues = missingAudio + missingDialect + missingNotes;

  return (
    <AdminCard>
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-slate-700" />
          <h2 className="text-lg font-black tracking-[-0.02em]">Content health</h2>
        </div>
        <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
          Active
          <span className={`relative h-5 w-9 rounded-full ${list.isActive ? 'bg-red-600' : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${list.isActive ? 'left-[18px]' : 'left-0.5'}`} />
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-3 lg:grid-cols-[repeat(5,1fr)_auto] lg:divide-y-0">
        <Metric label="Total words" value={list.words.length} />
        <Metric label="Missing audio" value={missingAudio} tone="red" />
        <Metric label="Missing dialect" value={missingDialect} tone="green" />
        <Metric label="Missing notes" value={missingNotes} tone="amber" />
        <Metric label="Has variants" value={hasVariants} tone="slate" />
        <div className="col-span-2 flex items-center justify-end p-4 sm:col-span-1 lg:col-span-1">
          <AdminButton>View issues ({issues})</AdminButton>
        </div>
      </div>
    </AdminCard>
  );
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: number; tone?: 'red' | 'green' | 'amber' | 'slate' }) {
  const tones = {
    red: 'bg-red-500',
    green: 'bg-emerald-400',
    amber: 'bg-orange-400',
    slate: 'bg-slate-300'
  };
  return (
    <div className="p-4">
      <div className="text-xs font-medium text-slate-700">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-2xl font-medium tracking-[-0.03em] text-slate-950">{value}</span>
        {label !== 'Total words' && <span className={`h-4 w-4 rounded-full ${tones[tone]} opacity-80`} />}
      </div>
    </div>
  );
}
