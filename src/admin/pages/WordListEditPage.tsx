import { ChevronRight, ExternalLink, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { ContentHealthCard } from '../components/ContentHealthCard';
import { AdminButton, AdminCard, AdminInput, AdminSelect, Field } from '../components/primitives';
import { UnsavedChangesBar } from '../components/UnsavedChangesBar';
import { WordEditorPanel } from '../components/WordEditorPanel';
import { WordRowsTable } from '../components/WordRowsTable';
import type { AdminRepository } from '../repositories';
import type { AdminWord, AdminWordList } from '../types';
import type { AdminStructureOption } from '../types';

export function WordListEditPage({ id, navigate, repository }: { id: string; navigate: (path: string) => void; repository: AdminRepository }) {
  const [source, setSource] = useState<AdminWordList | null>(null);
  const [list, setList] = useState<AdminWordList | null>(null);
  const [wordLists, setWordLists] = useState<AdminWordList[]>([]);
  const [stages, setStages] = useState<AdminStructureOption[]>([]);
  const [focusCategories, setFocusCategories] = useState<AdminStructureOption[]>([]);
  const [selectedWordId, setSelectedWordId] = useState('');
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const selectedWord = useMemo(() => list?.words.find(word => word.id === selectedWordId) ?? list?.words[0], [list?.words, selectedWordId]);
  const selectedIndex = list?.words.findIndex(word => word.id === selectedWord?.id) ?? 0;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      repository.getWordList(id),
      repository.listWordLists(),
      repository.listStages(),
      repository.listFocusCategories()
    ]).then(([nextList, nextWordLists, nextStages, nextFocusCategories]) => {
      const fallback = nextWordLists[0] ?? null;
      const resolved = nextList ?? fallback;
      setSource(resolved);
      setList(resolved);
      setWordLists(nextWordLists);
      setStages(nextStages);
      setFocusCategories(nextFocusCategories);
      setSelectedWordId(resolved?.words[7]?.id ?? resolved?.words[0]?.id ?? '');
      setErrorMessage(resolved ? '' : 'Word list not found.');
    }).catch(error => {
      console.error(error);
      setErrorMessage(readError(error, 'Could not load word list.'));
    }).finally(() => setLoading(false));
  }, [id, repository]);

  function updateList(patch: Partial<AdminWordList>) {
    // TODO: Persist editorial list changes through the content backend.
    setList(previous => previous ? ({ ...previous, ...patch }) : previous);
    setDirty(true);
    setStatusMessage('');
    setErrorMessage('');
  }

  async function saveChanges() {
    if (!list) return;
    try {
      setSaving(true);
      setErrorMessage('');
      // TODO: Send admin saves through a protected server/API route before enabling production writes.
      await repository.saveWordList(list);
      await Promise.all(list.words.map(word => repository.saveWord(word)));
      const savedList = await repository.getWordList(list.id) ?? list;
      setSource(savedList);
      setList(savedList);
      setStatusMessage('Saved changes.');
      setDirty(false);
    } catch (error) {
      setErrorMessage(readError(error, 'Save failed.'));
    } finally {
      setSaving(false);
    }
  }

  async function addWord() {
    if (!list) return;
    const word = createBlankWord(list.id, list.words.length + 1, list.difficulty);
    try {
      setSaving(true);
      setErrorMessage('');
      const savedWord = await repository.createWord(word);
      setList(previous => previous ? ({ ...previous, words: [...previous.words, savedWord] }) : previous);
      setSource(previous => previous ? ({ ...previous, words: [...previous.words, savedWord] }) : previous);
      setSelectedWordId(savedWord.id);
      setStatusMessage('Word added.');
    } catch (error) {
      setErrorMessage(readError(error, 'Could not add word.'));
    } finally {
      setSaving(false);
    }
  }

  async function duplicateWord(word: AdminWord) {
    if (!list) return;
    const duplicated = {
      ...word,
      id: `${word.id}_variant_${Date.now()}`,
      order: list.words.length + 1,
      variantGroupId: word.variantGroupId || word.englishPrompt.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    try {
      setSaving(true);
      const savedWord = await repository.createWord(duplicated);
      setList(previous => previous ? ({ ...previous, words: [...previous.words, savedWord] }) : previous);
      setSource(previous => previous ? ({ ...previous, words: [...previous.words, savedWord] }) : previous);
      setSelectedWordId(savedWord.id);
      setStatusMessage('Variant duplicated.');
    } catch (error) {
      setErrorMessage(readError(error, 'Could not duplicate word.'));
    } finally {
      setSaving(false);
    }
  }

  async function deleteWord(word: AdminWord) {
    if (!window.confirm(`Delete "${word.englishPrompt}" from this list?`)) return;
    try {
      setSaving(true);
      setErrorMessage('');
      await repository.deleteWord(word.id);
      const remainingIds = list?.words.filter(item => item.id !== word.id).map(item => item.id) ?? [];
      await repository.reorderWords(word.listId, remainingIds);
      const refreshed = await repository.getWordList(word.listId);
      const nextList = refreshed ?? (list ? { ...list, words: list.words.filter(item => item.id !== word.id).map((item, index) => ({ ...item, order: index + 1 })) } : null);
      setList(nextList);
      setSource(nextList);
      setSelectedWordId(current => current === word.id ? '' : current);
      setStatusMessage('Word deleted.');
    } catch (error) {
      setErrorMessage(readError(error, 'Delete failed.'));
    } finally {
      setSaving(false);
    }
  }

  async function moveWord(wordId: string, direction: 'up' | 'down') {
    if (!list) return;
    const index = list.words.findIndex(word => word.id === wordId);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= list.words.length) return;
    const reordered = [...list.words];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const orderedWords = reordered.map((word, orderIndex) => ({ ...word, order: orderIndex + 1 }));
    setList({ ...list, words: orderedWords });
    try {
      setSaving(true);
      await repository.reorderWords(list.id, orderedWords.map(word => word.id));
      const refreshed = await repository.getWordList(list.id);
      if (refreshed) {
        setList(refreshed);
        setSource(refreshed);
      }
      setStatusMessage('Word order saved.');
    } catch (error) {
      setErrorMessage(readError(error, 'Could not reorder words.'));
    } finally {
      setSaving(false);
    }
  }

  async function deleteList() {
    if (!list || !window.confirm(`Delete "${list.name}" and all of its words?`)) return;
    try {
      setSaving(true);
      await repository.deleteWordList(list.id);
      navigate('/admin/word-lists');
    } catch (error) {
      setErrorMessage(readError(error, 'Delete list failed.'));
      setSaving(false);
    }
  }

  if (loading || !list || !source) {
    return <AdminPageHeader title="Edit Word List" description="Loading word list content..." />;
  }

  function updateWord(patch: Partial<AdminWord>) {
    if (!selectedWord) return;
    setList(previous => previous ? ({
      ...previous,
      words: previous.words.map(word => word.id === selectedWord.id ? { ...word, ...patch, updatedAt: '2025-05-20' } : word)
    }) : previous);
    setDirty(true);
    setStatusMessage('');
    setErrorMessage('');
  }

  return (
    <>
      <AdminPageHeader
        eyebrow={<button className="inline-flex items-center gap-2 hover:text-slate-950" onClick={() => navigate('/admin/word-lists')}>Word Lists <ChevronRight size={14} /> {list.name}</button>}
        title="Edit Word List"
        description="Update the details and manage the words in this list."
        actions={
          <>
            <AdminButton>View list <ExternalLink size={16} /></AdminButton>
            <AdminButton variant="danger" onClick={deleteList}><Trash2 size={16} /> Delete list</AdminButton>
            <AdminButton variant="primary" onClick={saveChanges} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</AdminButton>
          </>
        }
      />
      {(statusMessage || errorMessage) && (
        <div className={`mb-5 rounded-md border px-4 py-3 text-sm font-bold ${errorMessage ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
          {errorMessage || statusMessage}
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_384px]">
        <div className="grid gap-6">
          <ContentHealthCard list={list} />
          <AdminCard className="p-5">
            <h2 className="mb-4 text-lg font-black tracking-[-0.02em]">List details</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Name"><AdminInput value={list.name} onChange={event => updateList({ name: event.target.value })} /></Field>
              <Field label="Description"><AdminInput value={list.description} onChange={event => updateList({ description: event.target.value })} /></Field>
              <Field label="Welsh display name (optional)"><AdminInput value={list.nameCy} onChange={event => updateList({ nameCy: event.target.value })} /></Field>
              <Field label="Welsh display description (optional)"><AdminInput value={list.descriptionCy} onChange={event => updateList({ descriptionCy: event.target.value })} /></Field>
              <Field label="Stage"><AdminSelect value={list.stageId} onChange={event => {
                const stage = stages.find(item => item.id === event.target.value);
                updateList({ stageId: event.target.value, stage: stage?.name ?? event.target.value });
              }}>{stages.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</AdminSelect></Field>
              <Field label="Focus"><AdminSelect value={list.focusCategoryId} onChange={event => {
                const focus = focusCategories.find(item => item.id === event.target.value);
                updateList({ focusCategoryId: event.target.value, focus: focus?.name ?? event.target.value });
              }}>{focusCategories.map(focus => <option key={focus.id} value={focus.id}>{focus.name}</option>)}</AdminSelect></Field>
              <Field label="Dialect"><AdminSelect value={list.dialect} onChange={event => updateList({ dialect: event.target.value as AdminWordList['dialect'] })}><option>Mixed</option><option>Both</option><option>North Wales</option><option>South Wales / Standard</option><option>Standard</option><option>Other</option></AdminSelect></Field>
              <Field label="Difficulty"><AdminSelect value={list.difficulty} onChange={event => updateList({ difficulty: Number(event.target.value) as AdminWordList['difficulty'] })}><option value={1}>1 - Beginner</option><option value={2}>2 - Easy</option><option value={3}>3 - Developing</option><option value={4}>4 - Challenging</option><option value={5}>5 - Advanced</option></AdminSelect></Field>
              <Field label="Order"><AdminInput type="number" value={list.order} onChange={event => updateList({ order: Number(event.target.value) })} /></Field>
              <Field label="Next list"><AdminSelect value={list.nextListId ?? ''} onChange={event => updateList({ nextListId: event.target.value || null })}><option value="">None</option>{wordLists.map(next => <option key={next.id} value={next.id}>{next.name}</option>)}</AdminSelect></Field>
            </div>
            <p className="mt-5 text-sm text-slate-500">Created {list.createdAt} · Updated {list.updatedAt}</p>
          </AdminCard>
          <AdminCard className="overflow-hidden">
            <WordRowsTable
              words={list.words}
              selectedWordId={selectedWord?.id}
              onSelectWord={word => setSelectedWordId(word.id)}
              onQuickAdd={addWord}
              onAddWord={addWord}
              onGenerateMissingAudio={() => setStatusMessage('Audio generation is not connected yet.')}
              onDuplicateWord={duplicateWord}
              onDeleteWord={deleteWord}
              onMoveWord={moveWord}
            />
          </AdminCard>
        </div>
        {selectedWord && <WordEditorPanel word={selectedWord} index={selectedIndex} total={list.words.length} onClose={() => setSelectedWordId(list.words[0]?.id)} onChange={updateWord} />}
      </div>
      <UnsavedChangesBar visible={dirty} onDiscard={() => { setList(source); setDirty(false); setErrorMessage(''); setStatusMessage('Discarded changes.'); }} onSave={saveChanges} />
    </>
  );
}

function createBlankWord(listId: string, order: number, difficulty: number): AdminWord {
  const now = new Date().toISOString();
  const id = `${listId}_${Date.now()}`;
  return {
    id,
    listId,
    englishPrompt: 'new prompt',
    welshAnswer: 'ateb',
    acceptedAlternatives: [],
    audioUrl: '',
    audioStatus: 'missing',
    notes: '',
    order,
    difficulty,
    dialect: 'Both',
    dialectNote: '',
    usageNote: '',
    variantGroupId: '',
    createdAt: now,
    updatedAt: now
  };
}

function readError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
