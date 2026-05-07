import { Play, RefreshCw, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminButton, AdminCard } from '../components/primitives';
import { StatusPill } from '../components/StatusPill';
import type { AdminRepository, AdminWordWithListName } from '../repositories';

export function AudioQueuePage({ repository }: { repository: AdminRepository }) {
  // TODO: Connect this queue to Azure Voice generation and stored audio URLs.
  const [allWords, setAllWords] = useState<AdminWordWithListName[]>([]);
  useEffect(() => {
    repository.listWords().then(setAllWords).catch(console.error);
  }, [repository]);
  const words = allWords.filter(word => word.audioStatus !== 'generated').slice(0, 18);

  return (
    <>
      <AdminPageHeader
        title="Audio Queue"
        description="Review missing and failed audio before generation. Actions are mocked until Azure Voice integration is connected."
        actions={<AdminButton variant="primary"><Wand2 size={16} /> Generate selected</AdminButton>}
      />
      <AdminCard className="overflow-hidden">
        <div className="grid gap-3 border-b border-slate-200 p-5 sm:grid-cols-3">
          <QueueMetric label="Missing audio" value={words.filter(word => word.audioStatus === 'missing').length} />
          <QueueMetric label="Failed audio" value={words.filter(word => word.audioStatus === 'failed').length} />
          <QueueMetric label="Generated audio" value={allWords.filter(word => word.audioStatus === 'generated').length} />
        </div>
        <div className="divide-y divide-slate-100">
          {words.map(word => (
            <div key={word.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
              <div>
                <div className="font-bold text-slate-950">{word.englishPrompt} → {word.welshAnswer}</div>
                <div className="mt-1 text-sm text-slate-500">{word.listName} · {word.dialect}</div>
              </div>
              <StatusPill tone={word.audioStatus === 'failed' ? 'amber' : 'red'}>{word.audioStatus === 'failed' ? 'Failed' : 'Missing'}</StatusPill>
              <div className="flex gap-2">
                <AdminButton><Play size={15} /> Preview</AdminButton>
                <AdminButton><RefreshCw size={15} /> Regenerate</AdminButton>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </>
  );
}

function QueueMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md bg-slate-50 p-4"><div className="text-2xl font-black">{value}</div><div className="text-sm text-slate-500">{label}</div></div>;
}
