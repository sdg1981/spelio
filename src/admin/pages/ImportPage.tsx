import { AlertTriangle, CheckCircle2, FileJson } from 'lucide-react';
import { useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { ImportDropzone } from '../components/ImportDropzone';
import { AdminButton, AdminCard, AdminTextarea } from '../components/primitives';
import { StatusPill } from '../components/StatusPill';
import type { AdminRepository } from '../repositories';
import type { ImportValidationResult } from '../types';

const sampleJson = `{
  "lists": [
    {
      "id": "foundations_new_daily_words",
      "name": "Daily Words",
      "language": "cy",
      "dialect": "Mixed",
      "stage": "Foundations",
      "words": []
    }
  ]
}`;

const initialStats: ImportValidationResult = {
  newLists: 0,
  updatedLists: 0,
  totalWords: 0,
  duplicates: 0,
  missingAudio: 0,
  warnings: []
};

export function ImportPage({ repository }: { repository: AdminRepository }) {
  const [json, setJson] = useState(sampleJson);
  const [validated, setValidated] = useState(true);
  const [stats, setStats] = useState<ImportValidationResult>(initialStats);
  const [errorMessage, setErrorMessage] = useState('');

  async function validate() {
    // TODO: Call a protected server/API route for production import validation and import writes.
    try {
      setErrorMessage('');
      setStats(await repository.validateImport(json));
      setValidated(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Validation failed.');
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Import"
        description="Validate AI-generated or edited Spelio word-list JSON before it becomes content. This is a visual mock; nothing is persisted yet."
        actions={<AdminButton variant="primary" onClick={validate}>Validate</AdminButton>}
      />
      {errorMessage && <div className="mb-5 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{errorMessage}</div>}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-6">
          <ImportDropzone onMockUpload={validate} />
          <AdminCard className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <FileJson size={20} className="text-slate-700" />
              <h2 className="text-lg font-black tracking-[-0.02em]">Paste JSON</h2>
            </div>
            <AdminTextarea className="min-h-[320px] font-mono text-xs leading-5" value={json} onChange={event => setJson(event.target.value)} />
            <div className="mt-4 flex justify-end">
              <AdminButton variant="primary" onClick={validate}>Validate</AdminButton>
            </div>
          </AdminCard>
        </div>
        <div className="grid gap-6 self-start">
          <AdminCard className="p-5">
            <h2 className="text-lg font-black tracking-[-0.02em]">Validation preview</h2>
            {validated && (
              <div className="mt-5 grid gap-3">
                <PreviewRow label="New lists" value={stats.newLists} />
                <PreviewRow label="Updated lists" value={stats.updatedLists} />
                <PreviewRow label="Total words" value={stats.totalWords} />
                <PreviewRow label="Duplicates" value={stats.duplicates} tone="amber" />
                <PreviewRow label="Missing audio" value={stats.missingAudio} tone="red" />
                <PreviewRow label="Warnings" value={stats.warnings.length} tone="amber" />
              </div>
            )}
          </AdminCard>
          <AdminCard className="p-5">
            <h2 className="mb-4 text-lg font-black tracking-[-0.02em]">Import mode</h2>
            {['Add new lists only', 'Update existing lists', 'Replace selected lists'].map((mode, index) => (
              <label key={mode} className="mb-3 flex items-center gap-3 rounded-md border border-slate-200 p-3 text-sm font-bold text-slate-800">
                <input type="radio" name="import-mode" defaultChecked={index === 0} className="accent-red-600" />
                {mode}
              </label>
            ))}
            <AdminButton className="mt-2 w-full" variant="primary">Mock import</AdminButton>
            <p className="mt-4 text-sm leading-6 text-slate-500">After import, missing audio can be sent to Audio Queue for generation.</p>
          </AdminCard>
          <AdminCard className="p-5">
            <h2 className="mb-4 text-lg font-black tracking-[-0.02em]">Schema checks</h2>
            <div className="grid gap-3 text-sm text-slate-600">
              {['Required list fields', 'Required word fields', 'Valid audioStatus values', 'Valid dialect values', 'Duplicate IDs', 'Missing prompts', 'Invalid variant groups', 'Accepted alternatives misuse', 'Notes containing exact Welsh answer'].map((check, index) => (
                <div key={check} className="flex items-center gap-2">
                  {index < 4 ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-orange-500" />}
                  {check}
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </>
  );
}

function PreviewRow({ label, value, tone = 'slate' }: { label: string; value: number; tone?: 'red' | 'amber' | 'slate' }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <StatusPill tone={tone}>{value}</StatusPill>
    </div>
  );
}
