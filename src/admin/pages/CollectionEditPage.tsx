import { ArrowLeft, Save, Trash2, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminButton, AdminCard, AdminInput, AdminSelect, AdminTextarea, Field } from '../components/primitives';
import { AudioStatusPill } from '../components/audioStatus';
import type { AdminRepository } from '../repositories';
import type { AdminWordListCollection } from '../types';
import { normalizeCollectionIntroContent, toCollectionIntroStorage } from '../../content/collectionIntro';

export function CollectionEditPage({ id, navigate, repository }: { id: string; navigate: (path: string) => void; repository: AdminRepository }) {
  const [collection, setCollection] = useState<AdminWordListCollection | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [generatingLanguage, setGeneratingLanguage] = useState<'en' | 'cy' | null>(null);
  const [clearingAudioLanguage, setClearingAudioLanguage] = useState<'en' | 'cy' | null>(null);

  useEffect(() => {
    repository.getCollection(id)
      .then(nextCollection => {
        if (!nextCollection) {
          setErrorMessage('Collection not found.');
          return;
        }
        setCollection({
          ...nextCollection,
          introContent: normalizeCollectionIntroContent(nextCollection.introContent, nextCollection.id)
        });
      })
      .catch(error => setErrorMessage(error instanceof Error ? error.message : 'Could not load collection.'));
  }, [id, repository]);

  const intro = useMemo(() => normalizeCollectionIntroContent(collection?.introContent, collection?.id ?? id), [collection, id]);

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
              <div className="text-lg font-black text-slate-950">{collection.name}</div>
              <div className="text-slate-600">{collection.description}</div>
              <div className="max-w-xs">
                <Field label="Order" helper="Controls public collection order. Lower numbers appear first.">
                  <AdminInput type="number" min={0} value={collection.order} onChange={event => updateCollection({ order: Number(event.target.value) })} />
                </Field>
              </div>
              <div className="text-xs font-semibold text-slate-500">Core collection metadata is preserved and remains read-only in this MVP editor.</div>
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
                <AdminButton variant="primary" onClick={saveCollection} disabled={busy}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save collection'}
                </AdminButton>
              </div>
              <p className="text-xs leading-5 text-slate-500">ElevenLabs generation is not exposed here yet; the current reusable ElevenLabs path is tuned for Welsh word and primer audio, not English collection introductions.</p>
            </div>
          </AdminCard>
        </div>
      )}
    </>
  );
}
