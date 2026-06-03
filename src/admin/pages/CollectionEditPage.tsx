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
  const [generating, setGenerating] = useState(false);
  const [clearingAudio, setClearingAudio] = useState(false);

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
      setStatusMessage('Collection intro saved.');
      return saved;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save collection intro.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function generateAudio() {
    const saved = await saveCollection();
    if (!saved) return;
    setGenerating(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const result = await repository.generateCollectionIntroAudio(saved.id, 'azure');
      const nextCollection = await repository.getCollection(saved.id);
      if (nextCollection) setCollection({ ...nextCollection, introContent: normalizeCollectionIntroContent(nextCollection.introContent, nextCollection.id) });
      setStatusMessage(result.ok ? 'Azure intro audio generated.' : result.error ?? 'Azure intro audio generation failed.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not generate collection intro audio.');
    } finally {
      setGenerating(false);
    }
  }

  async function clearAudio() {
    if (!collection) return;
    setClearingAudio(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      await repository.clearCollectionIntroAudio(collection.id);
      const nextCollection = await repository.getCollection(collection.id);
      if (nextCollection) setCollection({ ...nextCollection, introContent: normalizeCollectionIntroContent(nextCollection.introContent, nextCollection.id) });
      setStatusMessage('Collection intro audio cleared.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not clear collection intro audio.');
    } finally {
      setClearingAudio(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title={collection ? `Edit ${collection.name}` : 'Edit collection'}
        description="Minimal collection editing: only the learner introduction fields are editable for now."
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
              <div className="text-xs font-semibold text-slate-500">Core collection metadata is preserved and remains read-only in this MVP editor.</div>
            </div>
          </AdminCard>

          <AdminCard className="p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">Collection introduction</h2>
                <p className="mt-1 text-sm text-slate-500">Shown once locally before the first normal Foundations practice flow.</p>
              </div>
              <AudioStatusPill status={intro.audioStatus} />
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

              <div className="grid gap-4 md:grid-cols-[1fr_180px_180px]">
                <Field label="Intro audio URL">
                  <AdminInput value={intro.audioUrl} onChange={event => updateIntro({ audioUrl: event.target.value, audioStatus: event.target.value.trim() ? 'ready' : 'missing', audioSource: event.target.value.trim() ? intro.audioSource : 'unknown' })} />
                </Field>
                <Field label="Audio status">
                  <AdminSelect value={intro.audioStatus} onChange={event => updateIntro({ audioStatus: event.target.value as typeof intro.audioStatus })}>
                    {['missing', 'queued', 'generating', 'ready', 'failed'].map(status => <option key={status} value={status}>{status}</option>)}
                  </AdminSelect>
                </Field>
                <Field label="Audio source">
                  <AdminSelect value={intro.audioSource} onChange={event => updateIntro({ audioSource: event.target.value as typeof intro.audioSource })}>
                    {['unknown', 'manual', 'azure', 'elevenlabs'].map(source => <option key={source} value={source}>{source}</option>)}
                  </AdminSelect>
                </Field>
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
                <AdminButton variant="primary" onClick={saveCollection} disabled={saving || generating || clearingAudio}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save intro'}
                </AdminButton>
                <AdminButton onClick={generateAudio} disabled={saving || generating || clearingAudio || !intro.bodyEn.trim()}>
                  <Wand2 size={16} /> {generating ? 'Generating...' : 'Generate Azure audio'}
                </AdminButton>
                <AdminButton variant="danger" onClick={clearAudio} disabled={saving || generating || clearingAudio || (!intro.audioUrl && intro.audioStatus === 'missing')}>
                  <Trash2 size={16} /> {clearingAudio ? 'Clearing...' : 'Clear audio'}
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
