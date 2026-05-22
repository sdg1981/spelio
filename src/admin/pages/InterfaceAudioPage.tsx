import { Play, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminButton, AdminCard, AdminInput } from '../components/primitives';
import { StatusPill } from '../components/StatusPill';
import type { AdminRepository } from '../repositories';
import { hasPlayableAudioUrl, playAudioUrl } from '../../lib/audioPlayback';
import { createDefaultInterfaceAudioClips, getPlayableInterfaceAudioUrl, normalizeInterfaceAudioClips, PRACTICE_STRUGGLE_ASSIST_AUDIO_KEY, type InterfaceAudioClip } from '../../lib/interfaceAudio';

export function InterfaceAudioPage({ repository }: { repository: AdminRepository }) {
  const [interfaceAudioClips, setInterfaceAudioClips] = useState<InterfaceAudioClip[]>(() => createDefaultInterfaceAudioClips());
  const [generatingClipId, setGeneratingClipId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    repository.getAudioSettings()
      .then(settings => setInterfaceAudioClips(settings.interfaceAudioClips))
      .catch(error => setErrorMessage(readError(error, 'Could not load helper audio settings.')));
  }, [repository]);

  async function saveInterfaceAudioClips() {
    try {
      setErrorMessage('');
      setStatusMessage('');
      const settings = await repository.getAudioSettings();
      const saved = await repository.saveAudioSettings({
        defaultAudioProvider: settings.defaultAudioProvider,
        interfaceAudioClips
      });
      setInterfaceAudioClips(saved.interfaceAudioClips);
      setStatusMessage('Helper audio settings saved.');
    } catch (error) {
      setErrorMessage(readError(error, 'Could not save helper audio settings.'));
    }
  }

  function updateInterfaceAudioClip(language: InterfaceAudioClip['language'], patch: Partial<InterfaceAudioClip>) {
    setInterfaceAudioClips(current => normalizeInterfaceAudioClips(current).map(clip => (
      clip.key === PRACTICE_STRUGGLE_ASSIST_AUDIO_KEY && clip.language === language
        ? {
            ...clip,
            ...patch,
            audioStatus: patch.audioUrl !== undefined
              ? hasPlayableAudioUrl(patch.audioUrl) ? 'ready' : 'missing'
              : patch.audioStatus ?? clip.audioStatus
          }
        : clip
    )));
  }

  async function generateInterfaceAudioClip(clip: InterfaceAudioClip) {
    const clipId = `${clip.key}:${clip.language}`;
    try {
      setErrorMessage('');
      setStatusMessage('');
      setGeneratingClipId(clipId);
      const generatedClip = await repository.generateInterfaceAudioClip(clip);
      setInterfaceAudioClips(current => normalizeInterfaceAudioClips(current).map(item => (
        item.key === generatedClip.key && item.language === generatedClip.language ? generatedClip : item
      )));
      setStatusMessage(formatGenerationStatus(generatedClip));
    } catch (error) {
      setErrorMessage(readError(error, 'Could not generate helper audio.'));
    } finally {
      setGeneratingClipId(null);
    }
  }

  return (
    <>
      <AdminPageHeader title="Helper Audio" description="Managed interface and coaching audio clips used outside word lists." />
      {(statusMessage || errorMessage) && (
        <div className={`mb-5 rounded-md border px-4 py-3 text-sm font-bold ${errorMessage ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
          {errorMessage || statusMessage}
        </div>
      )}
      <AdminCard className="p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black tracking-[-0.02em]">Interface clips</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">These clips are not word-list audio and do not appear in the word Audio Queue. Missing clips are allowed; learner practice falls back gracefully.</p>
          </div>
          <AdminButton variant="primary" onClick={saveInterfaceAudioClips}>Save helper audio</AdminButton>
        </div>
        <div className="grid gap-4">
          {normalizeInterfaceAudioClips(interfaceAudioClips).map(clip => {
            const clipId = `${clip.key}:${clip.language}`;
            const isGenerating = generatingClipId === clipId;
            return (
              <div key={clipId} className="rounded-md border border-slate-100 p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-900">{clip.key}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-[.12em] text-slate-500">{clip.language === 'cy' ? 'Welsh interface' : 'English interface'}</div>
                  </div>
                  <StatusPill tone={clip.audioStatus === 'ready' ? 'green' : clip.audioStatus === 'failed' ? 'amber' : 'slate'}>{clip.audioStatus}</StatusPill>
                </div>
                <label className="mb-3 grid gap-2">
                  <span className="text-xs font-bold text-slate-700">Script</span>
                  <textarea
                    className="min-h-20 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    value={clip.text}
                    onChange={event => updateInterfaceAudioClip(clip.language, { text: event.target.value, updatedAt: new Date().toISOString() })}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <AdminInput
                    value={clip.audioUrl}
                    onChange={event => updateInterfaceAudioClip(clip.language, { audioUrl: event.target.value, updatedAt: new Date().toISOString() })}
                    placeholder="https://.../practice-struggle-assist.mp3"
                    aria-label={`${clip.language} helper audio URL`}
                  />
                  <AdminButton onClick={() => generateInterfaceAudioClip(clip)} disabled={Boolean(generatingClipId)} aria-disabled={Boolean(generatingClipId)}>
                    <Wand2 size={15} /> {isGenerating ? 'Generating...' : clip.audioStatus === 'ready' ? 'Regenerate' : 'Generate'}
                  </AdminButton>
                  <AdminButton onClick={() => playAudioUrl(getPlayableInterfaceAudioUrl(clip) ?? clip.audioUrl)} disabled={!hasPlayableAudioUrl(clip.audioUrl)} aria-label={`Preview ${clip.language} helper audio`}>
                    <Play size={15} /> Preview
                  </AdminButton>
                </div>
                <div className="mt-2 text-xs leading-5 text-slate-500">
                  Provider: {clip.provider} · Voice: {clip.generationVoice || 'not generated'} · Locale: {clip.generationLocale || 'not generated'} · Updated: {clip.updatedAt || 'not generated'}
                  {clip.storagePath ? <><br />Storage: {clip.storagePath}</> : null}
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>
    </>
  );
}

function readError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatGenerationStatus(clip: InterfaceAudioClip) {
  const language = clip.language === 'cy' ? 'Welsh' : 'English';
  const diagnostics = clip.generationVoice && clip.generationLocale
    ? ` Voice: ${clip.generationVoice} / ${clip.generationLocale}.`
    : '';
  const cacheStatus = clip.cacheBustedUrlChanged === undefined
    ? ''
    : ` Cache-busted URL changed: ${clip.cacheBustedUrlChanged ? 'yes' : 'no'}.`;
  return `${language} helper audio generated.${diagnostics}${cacheStatus}`;
}
