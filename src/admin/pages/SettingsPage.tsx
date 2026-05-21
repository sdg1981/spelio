import { Download, Play, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminButton, AdminCard, AdminInput, AdminSelect, Field } from '../components/primitives';
import { StatusPill } from '../components/StatusPill';
import type { AdminRepository } from '../repositories';
import type { DefaultAudioProvider } from '../types';
import { hasPlayableAudioUrl, playAudioUrl } from '../../lib/audioPlayback';
import { createDefaultInterfaceAudioClips, normalizeInterfaceAudioClips, PRACTICE_STRUGGLE_ASSIST_AUDIO_KEY, type InterfaceAudioClip } from '../../lib/interfaceAudio';

export function SettingsPage({ repository }: { repository: AdminRepository }) {
  const [defaultAudioProvider, setDefaultAudioProvider] = useState<DefaultAudioProvider>('azure');
  const [interfaceAudioClips, setInterfaceAudioClips] = useState<InterfaceAudioClip[]>(() => createDefaultInterfaceAudioClips());
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    repository.getAudioSettings()
      .then(settings => {
        setDefaultAudioProvider(settings.defaultAudioProvider);
        setInterfaceAudioClips(settings.interfaceAudioClips);
      })
      .catch(error => setErrorMessage(readError(error, 'Could not load audio settings.')));
  }, [repository]);

  async function changeDefaultAudioProvider(provider: DefaultAudioProvider) {
    try {
      setErrorMessage('');
      setStatusMessage('');
      const saved = await repository.saveAudioSettings({ defaultAudioProvider: provider, interfaceAudioClips });
      setDefaultAudioProvider(saved.defaultAudioProvider);
      setInterfaceAudioClips(saved.interfaceAudioClips);
      setStatusMessage('Audio setting saved.');
    } catch (error) {
      setErrorMessage(readError(error, 'Could not save audio setting.'));
    }
  }

  async function saveInterfaceAudioClips() {
    try {
      setErrorMessage('');
      setStatusMessage('');
      const saved = await repository.saveAudioSettings({ defaultAudioProvider, interfaceAudioClips });
      setDefaultAudioProvider(saved.defaultAudioProvider);
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

  return (
    <>
      <AdminPageHeader title="Settings" description="Founder settings and integration readiness. No backend secrets are stored in the frontend." />
      {(statusMessage || errorMessage) && (
        <div className={`mb-5 rounded-md border px-4 py-3 text-sm font-bold ${errorMessage ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
          {errorMessage || statusMessage}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard className="p-5">
          <h2 className="mb-5 text-lg font-black tracking-[-0.02em]">Services</h2>
          <SettingRow label="Azure Voice status" status="Not connected" tone="slate" />
          <SettingRow label="ElevenLabs status" status="Experimental" tone="amber" />
          <SettingRow label="Storage status" status="Mock only" tone="amber" />
          <SettingRow label="Analytics status" status="Disabled" tone="slate" />
          <SettingRow label="Admin analytics excluded" status="Enabled" tone="green" />
        </AdminCard>
        <AdminCard className="p-5">
          <h2 className="mb-5 text-lg font-black tracking-[-0.02em]">Audio playback</h2>
          <Field label="Default audio provider" helper="Learner playback uses ElevenLabs only when transformed audio exists, then falls back to Azure.">
            <AdminSelect value={defaultAudioProvider} onChange={event => changeDefaultAudioProvider(event.target.value as DefaultAudioProvider)}>
              <option value="azure">Azure</option>
              <option value="elevenlabs">ElevenLabs</option>
            </AdminSelect>
          </Field>
        </AdminCard>
        <AdminCard className="p-5">
          <h2 className="mb-2 text-lg font-black tracking-[-0.02em]">Helper audio</h2>
          <p className="mb-5 text-sm leading-6 text-slate-500">Managed interface clips for quiet learner support. Missing clips are allowed; practice falls back to word replay and the subtle shortcut hint.</p>
          <div className="grid gap-4">
            {normalizeInterfaceAudioClips(interfaceAudioClips).map(clip => (
              <div key={`${clip.key}-${clip.language}`} className="rounded-md border border-slate-100 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-900">{clip.language === 'cy' ? 'Welsh' : 'English'} struggle assist</div>
                    <div className="text-xs leading-5 text-slate-500">{clip.text}</div>
                  </div>
                  <StatusPill tone={clip.audioStatus === 'ready' ? 'green' : clip.audioStatus === 'failed' ? 'amber' : 'slate'}>{clip.audioStatus}</StatusPill>
                </div>
                <div className="flex gap-2">
                  <AdminInput
                    value={clip.audioUrl}
                    onChange={event => updateInterfaceAudioClip(clip.language, { audioUrl: event.target.value, updatedAt: new Date().toISOString() })}
                    placeholder="https://.../practice-struggle-assist.mp3"
                    aria-label={`${clip.language} helper audio URL`}
                  />
                  <AdminButton onClick={() => playAudioUrl(clip.audioUrl)} disabled={!hasPlayableAudioUrl(clip.audioUrl)} aria-label={`Preview ${clip.language} helper audio`}>
                    <Play size={15} /> Preview
                  </AdminButton>
                </div>
              </div>
            ))}
            <div>
              <AdminButton variant="primary" onClick={saveInterfaceAudioClips}>Save helper audio</AdminButton>
            </div>
          </div>
        </AdminCard>
        <AdminCard className="p-5">
          <h2 className="mb-5 text-lg font-black tracking-[-0.02em]">Export and import</h2>
          <p className="mb-5 text-sm leading-6 text-slate-500">Placeholders for content export, JSON import history, and future storage-backed publishing.</p>
          <div className="flex flex-wrap gap-3">
            <AdminButton><Download size={16} /> Export JSON</AdminButton>
            <AdminButton><Upload size={16} /> Import history</AdminButton>
          </div>
        </AdminCard>
      </div>
    </>
  );
}

function readError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function SettingRow({ label, status, tone }: { label: string; status: string; tone: 'green' | 'amber' | 'slate' }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-4 last:border-0">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <StatusPill tone={tone}>{status}</StatusPill>
    </div>
  );
}
