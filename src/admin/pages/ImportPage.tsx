import { AlertTriangle, CheckCircle2, FileJson } from 'lucide-react';
import { useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { ImportDropzone } from '../components/ImportDropzone';
import { AdminButton, AdminCard, AdminTextarea } from '../components/primitives';
import { StatusPill } from '../components/StatusPill';
import type { AdminRepository } from '../repositories';
import type { ImportContentResult, ImportValidationResult } from '../types';

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
  collections: 0,
  defaultedCollections: 0,
  totalLists: 0,
  newLists: 0,
  updatedLists: 0,
  newWords: 0,
  updatedWords: 0,
  totalWords: 0,
  duplicates: 0,
  missingAudio: 0,
  errors: [],
  warnings: []
};

export function ImportPage({ repository }: { repository: AdminRepository }) {
  const [json, setJson] = useState(sampleJson);
  const [validated, setValidated] = useState(true);
  const [stats, setStats] = useState<ImportValidationResult>(initialStats);
  const [importResult, setImportResult] = useState<ImportContentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  async function validate() {
    // TODO: Call a protected server/API route for production import validation and import writes.
    try {
      setIsValidating(true);
      setErrorMessage('');
      setImportResult(null);
      setStats(await repository.previewImport(json));
      setValidated(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Validation failed.');
    } finally {
      setIsValidating(false);
    }
  }

  async function importContent() {
    try {
      setIsImporting(true);
      setErrorMessage('');
      setImportResult(await repository.importContent(json));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Import failed.');
    } finally {
      setIsImporting(false);
    }
  }

  function handleFileText(text: string) {
    setJson(text);
    setValidated(false);
    setImportResult(null);
    setStats(initialStats);
  }

  return (
    <>
      <AdminPageHeader
        title="Import"
        description="Validate Spelio word-list JSON, preview the dry run, then explicitly import create/update-only content."
        actions={<AdminButton variant="primary" onClick={validate} disabled={isValidating}>{isValidating ? 'Validating...' : 'Validate / Preview'}</AdminButton>}
      />
      {errorMessage && <div className="mb-5 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{errorMessage}</div>}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-6">
          <ImportDropzone onFileText={handleFileText} />
          <AdminCard className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <FileJson size={20} className="text-slate-700" />
              <h2 className="text-lg font-black tracking-[-0.02em]">Paste JSON</h2>
            </div>
            <AdminTextarea
              className="min-h-[320px] font-mono text-xs leading-5"
              value={json}
              onChange={event => {
                setJson(event.target.value);
                setValidated(false);
                setImportResult(null);
              }}
            />
            <div className="mt-4 flex justify-end">
              <AdminButton variant="primary" onClick={validate} disabled={isValidating}>{isValidating ? 'Validating...' : 'Validate / Preview'}</AdminButton>
            </div>
          </AdminCard>
        </div>
        <div className="grid gap-6 self-start">
          <AdminCard className="p-5">
            <h2 className="text-lg font-black tracking-[-0.02em]">Validation preview</h2>
            {validated && (
              <div className="mt-5 grid gap-3">
                <PreviewRow label="Collections found/defaulted" value={stats.collections} />
                <PreviewRow label="Default collection used" value={stats.defaultedCollections} />
                <PreviewRow label="Word lists" value={stats.totalLists} />
                <PreviewRow label="New lists" value={stats.newLists} />
                <PreviewRow label="Updated lists" value={stats.updatedLists} />
                <PreviewRow label="New words" value={stats.newWords} />
                <PreviewRow label="Updated words" value={stats.updatedWords} />
                <PreviewRow label="Total words" value={stats.totalWords} />
                <PreviewRow label="Duplicates" value={stats.duplicates} tone="amber" />
                <PreviewRow label="Missing audio" value={stats.missingAudio} tone="red" />
                <PreviewRow label="Blocking errors" value={stats.errors.length} tone="red" />
                <PreviewRow label="Warnings" value={stats.warnings.length} tone="amber" />
              </div>
            )}
          </AdminCard>
          <AdminCard className="p-5">
            <h2 className="mb-4 text-lg font-black tracking-[-0.02em]">Import</h2>
            <p className="mb-4 text-sm leading-6 text-slate-500">Creates or updates collections, lists, and words. Existing content not present in the JSON is left untouched.</p>
            <AdminButton
              className="w-full"
              variant="primary"
              disabled={!validated || stats.errors.length > 0 || isImporting}
              onClick={importContent}
            >
              {isImporting ? 'Importing...' : 'Import content'}
            </AdminButton>
            {importResult && (
              <div className={`mt-4 rounded-md border px-4 py-3 text-sm ${importResult.success ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-red-100 bg-red-50 text-red-700'}`}>
                <div className="font-black">{importResult.success ? 'Import complete' : 'Import failed'}</div>
                <div className="mt-2 leading-6">
                  Collections: {importResult.collectionsUpserted}<br />
                  Lists: {importResult.listsUpserted}<br />
                  Words: {importResult.wordsUpserted}
                </div>
                {importResult.errors.length > 0 && <IssueList title="Errors" items={importResult.errors} tone="red" />}
              </div>
            )}
          </AdminCard>
          {validated && stats.errors.length > 0 && (
            <AdminCard className="p-5">
              <IssueList title="Blocking errors" items={stats.errors} tone="red" />
            </AdminCard>
          )}
          {validated && stats.warnings.length > 0 && (
            <AdminCard className="p-5">
              <IssueList title="Warnings" items={stats.warnings} tone="amber" />
            </AdminCard>
          )}
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

function IssueList({ title, items, tone }: { title: string; items: string[]; tone: 'red' | 'amber' }) {
  const color = tone === 'red' ? 'text-red-700' : 'text-amber-700';
  return (
    <div className="mt-4 first:mt-0">
      <h3 className={`mb-3 text-sm font-black ${color}`}>{title}</h3>
      <ul className="max-h-72 list-disc overflow-auto pl-5 text-sm leading-6 text-slate-700">
        {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
}
