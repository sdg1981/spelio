import { ChevronDown, ChevronRight, Copy, ExternalLink, Play, Plus, Trash2, Wand2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTimestamp } from '../components/AdminTimestamp';
import { ContentHealthCard } from '../components/ContentHealthCard';
import { AdminButton, AdminCard, AdminInput, AdminSelect, AdminSpinner, AdminTextarea, Field } from '../components/primitives';
import { UnsavedChangesBar } from '../components/UnsavedChangesBar';
import { WordEditorPanel } from '../components/WordEditorPanel';
import { WordRowsTable } from '../components/WordRowsTable';
import type { AdminRepository } from '../repositories';
import { validateAdminWordListSlug } from '../services/wordListSlug';
import { ADMIN_CONTENT_DELETE_FLAG, getDeleteConfirmationPhrase, isAdminContentDeleteAllowed, isDeleteConfirmationValid } from '../services/contentDeleteSafety';
import { applyPrimerContentDraftUpdate, createNeutralPrimerSoundItem } from '../services/primerEditor';
import type { AdminWord, AdminWordList, AdminWordListCollection, ElevenLabsGenerationMode } from '../types';
import type { AdminStructureOption } from '../types';
import { getWordListCanonicalUrl } from '../../lib/wordListSharing';
import type { WordListPrimerContent, WordListPrimerSoundItem } from '../../data/wordLists';
import { createEmptyPrimerContent, normalizePrimerContent, toPrimerContentStorage } from '../../content/foundationsPrimer';
import { hasPlayableAudioUrl, logAudioPlaybackClick, playAudioUrl } from '../../lib/audioPlayback';

