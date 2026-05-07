import { ArrowRight, CheckCircle2, Headphones, ListChecks } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminButton, AdminCard } from '../components/primitives';
import { StatusPill } from '../components/StatusPill';
import type { AdminRepository } from '../repositories';
import { getAudioHealth } from '../repositories';
import type { AdminWordList } from '../types';

export function OverviewPage({ navigate, repository }: { navigate: (path: string) => void; repository: AdminRepository }) {
  const [wordLists, setWordLists] = useState<AdminWordList[]>([]);

  useEffect(() => {
    repository.listWordLists().then(setWordLists).catch(console.error);
  }, [repository]);

  const activeLists = wordLists.filter(list => list.isActive).length;
  const totalWords = wordLists.reduce((sum, list) => sum + list.words.length, 0);
  const missingAudio = wordLists.reduce((sum, list) => sum + getAudioHealth(list).missing, 0);

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description="A quiet editorial home for reviewing content quality and keeping the Welsh spelling library healthy."
        actions={<AdminButton variant="primary" onClick={() => navigate('/admin/word-lists')}>Review word lists <ArrowRight size={16} /></AdminButton>}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <OverviewMetric icon={<ListChecks size={22} />} label="Active lists" value={activeLists} />
        <OverviewMetric icon={<CheckCircle2 size={22} />} label="Words managed" value={totalWords} />
        <OverviewMetric icon={<Headphones size={22} />} label="Missing audio" value={missingAudio} accent />
      </div>
      <AdminCard className="mt-6 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-black tracking-[-0.02em]">Recent content</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {wordLists.slice(0, 6).map(list => (
            <button key={list.id} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50" onClick={() => navigate(`/admin/word-lists/${list.id}`)}>
              <div>
                <div className="font-bold text-slate-950">{list.name}</div>
                <div className="mt-1 text-sm text-slate-500">{list.stage} · {list.focus}</div>
              </div>
              <StatusPill tone={getAudioHealth(list).missing ? 'red' : 'green'}>{getAudioHealth(list).missing ? `${getAudioHealth(list).missing} missing audio` : 'Healthy'}</StatusPill>
            </button>
          ))}
        </div>
      </AdminCard>
    </>
  );
}

function OverviewMetric({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent?: boolean }) {
  return (
    <AdminCard className="p-5">
      <div className={`mb-8 grid h-11 w-11 place-items-center rounded-full ${accent ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-800'}`}>{icon}</div>
      <div className="text-4xl font-black tracking-[-0.04em]">{value}</div>
      <div className="mt-1 text-sm font-medium text-slate-500">{label}</div>
    </AdminCard>
  );
}
