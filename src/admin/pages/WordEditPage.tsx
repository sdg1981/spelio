import { ChevronRight, ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminButton, AdminCard, AdminSpinner } from '../components/primitives';
import { UnsavedChangesBar } from '../components/UnsavedChangesBar';
import { WordEditorPanel } from '../components/WordEditorPanel';
import type { AdminRepository } from '../repositories';
import type { AdminWord, AdminWordList } from '../types';

export function WordEditPage({ id, navigate, repository }: { id: string; navigate: (path: string) => void; repository: AdminRepository }) {
  const [source, setSource] = useState<AdminWord | null>(null);
  const [word, setWord] = useState<AdminWord | null>(null);
  const [list, setList] = useState<AdminWordList | null>(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const audioBusyRef = useRef(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setDirty(false);
    setStatusMessage('');
    setErrorMessage('');
    setWord(null);
    setSource(null);
    setList(null);

    repository.getWord(id)
      .then(async nextWord => {
        if (!isMounted) return;
        setSource(nextWord);
        setWord(nextWord);
        if (!nextWord) {
          setErrorMessage('Word not found.');
          return;
        }

        try {
          const nextList = await repository.getWordList(nextWord.listId);
          if (isMounted) setList(nextList);
        } catch (error) {
          console.error(error);
          if (isMounted) setErrorMessage(readError(error, 'Word loaded, but list context could not be loaded.'));
        }
      })
      .catch(error => {
        console.error(error);
        if (isMounted) setErrorMessage(readError(error, 'Could not load word.'));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, repository]);

  function updateWord(patch: Partial<AdminWord>) {
    setWord(previous => previous ? ({ ...previous, ...patch, updatedAt: new Date().toISOString() }) : previous);
    setDirty(true);
    setStatusMessage('');
    setErrorMessage('');
  }

  async function saveChanges() {
    if (!word) return;
    try {
      setSaving(true);
      setErrorMessage('');
      const savedWord = await repository.saveWord(word);
      setSource(savedWord);
      setWord(savedWord);
      setDirty(false);
      setStatusMessage('Saved changes.');
    } catch (error) {
      setErrorMessage(readError(error, 'Save failed.'));
    } finally {
      setSaving(false);
    }
  }

  async function refreshWord(wordId: string) {
    const refreshed = await repository.getWord(wordId);
    if (refreshed) {
      setSource(refreshed);
      setWord(refreshed);
      setDirty(false);
    }
  }

  async function generateWordAudio(target: AdminWord) {
    if (audioBusyRef.current) return;
    if (dirty) {
      setErrorMessage('Save word changes before generating audio.');
      return;
    }

    try {
      audioBusyRef.current = true;
      setAudioBusy(true);
      setErrorMessage('');
      setStatusMessage('');
      const result = await repository.generateAudioForWord(target.id);
      await refreshWord(target.id);
      setStatusMessage(result.ok ? 'Audio generated.' : result.error ?? 'Audio generation failed.');
    } catch (error) {
      setErrorMessage(readError(error, 'Audio generation failed.'));
    } finally {
      audioBusyRef.current = false;
      setAudioBusy(false);
    }
  }

  if (loading) {
    return (
      <>
        <AdminPageHeader title="Edit word" description="Loading word content..." />
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500" role="status" aria-live="polite">
          <AdminSpinner />
          Loading word...
        </div>
      </>
    );
  }

  if (!word) {
    return (
      <>
        <AdminPageHeader
          title="Edit word"
          description="Word not found."
          actions={<AdminButton onClick={() => navigate('/admin/words')}>Back to words</AdminButton>}
        />
        <AdminCard className="p-5 text-sm font-medium text-slate-500">Word not found.</AdminCard>
      </>
    );
  }

  const wordIndex = list?.words.findIndex(item => item.id === word.id) ?? -1;
  const wordTotal = list?.words.length ?? 1;

  return (
    <>
      <AdminPageHeader
        eyebrow={<button className="inline-flex items-center gap-2 hover:text-slate-950" onClick={() => navigate('/admin/words')}>Words <ChevronRight size={14} /> {word.englishPrompt || word.id}</button>}
        title="Edit word"
        description="Update a single word record without leaving the all-words view."
        actions={
          <>
            <AdminButton onClick={() => navigate('/admin/words')}>Back to words</AdminButton>
            {list && <AdminButton onClick={() => navigate(`/admin/word-lists/${list.id}`)}>Open word list <ExternalLink size={16} /></AdminButton>}
            <AdminButton variant="primary" onClick={saveChanges} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</AdminButton>
          </>
        }
      />
      {(statusMessage || errorMessage) && (
        <div className={`mb-5 rounded-md border px-4 py-3 text-sm font-bold ${errorMessage ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
          {errorMessage || statusMessage}
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] xl:items-start">
        <WordEditorPanel
          word={word}
          index={wordIndex >= 0 ? wordIndex : Math.max(0, word.order - 1)}
          total={wordTotal}
          onClose={() => navigate('/admin/words')}
          onChange={updateWord}
          onGenerateAudio={generateWordAudio}
          onRetryAudio={generateWordAudio}
          audioBusy={audioBusy}
          variant="page"
        />
        <aside className="grid gap-4 xl:sticky xl:top-8">
          <AdminCard className="p-5">
            <h2 className="text-base font-black tracking-[-0.02em]">Word list context</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <ContextItem label="Word list" value={list?.name ?? 'Unknown word list'} />
              <ContextItem label="Collection" value={list?.collectionName ?? 'Unknown collection'} />
              <ContextItem label="Position" value={wordIndex >= 0 ? `${wordIndex + 1} of ${wordTotal}` : `Order ${word.order}`} />
              <ContextItem label="List ID" value={word.listId} />
            </dl>
          </AdminCard>
          <AdminCard className="p-5">
            <h2 className="text-base font-black tracking-[-0.02em]">Current word summary</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <ContextItem label="English prompt" value={word.englishPrompt || 'Untitled prompt'} />
              <ContextItem label="Welsh answer" value={word.welshAnswer || 'No answer set'} />
              <ContextItem label="Word ID" value={word.id} />
            </dl>
          </AdminCard>
        </aside>
      </div>
      <UnsavedChangesBar
        visible={dirty}
        onDiscard={() => {
          setWord(source);
          setDirty(false);
          setErrorMessage('');
          setStatusMessage('Discarded changes.');
        }}
        onSave={saveChanges}
      />
    </>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 font-bold text-slate-950">{value}</dd>
    </div>
  );
}

function readError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
