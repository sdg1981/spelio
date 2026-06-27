import { ArrowDown, ArrowLeft, ArrowUp, ListOrdered, Route, Save, ShieldCheck, Trash2, Wand2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminButton, AdminCard, AdminInput, AdminSelect, AdminTextarea, Field } from '../components/primitives';
import { AudioStatusPill } from '../components/audioStatus';
import type { AdminRepository } from '../repositories';
import type { AdminWordList, AdminWordListCollection } from '../types';
import { normalizeCollectionIntroContent, toCollectionIntroStorage } from '../../content/collectionIntro';
import { applyCollectionCatalogueOrder, applyCollectionProgressionOrder, deriveInitialProgressionListIds, moveItem, sortCollectionWordLists } from '../services/collectionOrdering';
import { ADMIN_CONTENT_DELETE_FLAG, getDeleteConfirmationPhrase, isAdminContentDeleteAllowed, isDeleteConfirmationValid } from '../services/contentDeleteSafety';

export function CollectionEditPage({ id, navigate, repository }: { id: string; navigate: (path: string) => void; repository: AdminRepository }) {
  const [collection, setCollection] = useState<AdminWordListCollection | null>(null);
  const [wordLists, setWordLists] = useState<AdminWordList[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [orderingSaving, setOrderingSaving] = useState(false);
  const [orderingPanel, setOrderingPanel] = useState<'catalogue' | 'progression' | null>(null);
  const [catalogueOrderIds, setCatalogueOrderIds] = useState<string[]>([]);
  const [progressionIncludedIds, setProgressionIncludedIds] = useState<string[]>([]);
  const [clearContentModalOpen, setClearContentModalOpen] = useState(false);
  const [clearConfirmationText, setClearConfirmationText] = useState('');
  const [clearingContent, setClearingContent] = useState(false);
  const [generatingLanguage, setGeneratingLanguage] = useState<'en' | 'cy' | null>(null);
  const [clearingAudioLanguage, setClearingAudioLanguage] = useState<'en' | 'cy' | null>(null);
  const deleteAllowed = isAdminContentDeleteAllowed(import.meta.env.VITE_ALLOW_ADMIN_CONTENT_DELETE);

  useEffect(() => {
    Promise.all([repository.getCollection(id), repository.listWordLists()])
      .then(([nextCollection, nextWordLists]) => {
        if (!nextCollection) {
          setErrorMessage('Collection not found.');
          return;
        }
        setCollection({
          ...nextCollection,
          introContent: normalizeCollectionIntroContent(nextCollection.introContent, nextCollection.id)
        });
        setWordLists(nextWordLists);
      })
      .catch(error => setErrorMessage(error instanceof Error ? error.message : 'Could not load collection.'));
  }, [id, repository]);

  const intro = useMemo(() => normalizeCollectionIntroContent(collection?.introContent, collection?.id ?? id), [collection, id]);
  const collectionWordLists = useMemo(() => sortCollectionWordLists(wordLists, id), [wordLists, id]);
  const wordListById = useMemo(() => new Map(wordLists.map(list => [list.id, list])), [wordLists]);
  const catalogueOrderLists = useMemo(
    () => catalogueOrderIds.map(listId => wordListById.get(listId)).filter((list): list is AdminWordList => Boolean(list)),
    [catalogueOrderIds, wordListById]
  );
  const progressionIncludedLists = useMemo(
    () => progressionIncludedIds.map(listId => wordListById.get(listId)).filter((list): list is AdminWordList => Boolean(list)),
    [progressionIncludedIds, wordListById]
  );
  const progressionExcludedLists = useMemo(
    () => collectionWordLists.filter(list => !progressionIncludedIds.includes(list.id)),
    [collectionWordLists, progressionIncludedIds]
  );
  const crossCollectionNextLinks = useMemo(
    () => collectionWordLists.filter(list => {
      const next = list.nextListId ? wordListById.get(list.nextListId) : undefined;
      return next && next.collectionId !== id;
    }),
    [collectionWordLists, id, wordListById]
  );
  const collectionContentCounts = useMemo(
    () => ({
      lists: collectionWordLists.length,
      words: collectionWordLists.reduce((total, list) => total + list.words.length, 0)
    }),
    [collectionWordLists]
  );
  const canConfirmClearContent = collection ? isDeleteConfirmationValid(clearConfirmationText, collection.id) : false;

  function updateCollection(patch: Partial<AdminWordListCollection>) {
    setCollection(previous => previous ? ({ ...previous, ...patch }) : previous);
  }

  function updateIntro(patch: Partial<typeof intro>) {
    setCollection(previous => previous ? ({
      ...previous,
      introContent: {
        ...intro,
        ...patch
      }
    }) : previous);
  }

  async function saveCollection() {
    if (!collection) return null;
    setSaving(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const saved = await repository.saveCollection({
        ...collection,
        introContent: toCollectionIntroStorage(intro, collection.id)
      });
      setCollection({ ...saved, introContent: normalizeCollectionIntroContent(saved.introContent, saved.id) });
      setStatusMessage('Collection saved.');
      return saved;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save collection.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || Boolean(generatingLanguage) || Boolean(clearingAudioLanguage);
  const anyBusy = busy || orderingSaving || clearingContent;

  async function refreshWordLists() {
    const nextWordLists = await repository.listWordLists();
    setWordLists(nextWordLists);
    return nextWordLists;
  }

  function openCatalogueOrdering() {
    setCatalogueOrderIds(collectionWordLists.map(list => list.id));
    setOrderingPanel('catalogue');
  }

  function openProgressionOrdering() {
    const existingProgressionIds = deriveInitialProgressionListIds(collectionWordLists, wordLists);
    const defaultIncludedIds = collectionWordLists.filter(list => list.isActive).map(list => list.id);
    setProgressionIncludedIds(existingProgressionIds.length ? existingProgressionIds : defaultIncludedIds);
    setOrderingPanel('progression');
  }

  function closeOrderingPanel() {
    if (orderingSaving) return;
    setOrderingPanel(null);
  }

  function moveCatalogueList(index: number, direction: 'up' | 'down') {
    setCatalogueOrderIds(current => moveItem(current, index, direction));
  }

  function moveProgressionList(index: number, direction: 'up' | 'down') {
    setProgressionIncludedIds(current => moveItem(current, index, direction));
  }

  function includeProgressionList(listId: string) {
    setProgressionIncludedIds(current => current.includes(listId) ? current : [...current, listId]);
  }

  function excludeProgressionList(listId: string) {
    setProgressionIncludedIds(current => current.filter(id => id !== listId));
  }

  async function saveCatalogueOrder() {
    setOrderingSaving(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const updatedLists = applyCollectionCatalogueOrder(wordLists, catalogueOrderIds);
      const changedLists = updatedLists.filter(updated => {
        const original = wordListById.get(updated.id);
        return original && original.order !== updated.order;
      });
      await Promise.all(changedLists.map(list => repository.saveWordList(list)));
      await refreshWordLists();
      setStatusMessage('Word list order saved.');
      setOrderingPanel(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save word list order.');
    } finally {
      setOrderingSaving(false);
    }
  }

  async function saveProgressionOrder() {
    setOrderingSaving(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const updatedLists = applyCollectionProgressionOrder(wordLists, id, progressionIncludedIds);
      const changedLists = updatedLists.filter(updated => {
        const original = wordListById.get(updated.id);
        return original && original.nextListId !== updated.nextListId;
      });
      await Promise.all(changedLists.map(list => repository.saveWordList(list)));
      await refreshWordLists();
      setStatusMessage('Progression order saved.');
      setOrderingPanel(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save progression order.');
    } finally {
      setOrderingSaving(false);
    }
  }

  function openClearContentModal() {
    setClearConfirmationText('');
    setStatusMessage('');
    setErrorMessage('');
    setClearContentModalOpen(true);
  }

  async function clearCollectionContent() {
    if (!collection || !canConfirmClearContent) return;
    setClearingContent(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const result = await repository.clearCollectionContent(collection.id);
      await refreshWordLists();
      setStatusMessage(`Cleared ${result.listsDeleted} list(s) and ${result.wordsDeleted} word(s) from ${collection.name}.`);
      setClearContentModalOpen(false);
      setClearConfirmationText('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not clear collection content.');
    } finally {
      setClearingContent(false);
    }
  }

  function audioFields(language: 'en' | 'cy') {
    return language === 'cy'
      ? {
          label: 'Welsh intro audio',
          url: intro.audioUrlCy,
          status: intro.audioStatusCy,
          source: intro.audioSourceCy,
          canGenerate: Boolean(intro.bodyCy.trim()),
          missingCopy: 'Add Welsh intro body text before generating Welsh audio.'
        }
      : {
          label: 'English intro audio',
          url: intro.audioUrlEn,
          status: intro.audioStatusEn,
          source: intro.audioSourceEn,
          canGenerate: Boolean(intro.bodyEn.trim()),
          missingCopy: 'Add English intro body text before generating English audio.'
        };
  }

  function updateAudio(language: 'en' | 'cy', patch: { url?: string; status?: typeof intro.audioStatusEn; source?: typeof intro.audioSourceEn }) {
    updateIntro(language === 'cy'
      ? {
          audioUrlCy: patch.url ?? intro.audioUrlCy,
          audioStatusCy: patch.status ?? intro.audioStatusCy,
          audioSourceCy: patch.source ?? intro.audioSourceCy
        }
      : {
          audioUrlEn: patch.url ?? intro.audioUrlEn,
          audioStatusEn: patch.status ?? intro.audioStatusEn,
          audioSourceEn: patch.source ?? intro.audioSourceEn
        });
  }

  async function generateAudio(language: 'en' | 'cy') {
    const saved = await saveCollection();
    if (!saved) return;
    setGeneratingLanguage(language);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const result = await repository.generateCollectionIntroAudio(saved.id, language, 'azure');
      const nextCollection = await repository.getCollection(saved.id);
      if (nextCollection) setCollection({ ...nextCollection, introContent: normalizeCollectionIntroContent(nextCollection.introContent, nextCollection.id) });
      if (result.ok) {
        setStatusMessage(`${language === 'cy' ? 'Welsh' : 'English'} Azure intro audio generated.`);
      } else {
        const message = result.error ?? 'Azure intro audio generation failed.';
        console.error('Collection intro Azure audio generation failed', { collectionId: saved.id, language, message });
        setErrorMessage(message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not generate collection intro audio.';
      console.error('Collection intro Azure audio generation failed', { collectionId: saved.id, language, error });
      setErrorMessage(message);
    } finally {
      setGeneratingLanguage(null);
    }
  }

  async function clearAudio(language: 'en' | 'cy') {
    if (!collection) return;
    setClearingAudioLanguage(language);
    setErrorMessage('');
    setStatusMessage('');
    try {
      await repository.clearCollectionIntroAudio(collection.id, language);
      const nextCollection = await repository.getCollection(collection.id);
      if (nextCollection) setCollection({ ...nextCollection, introContent: normalizeCollectionIntroContent(nextCollection.introContent, nextCollection.id) });
      setStatusMessage(`${language === 'cy' ? 'Welsh' : 'English'} collection intro audio cleared.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not clear collection intro audio.');
    } finally {
      setClearingAudioLanguage(null);
    }
  }

  return (
    <>
      <AdminPageHeader
        title={collection ? `Edit ${collection.name}` : 'Edit collection'}
        description="Manage collection ordering and learner introduction content."
        actions={<AdminButton onClick={() => navigate('/admin/collections')}><ArrowLeft size={16} /> Back to collections</AdminButton>}
      />

      {(statusMessage || errorMessage) && (
        <div className={`mb-5 rounded-md border px-4 py-3 text-sm font-bold ${errorMessage ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
          {errorMessage || statusMessage}
        </div>
      )}

      {collection && (
        <div className="grid gap-5">
          <AdminCard className="p-5">
            <div className="grid gap-2 text-sm">
              <div className="font-mono text-xs text-slate-500">{collection.id}</div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-lg font-black text-slate-950">{collection.name}</div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${collection.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  <ShieldCheck size={14} />
                  {collection.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-slate-600">{collection.description}</div>
              <div className="grid gap-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
                <Field label="Order" helper="Controls public collection order. Lower numbers appear first.">
                  <AdminInput type="number" min={0} value={collection.order} onChange={event => updateCollection({ order: Number(event.target.value) })} />
                </Field>
                <Field label="Public visibility" helper="Inactive collections and their word lists stay out of the public catalogue.">
                  <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                      checked={collection.isActive}
                      onChange={event => updateCollection({ isActive: event.target.checked })}
                    />
                    Active collection
                  </label>
                </Field>
              </div>
              <div className="text-xs font-semibold text-slate-500">Core collection metadata is preserved and remains read-only in this MVP editor.</div>
              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                <AdminButton onClick={openCatalogueOrdering} disabled={anyBusy || !collectionWordLists.length}>
                  <ListOrdered size={16} /> Arrange word list order
                </AdminButton>
                <AdminButton onClick={openProgressionOrdering} disabled={anyBusy || !collectionWordLists.length}>
                  <Route size={16} /> Arrange progression order
                </AdminButton>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">Collection introduction</h2>
                <p className="mt-1 text-sm text-slate-500">Shown once locally before the first normal Foundations practice flow.</p>
              </div>
            </div>

            <div className="grid gap-5">
              <label className="flex items-center gap-3 text-sm font-bold text-slate-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={intro.enabled}
                  onChange={event => updateIntro({ enabled: event.target.checked })}
                />
                Enable collection introduction
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="English intro title">
                  <AdminInput value={intro.titleEn} onChange={event => updateIntro({ titleEn: event.target.value })} />
                </Field>
                <Field label="Welsh intro title" helper="Leave empty until reviewed Welsh copy is available.">
                  <AdminInput value={intro.titleCy} onChange={event => updateIntro({ titleCy: event.target.value })} />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="English intro body">
                  <AdminTextarea className="min-h-56" value={intro.bodyEn} onChange={event => updateIntro({ bodyEn: event.target.value })} />
                </Field>
                <Field label="Welsh intro body" helper="Leave empty until reviewed Welsh copy is available.">
                  <AdminTextarea className="min-h-56" value={intro.bodyCy} onChange={event => updateIntro({ bodyCy: event.target.value })} />
                </Field>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {(['en', 'cy'] as const).map(language => {
                  const fields = audioFields(language);
                  const isGenerating = generatingLanguage === language;
                  const isClearing = clearingAudioLanguage === language;
                  return (
                    <div key={language} className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-950">{fields.label}</h3>
                          <p className="mt-1 text-xs text-slate-500">Uses Azure {language === 'cy' ? 'Welsh' : 'English'} voice settings.</p>
                        </div>
                        <AudioStatusPill status={fields.status} />
                      </div>
                      <Field label={`${language === 'cy' ? 'Welsh' : 'English'} audio URL`}>
                        <AdminInput
                          value={fields.url}
                          onChange={event => updateAudio(language, {
                            url: event.target.value,
                            status: event.target.value.trim() ? 'ready' : 'missing',
                            source: event.target.value.trim() ? fields.source : 'unknown'
                          })}
                        />
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Audio status">
                          <AdminSelect value={fields.status} onChange={event => updateAudio(language, { status: event.target.value as typeof intro.audioStatusEn })}>
                            {['missing', 'queued', 'generating', 'ready', 'failed'].map(status => <option key={status} value={status}>{status}</option>)}
                          </AdminSelect>
                        </Field>
                        <Field label="Audio source">
                          <AdminSelect value={fields.source} onChange={event => updateAudio(language, { source: event.target.value as typeof intro.audioSourceEn })}>
                            {['unknown', 'manual', 'azure', 'elevenlabs'].map(source => <option key={source} value={source}>{source}</option>)}
                          </AdminSelect>
                        </Field>
                      </div>
                      {fields.url.trim() && (
                        <audio className="w-full" controls src={fields.url} />
                      )}
                      {!fields.canGenerate && (
                        <p className="text-xs font-semibold text-amber-700">{fields.missingCopy}</p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        <AdminButton onClick={() => generateAudio(language)} disabled={busy || !fields.canGenerate}>
                          <Wand2 size={16} /> {isGenerating ? 'Generating...' : `Generate ${language === 'cy' ? 'Welsh' : 'English'} Azure audio`}
                        </AdminButton>
                        <AdminButton variant="danger" onClick={() => clearAudio(language)} disabled={busy || (!fields.url && fields.status === 'missing')}>
                          <Trash2 size={16} /> {isClearing ? 'Clearing...' : 'Clear audio'}
                        </AdminButton>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Intro version" helper="Changing this creates a fresh local seen key for learners.">
                  <AdminInput value={intro.version} onChange={event => updateIntro({ version: event.target.value })} />
                </Field>
                <Field label="Seen key" helper="Optional override. Usually leave as generated.">
                  <AdminInput value={intro.seenKey} onChange={event => updateIntro({ seenKey: event.target.value })} />
                </Field>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                <AdminButton variant="primary" onClick={saveCollection} disabled={anyBusy}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save collection'}
                </AdminButton>
              </div>
              <p className="text-xs leading-5 text-slate-500">ElevenLabs generation is not exposed here yet; the current reusable ElevenLabs path is tuned for Welsh word and primer audio, not English collection introductions.</p>
            </div>
          </AdminCard>

          <AdminCard className="border-red-100 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-red-700">Danger zone</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  Clear all word lists and words inside this collection while keeping the collection itself. Use this only for intentional content cleanup.
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Current content: {collectionContentCounts.lists} list(s), {collectionContentCounts.words} word(s).
                </p>
                {!deleteAllowed && (
                  <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                    Destructive content deletion is unavailable. Set {ADMIN_CONTENT_DELETE_FLAG}=true only for an intentional admin cleanup.
                  </p>
                )}
              </div>
              <AdminButton
                variant="danger"
                disabled={!deleteAllowed || anyBusy || collectionContentCounts.lists === 0}
                onClick={openClearContentModal}
              >
                <Trash2 size={16} /> Clear content
              </AdminButton>
            </div>
          </AdminCard>
        </div>
      )}

      {collection && clearContentModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-lg border border-red-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-black text-slate-950">Clear collection content</h2>
                <p className="mt-1 text-sm text-slate-600">This will delete word lists and words, but preserve the collection row.</p>
              </div>
              <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" type="button" onClick={() => setClearContentModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 p-5 text-sm">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="font-bold text-slate-950">{collection.name}</div>
                <div className="mt-1 font-mono text-xs text-slate-600">{collection.id}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-slate-200 p-3"><b>{collectionContentCounts.lists}</b><span className="ml-1 text-slate-600">list(s) deleted</span></div>
                <div className="rounded-md border border-slate-200 p-3"><b>{collectionContentCounts.words}</b><span className="ml-1 text-slate-600">word(s) deleted</span></div>
              </div>
              <div className="rounded-md border border-red-100 bg-red-50 p-4 font-bold text-red-700">This cannot be undone.</div>
              <label className="grid gap-2">
                <span className="text-xs font-bold text-slate-700">Type {getDeleteConfirmationPhrase(collection.id)} to confirm</span>
                <AdminInput value={clearConfirmationText} onChange={event => setClearConfirmationText(event.target.value)} autoFocus />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <AdminButton onClick={() => setClearContentModalOpen(false)}>Cancel</AdminButton>
              <AdminButton variant="danger" disabled={!canConfirmClearContent || clearingContent} onClick={clearCollectionContent}>
                <Trash2 size={16} /> {clearingContent ? 'Deleting...' : 'Delete lists & words'}
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {orderingPanel && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 py-8">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  {orderingPanel === 'catalogue' ? 'Arrange word list order' : 'Arrange progression order'}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {orderingPanel === 'catalogue'
                    ? 'Controls how lists appear when browsing this collection. Progression can be arranged separately.'
                    : 'Controls the recommended path after a list is completed. Lists not included remain browsable but are skipped by curated progression.'}
                </p>
              </div>
              <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" type="button" onClick={closeOrderingPanel} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {orderingPanel === 'catalogue' ? (
              <div className="grid gap-3 p-5">
                {catalogueOrderLists.map((list, index) => (
                  <OrderingListRow
                    key={list.id}
                    list={list}
                    index={index}
                    total={catalogueOrderLists.length}
                    onMove={direction => moveCatalogueList(index, direction)}
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-5 p-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Included in progression</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Saving writes each list&apos;s next list link in this order. The final list keeps an existing cross-collection next link; otherwise it is set to none.</p>
                  {crossCollectionNextLinks.length > 0 && (
                    <p className="mt-2 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
                      Existing cross-collection next-list links: {crossCollectionNextLinks.map(list => `${list.name} -> ${wordListById.get(list.nextListId ?? '')?.name ?? list.nextListId}`).join(', ')}. Keep one as the final included list to preserve it.
                    </p>
                  )}
                  <div className="mt-3 grid gap-3">
                    {progressionIncludedLists.length ? progressionIncludedLists.map((list, index) => (
                      <OrderingListRow
                        key={list.id}
                        list={list}
                        index={index}
                        total={progressionIncludedLists.length}
                        nextLabel={progressionIncludedLists[index + 1]?.name ?? getTerminalNextLabel(list, wordListById, id)}
                        onMove={direction => moveProgressionList(index, direction)}
                        action={<AdminButton variant="ghost" onClick={() => excludeProgressionList(list.id)}>Exclude</AdminButton>}
                      />
                    )) : (
                      <div className="rounded-md border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500">No lists are included in the curated progression path.</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-900">Not in progression</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">These lists remain browsable. Saving clears same-collection next-list links from excluded lists; cross-collection links are preserved.</p>
                  <div className="mt-3 grid gap-3">
                    {progressionExcludedLists.length ? progressionExcludedLists.map(list => (
                      <OrderingListRow
                        key={list.id}
                        list={list}
                        action={<AdminButton onClick={() => includeProgressionList(list.id)}>Include</AdminButton>}
                      />
                    )) : (
                      <div className="rounded-md border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500">All collection lists are included in progression.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 p-5">
              <AdminButton onClick={closeOrderingPanel} disabled={orderingSaving}>Cancel</AdminButton>
              <AdminButton
                variant="primary"
                onClick={orderingPanel === 'catalogue' ? saveCatalogueOrder : saveProgressionOrder}
                disabled={orderingSaving}
              >
                <Save size={16} /> {orderingSaving ? 'Saving...' : 'Save order'}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function OrderingListRow({
  list,
  index,
  total,
  nextLabel,
  action,
  onMove
}: {
  list: AdminWordList;
  index?: number;
  total?: number;
  nextLabel?: string;
  action?: ReactNode;
  onMove?: (direction: 'up' | 'down') => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {typeof index === 'number' && <span className="text-xs font-black text-slate-400">{index + 1}</span>}
          <span className="truncate text-sm font-black text-slate-950">{list.name}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${list.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {list.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="mt-1 text-xs font-semibold text-slate-500">
          Order {list.order}{nextLabel ? ` · Next: ${nextLabel}` : list.nextListId ? ` · Current next: ${list.nextListId}` : ''}
        </div>
      </div>
      {onMove && typeof index === 'number' && typeof total === 'number' && (
        <div className="flex gap-2">
          <AdminButton className="min-h-9 px-3" onClick={() => onMove('up')} disabled={index === 0} aria-label={`Move ${list.name} up`}>
            <ArrowUp size={15} />
          </AdminButton>
          <AdminButton className="min-h-9 px-3" onClick={() => onMove('down')} disabled={index === total - 1} aria-label={`Move ${list.name} down`}>
            <ArrowDown size={15} />
          </AdminButton>
        </div>
      )}
      {action}
    </div>
  );
}

function getTerminalNextLabel(list: AdminWordList, wordListById: Map<string, AdminWordList>, collectionId: string) {
  if (!list.nextListId) return 'None';
  const next = wordListById.get(list.nextListId);
  if (!next) return `Missing list ${list.nextListId}`;
  return next.collectionId === collectionId ? 'None' : `${next.name} (outside this collection)`;
}
