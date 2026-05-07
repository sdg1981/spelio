import { Play, RefreshCw, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AudioStatusPill } from '../components/audioStatus';
import { AdminButton, AdminCard } from '../components/primitives';
import type { AdminRepository, AdminWordWithListName } from '../repositories';

export function AudioQueuePage({ repository }: { repository: AdminRepository }) {
  const [allWords, setAllWords] = useState<AdminWordWithListName[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function refresh() {
    const queue = await repository.getAudioQueue();
    setAllWords(queue.words);
  }

  useEffect(() => {
    refresh().catch(error => setErrorMessage(readError(error, 'Could not load audio queue.')));
  }, [repository]);

  const actionWords = useMemo(
    () => allWords.filter(word => word.audioStatus !== 'ready').slice(0, 40),
    [allWords]
  );
  const selectedActionIds = selectedIds.filter(id => actionWords.some(word => word.id === id));
  const missingIds = actionWords.filter(word => word.audioStatus === 'missing').map(word => word.id);
  const selectedMissingIds = selectedIds.filter(id => actionWords.some(word => word.id === id && word.audioStatus === 'missing'));

  async function runAction(action: () => Promise<unknown>, success: string) {
    try {
      setBusy(true);
      setErrorMessage('');
      setStatusMessage('');
      await action();
      await refresh();
      setStatusMessage(success);
    } catch (error) {
      setErrorMessage(readError(error, 'Audio action failed.'));
    } finally {
      setBusy(false);
    }
  }

  function toggleSelected(wordId: string) {
    setSelectedIds(current => current.includes(wordId) ? current.filter(id => id !== wordId) : [...current, wordId]);
  }

  return (
    <>
      <AdminPageHeader
        title="Audio Queue"
        description="Generate and retry Welsh audio for imported words."
        actions={
          <div className="flex flex-wrap gap-2">
            <AdminButton onClick={() => runAction(() => repository.queueAudioGeneration(selectedMissingIds.length ? selectedMissingIds : missingIds), `Queued ${(selectedMissingIds.length ? selectedMissingIds : missingIds).length} missing audio item(s).`)} disabled={busy || (selectedMissingIds.length ? selectedMissingIds : missingIds).length === 0}>
              {selectedMissingIds.length ? 'Queue selected missing' : 'Queue missing'}
            </AdminButton>
            <AdminButton variant="primary" onClick={() => runAction(() => repository.generateAudioBatch(selectedActionIds), `Generated ${selectedActionIds.length} selected audio item(s).`)} disabled={busy || selectedActionIds.length === 0}>
              <Wand2 size={16} /> Generate selected
            </AdminButton>
          </div>
        }
      />
      {(statusMessage || errorMessage) && (
        <div className={`mb-5 rounded-md border px-4 py-3 text-sm font-bold ${errorMessage ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
          {errorMessage || statusMessage}
        </div>
      )}
      <AdminCard className="overflow-hidden">
        <div className="grid gap-3 border-b border-slate-200 p-5 sm:grid-cols-5">
          <QueueMetric label="Missing" value={allWords.filter(word => word.audioStatus === 'missing').length} />
          <QueueMetric label="Queued" value={allWords.filter(word => word.audioStatus === 'queued').length} />
          <QueueMetric label="Generating" value={allWords.filter(word => word.audioStatus === 'generating').length} />
          <QueueMetric label="Failed" value={allWords.filter(word => word.audioStatus === 'failed').length} />
          <QueueMetric label="Ready" value={allWords.filter(word => word.audioStatus === 'ready').length} />
        </div>
        <div className="divide-y divide-slate-100">
          {actionWords.map(word => (
            <div key={word.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[auto_1fr_140px_auto] lg:items-center">
              <input
                type="checkbox"
                className="h-4 w-4 accent-red-600"
                checked={selectedIds.includes(word.id)}
                onChange={() => toggleSelected(word.id)}
                aria-label={`Select ${word.welshAnswer}`}
              />
              <div>
                <div className="font-bold text-slate-950">{word.englishPrompt} {'->'} {word.welshAnswer}</div>
                <div className="mt-1 text-sm text-slate-500">{word.listName} · {word.dialect}</div>
              </div>
              <AudioStatusPill status={word.audioStatus} />
              <div className="flex flex-wrap justify-end gap-2">
                <AdminButton onClick={() => word.audioUrl && void new Audio(word.audioUrl).play()} disabled={!word.audioUrl}>
                  <Play size={15} /> Preview
                </AdminButton>
                <AdminButton onClick={() => runAction(() => word.audioStatus === 'failed' ? repository.retryAudioGeneration(word.id) : repository.generateAudioForWord(word.id), 'Audio generation finished.')} disabled={busy}>
                  <RefreshCw size={15} /> {word.audioStatus === 'failed' ? 'Retry' : 'Generate'}
                </AdminButton>
              </div>
            </div>
          ))}
          {actionWords.length === 0 && <div className="px-5 py-8 text-sm font-medium text-slate-500">No missing, queued, generating, or failed audio items.</div>}
        </div>
      </AdminCard>
    </>
  );
}

function QueueMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md bg-slate-50 p-4"><div className="text-2xl font-black">{value}</div><div className="text-sm text-slate-500">{label}</div></div>;
}

function readError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
