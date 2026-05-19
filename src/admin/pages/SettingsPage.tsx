import { Download, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminButton, AdminCard, AdminSelect, Field } from '../components/primitives';
import { StatusPill } from '../components/StatusPill';
import type { AdminRepository } from '../repositories';
import type { DefaultAudioProvider } from '../types';

export function SettingsPage({ repository }: { repository: AdminRepository }) {
  const [defaultAudioProvider, setDefaultAudioProvider] = useState<DefaultAudioProvider>('azure');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    repository.getAudioSettings()
      .then(settings => setDefaultAudioProvider(settings.defaultAudioProvider))
      .catch(error => setErrorMessage(readError(error, 'Could not load audio settings.')));
  }, [repository]);

  async function changeDefaultAudioProvider(provider: DefaultAudioProvider) {
    try {
      setErrorMessage('');
      setStatusMessage('');
      const saved = await repository.saveAudioSettings({ defaultAudioProvider: provider });
      setDefaultAudioProvider(saved.defaultAudioProvider);
      setStatusMessage('Audio setting saved.');
    } catch (error) {
      setErrorMessage(readError(error, 'Could not save audio setting.'));
    }
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