export function WordListEditPage({ id, navigate, repository }: { id: string; navigate: (path: string) => void; repository: AdminRepository }) {
  const [source, setSource] = useState<AdminWordList | null>(null);
  const [list, setList] = useState<AdminWordList | null>(null);
  const [wordLists, setWordLists] = useState<AdminWordList[]>([]);
  const [collections, setCollections] = useState<AdminWordListCollection[]>([]);
  const [stages, setStages] = useState<AdminStructureOption[]>([]);
  const [selectedWordId, setSelectedWordId] = useState('');
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [generatingAudioWordIds, setGeneratingAudioWordIds] = useState<Set<string>>(() => new Set());
  const [generatingElevenLabsAudioWordIds, setGeneratingElevenLabsAudioWordIds] = useState<Set<string>>(() => new Set());
  const [generatingPrimerAudioKeys, setGeneratingPrimerAudioKeys] = useState<Set<string>>(() => new Set());
  const [batchAudioBusy, setBatchAudioBusy] = useState(false);
  const generatingAudioWordIdsRef = useRef<Set<string>>(new Set());
  const generatingElevenLabsAudioWordIdsRef = useRef<Set<string>>(new Set());
  const generatingPrimerAudioKeysRef = useRef<Set<string>>(new Set());
  const batchAudioBusyRef = useRef(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const selectedWord = useMemo(() => list?.words.find(word => word.id === selectedWordId) ?? list?.words[0], [list?.words, selectedWordId]);
  const selectedIndex = list?.words.findIndex(word => word.id === selectedWord?.id) ?? 0;
  const publicUrl = useMemo(() => list ? getWordListCanonicalUrl(list) : '', [list]);
  const slugError = useMemo(() => list ? validateAdminWordListSlug(list.slug, wordLists, list.id) : '', [list, wordLists]);
  const deleteAllowed = isAdminContentDeleteAllowed(import.meta.env.VITE_ALLOW_ADMIN_CONTENT_DELETE);
  const canConfirmDeleteList = list ? isDeleteConfirmationValid(deleteConfirmationText, list.id) : false;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      repository.getWordList(id),
      repository.listWordLists(),
      repository.listCollections(),
      repository.listStages()
    ]).then(([nextList, nextWordLists, nextCollections, nextStages]) => {
      const fallback = nextWordLists[0] ?? null;
      const resolved = nextList ?? fallback;
      setSource(resolved);
      setList(resolved);
      setWordLists(nextWordLists);
      setCollections(nextCollections);
      setStages(nextStages);
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
      await persistListChanges(list, 'Saved changes.');
    } catch (error) {
      setErrorMessage(readError(error, 'Save failed.'));
    }
  }

  async function persistListChanges(listToSave: AdminWordList, successMessage?: string) {
    if (slugError) {
      setErrorMessage(slugError);
      throw new Error(slugError);
    }
    try {
      setSaving(true);
      setErrorMessage('');
      const listForSave = {
        ...listToSave,
        primerContent: toPrimerContentStorage(normalizePrimerContent(listToSave.primerContent))
      };
      // TODO: Send admin saves through a protected server/API route before enabling production writes.
      await repository.saveWordList(listForSave);
      await Promise.all(listToSave.words.map(word => repository.saveWord(word)));
      const savedList = await repository.getWordList(listToSave.id) ?? listToSave;
      setSource(savedList);
      setList(savedList);
      if (successMessage) setStatusMessage(successMessage);
      setDirty(false);
      return savedList;
    } catch (error) {
      if (error instanceof Error && error.message === slugError) throw error;
      throw new Error(readError(error, 'Save failed.'));
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

  async function refreshCurrentList(listId: string) {
    const refreshed = await repository.getWordList(listId);
    if (refreshed) {
      setList(refreshed);
      setSource(refreshed);
    }
  }

  async function generateWordAudio(word: AdminWord) {
    if (generatingAudioWordIdsRef.current.has(word.id)) return;
    if (dirty) {
      setErrorMessage('Save word changes before generating audio.');
      return;
    }
    try {
      generatingAudioWordIdsRef.current = new Set(generatingAudioWordIdsRef.current).add(word.id);
      setGeneratingAudioWordIds(new Set(generatingAudioWordIdsRef.current));
      setErrorMessage('');
      setStatusMessage('');
      const result = await repository.generateAudioForWord(word.id);
      await refreshCurrentList(word.listId);
      setStatusMessage(result.ok ? 'Audio generated.' : result.error ?? 'Audio generation failed.');
    } catch (error) {
      setErrorMessage(readError(error, 'Audio generation failed.'));
    } finally {
      const next = new Set(generatingAudioWordIdsRef.current);
      next.delete(word.id);
      generatingAudioWordIdsRef.current = next;
      setGeneratingAudioWordIds(next);
    }
  }

  async function generateElevenLabsAudio(word: AdminWord, mode: ElevenLabsGenerationMode) {
    if (generatingElevenLabsAudioWordIdsRef.current.has(word.id)) return;
    if (dirty) {
      setErrorMessage('Save word changes before generating ElevenLabs audio.');
      return;
    }
    try {
      generatingElevenLabsAudioWordIdsRef.current = new Set(generatingElevenLabsAudioWordIdsRef.current).add(word.id);
      setGeneratingElevenLabsAudioWordIds(new Set(generatingElevenLabsAudioWordIdsRef.current));
      setErrorMessage('');
      setStatusMessage('');
      const result = await repository.generateElevenLabsAudioForWord(word.id, mode);
      await refreshCurrentList(word.listId);
      if (result.ok) {
        setStatusMessage(
          mode === 'azure_transform'
            ? 'ElevenLabs audio generated using Azure pronunciation.'
            : mode === 'context_extract'
              ? 'ElevenLabs audio generated from context phrase.'
              : 'ElevenLabs audio generated.'
        );
      }
      else setErrorMessage(result.error ?? 'ElevenLabs audio generation failed.');
    } catch (error) {
      setErrorMessage(readError(error, 'ElevenLabs audio generation failed.'));
    } finally {
      const next = new Set(generatingElevenLabsAudioWordIdsRef.current);
      next.delete(word.id);
      generatingElevenLabsAudioWordIdsRef.current = next;
      setGeneratingElevenLabsAudioWordIds(next);
    }
  }

  async function generateMissingAudioForList() {
    if (!list) return;
    if (batchAudioBusyRef.current) return;
    if (dirty) {
      setErrorMessage('Save word changes before generating audio.');
      return;
    }
    const wordIds = list.words.filter(word => word.audioStatus === 'missing' || word.audioStatus === 'failed').map(word => word.id);
    if (!wordIds.length) {
      setStatusMessage('No missing or failed audio to generate.');
      return;
    }
    try {
      batchAudioBusyRef.current = true;
      setBatchAudioBusy(true);
      setErrorMessage('');
      setStatusMessage(`Generating ${wordIds.length} audio item(s)...`);
      const results = await repository.generateAudioBatch(wordIds);
      await refreshCurrentList(list.id);
      const failed = results.filter(result => !result.ok).length;
      setStatusMessage(failed ? `Audio generation finished with ${failed} failure(s).` : `Generated ${results.length} audio item(s).`);
    } catch (error) {
      setErrorMessage(readError(error, 'Batch audio generation failed.'));
    } finally {
      batchAudioBusyRef.current = false;
      setBatchAudioBusy(false);
    }
  }

  function updatePrimerContent(updater: (primer: WordListPrimerContent) => WordListPrimerContent) {
    if (!list) return;
    updateList({ primerContent: applyPrimerContentDraftUpdate(list.primerContent, updater) });
  }

  function addPrimerSoundItem() {
    const primer = normalizePrimerContent(list?.primerContent);
    const nextOrder = primer.soundItems.length + 1;
    updatePrimerContent(current => ({
      ...current,
      soundItems: [
        ...current.soundItems,
        createNeutralPrimerSoundItem(nextOrder)
      ]
    }));
  }

  function updatePrimerSoundItem(itemKey: string, patch: Partial<WordListPrimerSoundItem>) {
    updatePrimerContent(current => ({
      ...current,
      soundItems: current.soundItems.map(item => item.key === itemKey || item.id === itemKey ? { ...item, ...patch } : item)
    }));
  }

  function removePrimerSoundItem(itemKey: string) {
    updatePrimerContent(current => ({
      ...current,
      soundItems: current.soundItems.filter(item => item.key !== itemKey && item.id !== itemKey)
    }));
  }

  function movePrimerSoundItem(itemKey: string, direction: 'up' | 'down') {
    const primer = normalizePrimerContent(list?.primerContent);
    const index = primer.soundItems.findIndex(item => item.key === itemKey || item.id === itemKey);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= primer.soundItems.length) return;
    const reordered = [...primer.soundItems];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    updatePrimerContent(current => ({
      ...current,
      soundItems: reordered.map((item, orderIndex) => ({ ...item, order: orderIndex + 1 }))
    }));
  }

  async function generatePrimerAudio(item: WordListPrimerSoundItem, provider: 'azure' | 'elevenlabs') {
    if (!list || generatingPrimerAudioKeysRef.current.has(item.key)) return;
    try {
      generatingPrimerAudioKeysRef.current = new Set(generatingPrimerAudioKeysRef.current).add(item.key);
      setGeneratingPrimerAudioKeys(new Set(generatingPrimerAudioKeysRef.current));
      setErrorMessage('');
      setStatusMessage('');
      const generationList = dirty ? await persistListChanges(list) : list;
      const generationItem = normalizePrimerContent(generationList.primerContent).soundItems.find(soundItem => soundItem.key === item.key || soundItem.id === item.key);
      if (!generationItem) throw new Error('Primer sound item not found after saving current changes.');
      const result = await repository.generatePrimerAudioItem(generationList.id, generationItem.key, provider);
      await refreshCurrentList(generationList.id);
      if (result.ok) setStatusMessage(provider === 'elevenlabs' ? 'Primer ElevenLabs audio generated.' : 'Primer Azure audio generated.');
      else setErrorMessage(result.error ?? 'Primer audio generation failed.');
    } catch (error) {
      setErrorMessage(readError(error, 'Primer audio generation failed.'));
    } finally {
      const next = new Set(generatingPrimerAudioKeysRef.current);
      next.delete(item.key);
      generatingPrimerAudioKeysRef.current = next;
      setGeneratingPrimerAudioKeys(next);
    }
  }

  async function clearPrimerAudio(item: WordListPrimerSoundItem) {
    if (!list) return;
    try {
      setErrorMessage('');
      setStatusMessage('');
      const clearList = dirty ? await persistListChanges(list) : list;
      const clearItem = normalizePrimerContent(clearList.primerContent).soundItems.find(soundItem => soundItem.key === item.key || soundItem.id === item.key);
      if (!clearItem) throw new Error('Primer sound item not found after saving current changes.');
      await repository.clearPrimerAudioItem(clearList.id, clearItem.key);
      await refreshCurrentList(clearList.id);
      setStatusMessage('Primer audio cleared.');
    } catch (error) {
      setErrorMessage(readError(error, 'Could not clear primer audio.'));
    }
  }

  async function deleteList() {
    if (!list || !canConfirmDeleteList) return;
    try {
      setSaving(true);
      const result = await repository.deleteWordList(list.id);
      setStatusMessage(`Deleted ${result.listsDeleted} list and ${result.wordsDeleted} word(s).`);
      navigate('/admin/word-lists');
    } catch (error) {
      setErrorMessage(readError(error, 'Delete list failed.'));
      setSaving(false);
    }
  }

  async function copyPublicLink() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setStatusMessage('Public link copied.');
    setErrorMessage('');
  }

  function openPublicLink() {
    if (!publicUrl) return;
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
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
            <AdminButton onClick={openPublicLink}>View list <ExternalLink size={16} /></AdminButton>
            {deleteAllowed && (
              <AdminButton
                variant="danger"
                onClick={() => {
                  setDeleteModalOpen(true);
                  setDeleteConfirmationText('');
                  setErrorMessage('');
                  setStatusMessage('');
                }}
              >
                <Trash2 size={16} /> Delete list
              </AdminButton>
            )}
            <AdminButton variant="primary" onClick={saveChanges} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</AdminButton>
          </>
        }
      />
      {!deleteAllowed && (
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          Destructive list deletion is unavailable. Set {ADMIN_CONTENT_DELETE_FLAG}=true only for an intentional admin cleanup.
        </div>
      )}
      {(statusMessage || errorMessage) && (
        <div className={`mb-5 rounded-md border px-4 py-3 text-sm font-bold ${errorMessage ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
          {errorMessage || statusMessage}
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_384px]">
        <div className="grid gap-6">
          <ContentHealthCard list={list} onActiveChange={isActive => updateList({ isActive })} />
          <AdminCard className="p-5">
            <h2 className="mb-4 text-lg font-black tracking-[-0.02em]">List details</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Name"><AdminInput value={list.name} onChange={event => updateList({ name: event.target.value })} /></Field>
              <Field label="Description"><AdminInput value={list.description} onChange={event => updateList({ description: event.target.value })} /></Field>
              <Field label="Welsh display name (optional)"><AdminInput value={list.nameCy} onChange={event => updateList({ nameCy: event.target.value })} /></Field>
              <Field label="Welsh display description (optional)"><AdminInput value={list.descriptionCy} onChange={event => updateList({ descriptionCy: event.target.value })} /></Field>
              <Field label="Collection"><AdminSelect value={list.collectionId} onChange={event => {
                const collection = collections.find(item => item.id === event.target.value);
                updateList({ collectionId: event.target.value, collectionName: collection?.name ?? event.target.value });
              }}>{collections.map(collection => <option key={collection.id} value={collection.id}>{collection.name}</option>)}</AdminSelect></Field>
              <Field label="Internal stage" helper="Reference metadata for progression/imports. Public catalogue labels may use a separate display mapping."><AdminSelect value={list.stageId} onChange={event => {
                const stage = stages.find(item => item.id === event.target.value);
                updateList({ stageId: event.target.value, stage: stage?.name ?? event.target.value });
              }}>{stages.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</AdminSelect></Field>
              <Field label="Dialect"><AdminSelect value={list.dialect} onChange={event => updateList({ dialect: event.target.value as AdminWordList['dialect'] })}><option>Mixed</option><option>Both</option><option>North Wales</option><option>South Wales / Standard</option><option>Standard</option><option>Other</option></AdminSelect></Field>
              <Field label="Difficulty"><AdminSelect value={list.difficulty} onChange={event => updateList({ difficulty: Number(event.target.value) as AdminWordList['difficulty'] })}><option value={1}>1 - Beginner</option><option value={2}>2 - Easy</option><option value={3}>3 - Developing</option><option value={4}>4 - Challenging</option><option value={5}>5 - Advanced</option></AdminSelect></Field>
              <Field label="List type" helper="Support lists are hidden from learner catalogue/progression but remain available for contextual practice and audio maintenance."><AdminSelect value={list.listType ?? 'main'} onChange={event => {
                const listType = event.target.value as AdminWordList['listType'];
                updateList({
                  listType,
                  isSupportList: listType === 'support',
                  hiddenFromMainCatalogue: listType === 'support' ? true : list.hiddenFromMainCatalogue
                });
              }}><option value="main">Main progression list</option><option value="support">Hidden support list</option></AdminSelect></Field>
              <Field label="Order"><AdminInput type="number" value={list.order} onChange={event => updateList({ order: Number(event.target.value) })} /></Field>
              <Field label="Next list"><AdminSelect value={list.nextListId ?? ''} onChange={event => updateList({ nextListId: event.target.value || null })}><option value="">None</option>{wordLists.map(next => <option key={next.id} value={next.id}>{next.name}</option>)}</AdminSelect></Field>
              <Field label="Catalogue visibility" helper="Keep support lists hidden from public word-list selection.">
                <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
                  <input type="checkbox" checked={list.hiddenFromMainCatalogue === true} onChange={event => updateList({ hiddenFromMainCatalogue: event.target.checked })} />
                  Hidden from main catalogue
                </label>
              </Field>
            </div>
            <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] md:items-end">
                <Field
                  label="Public URL slug"
                  helper={slugError || 'Lowercase letters, numbers, and hyphens only.'}
                >
                  <AdminInput
                    value={list.slug}
                    aria-invalid={Boolean(slugError)}
                    onChange={event => updateList({ slug: event.target.value })}
                  />
                </Field>
                <div className="grid gap-2">
                  <span className="text-xs font-bold text-slate-700">Canonical public URL</span>
                  <a className="truncate rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-600" href={publicUrl} target="_blank" rel="noreferrer">
                    {publicUrl}
                  </a>
                </div>
                <AdminButton onClick={copyPublicLink} disabled={Boolean(slugError)}>
                  <Copy size={16} /> Copy public link
                </AdminButton>
              </div>
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Created <AdminTimestamp value={list.createdAt} /> · Updated <AdminTimestamp value={list.updatedAt} />
            </p>
          </AdminCard>
          <AdminCard className="p-5">
            <details>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-black tracking-[-0.02em] text-slate-950">
                <span>Primer / Introduction</span>
                <ChevronDown size={18} />
              </summary>
              <PrimerEditor
                primer={normalizePrimerContent(list.primerContent)}
                busyKeys={generatingPrimerAudioKeys}
                onChange={updatePrimerContent}
                onAddSoundItem={addPrimerSoundItem}
                onUpdateSoundItem={updatePrimerSoundItem}
                onRemoveSoundItem={removePrimerSoundItem}
                onMoveSoundItem={movePrimerSoundItem}
                onGenerateAudio={generatePrimerAudio}
                onClearAudio={clearPrimerAudio}
              />
            </details>
          </AdminCard>
          <AdminCard className="overflow-hidden">
            <WordRowsTable
              words={list.words}
              selectedWordId={selectedWord?.id}
              onSelectWord={word => setSelectedWordId(word.id)}
              onQuickAdd={addWord}
              onAddWord={addWord}
              onGenerateMissingAudio={generateMissingAudioForList}
              audioBatchBusy={batchAudioBusy}
              onDuplicateWord={duplicateWord}
              onDeleteWord={deleteWord}
              onMoveWord={moveWord}
            />
          </AdminCard>
        </div>
        {selectedWord && (
          <WordEditorPanel
            word={selectedWord}
            index={selectedIndex}
            total={list.words.length}
            onClose={() => setSelectedWordId(list.words[0]?.id)}
            onChange={updateWord}
            onGenerateAudio={generateWordAudio}
            onGenerateElevenLabsAudio={generateElevenLabsAudio}
            onRetryAudio={generateWordAudio}
            audioBusy={generatingAudioWordIds.has(selectedWord.id)}
            elevenLabsAudioBusy={generatingElevenLabsAudioWordIds.has(selectedWord.id)}
          />
        )}
      </div>
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-lg border border-red-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-black text-slate-950">Delete word list</h2>
                <p className="mt-1 text-sm text-slate-600">This will delete the list and all words inside it.</p>
              </div>
              <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" type="button" onClick={() => setDeleteModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 p-5 text-sm">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="font-bold text-slate-950">{list.name}</div>
                <div className="mt-1 font-mono text-xs text-slate-600">{list.id}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-slate-200 p-3"><b>1</b><span className="ml-1 text-slate-600">list deleted</span></div>
                <div className="rounded-md border border-slate-200 p-3"><b>{list.words.length}</b><span className="ml-1 text-slate-600">word(s) deleted</span></div>
              </div>
              <div className="rounded-md border border-red-100 bg-red-50 p-4 font-bold text-red-700">This cannot be undone.</div>
              <label className="grid gap-2">
                <span className="text-xs font-bold text-slate-700">Type {getDeleteConfirmationPhrase(list.id)} to confirm</span>
                <AdminInput value={deleteConfirmationText} onChange={event => setDeleteConfirmationText(event.target.value)} autoFocus />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <AdminButton onClick={() => setDeleteModalOpen(false)}>Cancel</AdminButton>
              <AdminButton variant="danger" disabled={!canConfirmDeleteList || saving} onClick={deleteList}>
                <Trash2 size={16} /> {saving ? 'Deleting...' : 'Delete list & words'}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
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
    elevenLabsAudioUrl: '',
    elevenLabsAudioStatus: 'missing',
    elevenLabsGenerationMode: 'direct',
    preferredElevenLabsGenerationMode: 'direct',
    elevenLabsPronunciationHint: '',
    elevenLabsPronunciationHintUsed: false,
    elevenLabsPronunciationHintText: '',
    elevenLabsContextPhrase: '',
    elevenLabsExtractMode: 'none',
    elevenLabsExtractChunkCount: 1,
    elevenLabsExtractStartOffsetMs: 80,
    elevenLabsExtractionUsed: false,
    elevenLabsContextPhraseUsed: '',
    elevenLabsGeneratedAt: '',
    elevenLabsModel: '',
    elevenLabsVoiceId: '',
    elevenLabsLanguageOverride: '',
    elevenLabsPrompt: '',
    audioReviewStatus: 'unchecked',
    notes: '',
    order,
    difficulty,
    dialect: 'Both',
    dialectNote: '',
    usageNote: '',
    spellingHintId: '',
    disablePatternHints: false,
    variantGroupId: '',
    createdAt: now,
    updatedAt: now
  };
}

function PrimerEditor({
  primer,
  busyKeys,
  onChange,
  onAddSoundItem,
  onUpdateSoundItem,
  onRemoveSoundItem,
  onMoveSoundItem,
  onGenerateAudio,
  onClearAudio
}: {
  primer: WordListPrimerContent;
  busyKeys: Set<string>;
  onChange: (updater: (primer: WordListPrimerContent) => WordListPrimerContent) => void;
  onAddSoundItem: () => void;
  onUpdateSoundItem: (itemKey: string, patch: Partial<WordListPrimerSoundItem>) => void;
  onRemoveSoundItem: (itemKey: string) => void;
  onMoveSoundItem: (itemKey: string, direction: 'up' | 'down') => void;
  onGenerateAudio: (item: WordListPrimerSoundItem, provider: 'azure' | 'elevenlabs') => void;
  onClearAudio: (item: WordListPrimerSoundItem) => void;
}) {
  const normalized = primer ?? createEmptyPrimerContent();
  const sortedItems = [...normalized.soundItems].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));

  function patchPrimer(patch: Partial<WordListPrimerContent>) {
    onChange(current => ({ ...current, ...patch }));
  }

  return (
    <div className="mt-5 grid gap-5">
      <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
        <input type="checkbox" checked={normalized.enabled} onChange={event => patchPrimer({ enabled: event.target.checked })} />
        Primer enabled
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="English primer title">
          <AdminInput value={normalized.titleEn} onChange={event => patchPrimer({ titleEn: event.target.value })} />
        </Field>
        <Field label="Welsh primer title">
          <AdminInput value={normalized.titleCy} onChange={event => patchPrimer({ titleCy: event.target.value })} />
        </Field>
        <Field label="English primer body">
          <AdminTextarea value={normalized.bodyEn} onChange={event => patchPrimer({ bodyEn: event.target.value })} />
        </Field>
        <Field label="Welsh primer body">
          <AdminTextarea value={normalized.bodyCy} onChange={event => patchPrimer({ bodyCy: event.target.value })} />
        </Field>
      </div>
      <div className="rounded-md border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <h3 className="text-sm font-black text-slate-950">Primer sound items</h3>
            <p className="mt-1 text-xs text-slate-500">Labels stay learner-facing; generation text can be an exemplar word.</p>
          </div>
          <AdminButton onClick={onAddSoundItem}><Plus size={16} /> Add sound item</AdminButton>
        </div>
        <div className="grid gap-3 p-4">
          {!sortedItems.length && <div className="rounded-md border border-dashed border-slate-200 p-4 text-sm font-bold text-slate-500">No primer sound items.</div>}
          {sortedItems.map((item, index) => {
            const busy = busyKeys.has(item.key);
            const canPreview = hasPlayableAudioUrl(item.audioUrl);
            return (
              <div key={item.key || item.id} className="grid gap-3 rounded-md border border-slate-200 p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_0.8fr_0.8fr_1.4fr]">
                  <Field label="Stable key / id">
                    <AdminInput value={item.key} onChange={event => onUpdateSoundItem(item.key, { key: event.target.value, id: event.target.value })} />
                  </Field>
                  <Field label="Label">
                    <AdminInput value={item.label} onChange={event => onUpdateSoundItem(item.key, { label: event.target.value })} />
                  </Field>
                  <Field label="Welsh label">
                    <AdminInput value={item.labelCy ?? ''} onChange={event => onUpdateSoundItem(item.key, { labelCy: event.target.value })} />
                  </Field>
                  <Field label="Generation text / textToSpeak">
                    <AdminInput value={item.textToSpeak} onChange={event => onUpdateSoundItem(item.key, { textToSpeak: event.target.value })} />
                  </Field>
                </div>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_140px]">
                  <Field label="Audio URL">
                    <AdminInput value={item.audioUrl} onChange={event => onUpdateSoundItem(item.key, {
                      audioUrl: event.target.value,
                      audioStatus: event.target.value.trim() ? 'ready' : 'missing',
                      audioSource: event.target.value.trim() ? item.audioSource === 'unknown' ? 'manual' : item.audioSource : 'unknown'
                    })} />
                  </Field>
                  <Field label="Audio status">
                    <AdminSelect value={item.audioStatus} onChange={event => onUpdateSoundItem(item.key, { audioStatus: event.target.value as WordListPrimerSoundItem['audioStatus'] })}>
                      <option value="missing">missing</option>
                      <option value="queued">queued</option>
                      <option value="generating">generating</option>
                      <option value="ready">ready</option>
                      <option value="failed">failed</option>
                    </AdminSelect>
                  </Field>
                  <Field label="Audio source">
                    <AdminSelect value={item.audioSource} onChange={event => onUpdateSoundItem(item.key, { audioSource: event.target.value as WordListPrimerSoundItem['audioSource'] })}>
                      <option value="unknown">unknown</option>
                      <option value="azure">azure</option>
                      <option value="elevenlabs">elevenlabs</option>
                      <option value="manual">manual</option>
                    </AdminSelect>
                  </Field>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <AdminButton onClick={() => {
                      logAudioPlaybackClick('admin-primer-preview', item.audioUrl);
                      void playAudioUrl(item.audioUrl);
                    }} disabled={!canPreview}>
                      <Play size={15} /> Preview
                    </AdminButton>
                    <AdminButton onClick={() => onGenerateAudio(item, 'azure')} disabled={busy}>
                      {busy ? <AdminSpinner /> : <Wand2 size={15} />} Azure
                    </AdminButton>
                    <AdminButton onClick={() => onGenerateAudio(item, 'elevenlabs')} disabled={busy}>
                      {busy ? <AdminSpinner /> : <Wand2 size={15} />} ElevenLabs
                    </AdminButton>
                    <AdminButton onClick={() => onClearAudio(item)} disabled={!item.audioUrl && item.audioStatus === 'missing'}>Clear audio</AdminButton>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AdminButton onClick={() => onMoveSoundItem(item.key, 'up')} disabled={index === 0}>Up</AdminButton>
                    <AdminButton onClick={() => onMoveSoundItem(item.key, 'down')} disabled={index === sortedItems.length - 1}>Down</AdminButton>
                    <AdminButton variant="danger" onClick={() => onRemoveSoundItem(item.key)}><Trash2 size={15} /> Remove</AdminButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function readError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
