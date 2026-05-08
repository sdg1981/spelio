import { Play, RefreshCw, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AudioStatusPill } from '../components/audioStatus';
import { AdminButton, AdminCard, AdminSpinner } from '../components/primitives';
import type { AdminRepository, AdminWordWithListName } from '../repositories';
import { hasPlayableAudioUrl, logAudioPlaybackClick, playAudioUrl } from '../../lib/audioPlayback';
import type { AudioStatus } from '../types';

const PAGE_SIZE = 40;

type StatusFilter = 'all' | AudioStatus;

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'missing', label: 'Missing' },
  { value: 'queued', label: 'Queued' },
  { value: 'generating', label: 'Generating' },
  { value: 'failed', label: 'Failed' },
  { value: 'ready', label: 'Generated' }
];

export function AudioQueuePage({ repository }: { repository: AdminRepository }) {
  const [allWords, setAllWords] = useState<AdminWordWithListName[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [queueMissingBusy, setQueueMissingBusy] = useState(false);
  const [selectedBatchBusy, setSelectedBatchBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
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

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [statusFilter]);

  const counts = useMemo(() => ({
    missing: allWords.filter(word => word.audioStatus === 'missing').length,
    queued: allWords.filter(word => word.audioStatus === 'queued').length,
    generating: allWords.filter(word => word.audioStatus === 'generating').length,
    failed: allWords.filter(word => word.audioStatus === 'failed').length,
    ready: allWords.filter(word => word.audioStatus === 'ready').length
  }), [allWords]);

  const filteredWords = useMemo(
    () => statusFilter === 'all' ? allWords.filter(word => word.audioStatus !== 'ready') : allWords.filter(word => word.audioStatus === statusFilter),
    [allWords, statusFilter]
  );
  const visibleWords = filteredWords.slice(0, visibleCount);
  const selectedVisibleIds = selectedIds.filter(id => visibleWords.some(word => word.id === id));
  const selectedGeneratableIds = selectedIds.filter(id => allWords.some(word => word.id === id && word.audioStatus !== 'ready'));
  const selectedVisibleGeneratableIds = selectedIds.filter(id => visibleWords.some(word => word.id === id && word.audioStatus !== 'ready'));
  const visibleMissingIds = visibleWords.filter(word => word.audioStatus === 'missing').map(word => word.id);
  const selectedMissingIds = selectedIds.filter(id => allWords.some(word => word.id === id && word.audioStatus === 'missing'));
  const allVisibleSelected = visibleWords.length > 0 && visibleWords.every(word => selectedIds.includes(word.id));

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

  function selectAllVisible() {
    setSelectedIds(current => Array.from(new Set([...current, ...visibleWords.map(word => word.id)])));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function updateStatusFilter(nextFilter: StatusFilter) {
    setStatusFilter(nextFilter);
  }

  return (
    <>
      <AdminPageHeader
        title="Audio Queue"
        description="Generate and retry Welsh audio for imported words."
        actions={
          <div className="flex flex-wrap items-start gap-3">
            <div className="max-w-xs">
              <AdminButton onClick={() => queueMissingAudio(selectedMissingIds.length ? selectedMissingIds : visibleMissingIds)} disabled={queueMissingBusy || (selectedMissingIds.length ? selectedMissingIds : visibleMissingIds).length === 0} aria-disabled={queueMissingBusy}>
                {queueMissingBusy && <AdminSpinner />}
                {queueMissingBusy ? 'Queueing...' : selectedMissingIds.length ? 'Queue selected missing audio' : 'Queue missing audio'}
              </AdminButton>
              <div className="mt-1 text-xs font-medium leading-5 text-slate-500">Find words without generated audio and add them to the queue.</div>
            </div>
            <AdminButton variant="primary" onClick={() => generateSelectedAudio(selectedGeneratableIds)} disabled={selectedBatchBusy || selectedGeneratableIds.length === 0} aria-disabled={selectedBatchBusy}>
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
          <QueueMetric label="Missing audio" value={counts.missing} helper="No generated audio URL yet." />
          <QueueMetric label="Queued" value={counts.queued} helper="Waiting to be generated." />
          <QueueMetric label="Generating" value={counts.generating} helper="Currently being synthesized." />
          <QueueMetric label="Failed" value={counts.failed} helper="Last generation attempt failed." />
          <QueueMetric label="Generated" value={counts.ready} helper="Audio has been generated successfully." />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {statusFilters.map(filter => (
              <button
                key={filter.value}
                type="button"
                onClick={() => updateStatusFilter(filter.value)}
                aria-pressed={statusFilter === filter.value}
                className={`rounded-md border px-3 py-2 text-sm font-bold transition ${statusFilter === filter.value ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600">
            <span>{selectedIds.length} selected</span>
            <AdminButton onClick={selectAllVisible} disabled={!visibleWords.length || allVisibleSelected} className="min-h-9 px-3">
              Select all visible
            </AdminButton>
            <AdminButton onClick={clearSelection} disabled={!selectedIds.length} className="min-h-9 px-3">
              Clear selection
            </AdminButton>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 text-sm text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-700">{visibleWords.length}</span> of <span className="font-bold text-slate-700">{filteredWords.length}</span>
            {statusFilter !== 'all' && <> {statusFilters.find(filter => filter.value === statusFilter)?.label.toLowerCase()} item(s)</>}
          </div>
          <div className="font-medium">
            Generate selected uses only selected rows that are not already generated.
            {selectedVisibleIds.length > 0 && selectedVisibleGeneratableIds.length !== selectedVisibleIds.length && <> {selectedVisibleIds.length - selectedVisibleGeneratableIds.length} generated item(s) will be skipped.</>}
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {visibleWords.map(word => {
            const wordBusy = generatingWordIds.has(word.id) || batchGeneratingWordIds.has(word.id);
            const runningLabel = word.audioStatus === 'failed' ? 'Regenerating...' : 'Generating...';
            const isGenerated = word.audioStatus === 'ready';

            return (
              <div key={word.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[auto_1fr_140px_auto] lg:items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-red-600"
                  checked={selectedIds.includes(word.id)}
                  onChange={() => toggleSelected(word.id)}
                  aria-label={`Select audio row for ${word.englishPrompt} to ${word.welshAnswer}`}
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
                  <AdminButton onClick={() => generateAudioForQueueWord(word)} disabled={wordBusy || isGenerated} aria-disabled={wordBusy || isGenerated}>
                    {wordBusy ? <AdminSpinner /> : <RefreshCw size={15} />}
                    {wordBusy ? runningLabel : isGenerated ? 'Generated' : word.audioStatus === 'failed' ? 'Retry' : 'Generate'}
                  </AdminButton>
                </div>
              </div>
            );
          })}
          {visibleWords.length === 0 && <div className="px-5 py-8 text-sm font-medium text-slate-500">{getEmptyStateCopy(statusFilter)}</div>}
        </div>
        {visibleWords.length < filteredWords.length && (
          <div className="border-t border-slate-200 p-5 text-center">
            <AdminButton onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>
              Load more
            </AdminButton>
          </div>
        )}
      </AdminCard>
    </>
  );
}

function QueueMetric({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-4" title={helper}>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-sm font-bold text-slate-600">{label}</div>
      <div className="mt-1 text-xs leading-5 text-slate-500">{helper}</div>
    </div>
  );
}

function getEmptyStateCopy(statusFilter: StatusFilter) {
  if (statusFilter === 'missing') return 'No missing audio found.';
  if (statusFilter === 'queued') return 'No queued audio jobs.';
  if (statusFilter === 'generating') return 'No audio jobs are generating.';
  if (statusFilter === 'failed') return 'No failed audio jobs.';
  if (statusFilter === 'ready') return 'No generated audio found.';
  return 'No audio items found.';
}

function readError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
