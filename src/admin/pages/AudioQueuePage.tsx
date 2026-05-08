import { Play, RefreshCw, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AudioStatusPill } from '../components/audioStatus';
import { AdminButton, AdminCard, AdminSpinner } from '../components/primitives';
import type { AdminRepository, AdminWordWithListName } from '../repositories';
import { hasPlayableAudioUrl, logAudioPlaybackClick, playAudioUrl } from '../../lib/audioPlayback';

export function AudioQueuePage({ repository }: { repository: AdminRepository }) {
  const [allWords, setAllWords] = useState<AdminWordWithListName[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [queueMissingBusy, setQueueMissingBusy] = useState(false);
  const [selectedBatchBusy, setSelectedBatchBusy] = useState(false);
  const [generatingWordIds, setGeneratingWordIds] = useState<Set<string>>(() => new Set());
  const [batchGeneratingWordIds, setBatchGeneratingWordIds] = useState<Set<string>>(() => new Set());
  const queueMissingBusyRef = useRef(false);
  const selectedBatchBusyRef = useRef(false);
  const generatingWordIdsRef = useRef<Set<string>>(new Set());
  const batchGeneratingWordIdsRef = useRef<Set<string>>(new Set());
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
      setErrorMessage('');
      setStatusMessage('');
      await action();
      await refresh();
      setStatusMessage(success);
    } catch (error) {
      setErrorMessage(readError(error, 'Audio action failed.'));
    }
  }

  async function queueMissingAudio(wordIds: string[]) {
    if (queueMissingBusyRef.current || !wordIds.length) return;
    try {
      queueMissingBusyRef.current = true;
      setQueueMissingBusy(true);
      await runAction(() => repository.queueAudioGeneration(wordIds), `Queued ${wordIds.length} missing audio item(s).`);
    } finally {
      queueMissingBusyRef.current = false;
      setQueueMissingBusy(false);
    }
  }

  async function generateSelectedAudio(wordIds: string[]) {
    if (selectedBatchBusyRef.current || !wordIds.length) return;
    try {
      selectedBatchBusyRef.current = true;
      batchGeneratingWordIdsRef.current = new Set(wordIds);
      setSelectedBatchBusy(true);
      setBatchGeneratingWordIds(new Set(batchGeneratingWordIdsRef.current));
      await runAction(() => repository.generateAudioBatch(wordIds), `Generated ${wordIds.length} selected audio item(s).`);
    } finally {
      selectedBatchBusyRef.current = false;
      batchGeneratingWordIdsRef.current = new Set();
      setSelectedBatchBusy(false);
      setBatchGeneratingWordIds(new Set(batchGeneratingWordIdsRef.current));
    }
  }

  async function generateAudioForQueueWord(word: AdminWordWithListName) {
    if (generatingWordIdsRef.current.has(word.id) || batchGeneratingWordIdsRef.current.has(word.id)) return;
    try {
      generatingWordIdsRef.current = new Set(generatingWordIdsRef.current).add(word.id);
      setGeneratingWordIds(new Set(generatingWordIdsRef.current));
      await runAction(
        () => word.audioStatus === 'failed' ? repository.retryAudioGeneration(word.id) : repository.generateAudioForWord(word.id),
        'Audio generation finished.'
      );
    } finally {
      const next = new Set(generatingWordIdsRef.current);
      next.delete(word.id);
      generatingWordIdsRef.current = next;
      setGeneratingWordIds(next);
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
            <AdminButton onClick={() => queueMissingAudio(selectedMissingIds.length ? selectedMissingIds : missingIds)} disabled={queueMissingBusy || (selectedMissingIds.length ? selectedMissingIds : missingIds).length === 0} aria-disabled={queueMissingBusy}>
              {queueMissingBusy && <AdminSpinner />}
              {queueMissingBusy ? 'Queueing...' : selectedMissingIds.length ? 'Queue selected missing' : 'Queue missing'}
            </AdminButton>
            <AdminButton variant="primary" onClick={() => generateSelectedAudio(selectedActionIds)} disabled={selectedBatchBusy || selectedActionIds.length === 0} aria-disabled={selectedBatchBusy}>
              {selectedBatchBusy ? <AdminSpinner /> : <Wand2 size={16} />}
              {selectedBatchBusy ? 'Generating...' : 'Generate selected'}
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
          {actionWords.map(word => {
            const wordBusy = generatingWordIds.has(word.id) || batchGeneratingWordIds.has(word.id);
            const runningLabel = word.audioStatus === 'failed' ? 'Regenerating...' : 'Generating...';

            return (
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
                <AdminButton onClick={() => {
                  logAudioPlaybackClick('admin-audio-queue-preview', word.audioUrl);
                  void playAudioUrl(word.audioUrl);
                }} disabled={!hasPlayableAudioUrl(word.audioUrl)}>
                  <Play size={15} /> Preview
                </AdminButton>
                <AdminButton onClick={() => generateAudioForQueueWord(word)} disabled={wordBusy} aria-disabled={wordBusy}>
                  {wordBusy ? <AdminSpinner /> : <RefreshCw size={15} />}
                  {wordBusy ? runningLabel : word.audioStatus === 'failed' ? 'Retry' : 'Generate'}
                </AdminButton>
              </div>
            </div>
            );
          })}
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
