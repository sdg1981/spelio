import { ChevronDown, ChevronUp, Info, X } from 'lucide-react';
import { useState } from 'react';
import type { AdminWord } from '../types';
import { AdminButton, AdminInput, AdminSelect, AdminTextarea, Field } from './primitives';
import { StatusPill } from './StatusPill';

export function WordEditorPanel({
  word,
  index,
  total,
  onClose,
  onChange
}: {
  word: AdminWord;
  index: number;
  total: number;
  onClose: () => void;
  onChange: (patch: Partial<AdminWord>) => void;
}) {
  const [basicOpen, setBasicOpen] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <aside className="rounded-lg border border-slate-200 bg-white shadow-[0_18px_42px_rgba(7,21,34,.035)] xl:sticky xl:top-8">
      <div className="flex items-start justify-between border-b border-slate-200 p-5">
        <div>
          <h2 className="text-lg font-black tracking-[-0.02em]">Word editor</h2>
          <p className="mt-2 text-sm text-slate-500">Editing word {index + 1} of {total}</p>
        </div>
        <button className="rounded-md p-1 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Close word editor">
          <X size={18} />
        </button>
      </div>
      <div className="border-b border-slate-200 p-5">
        <button className="flex w-full items-center justify-between text-left font-black text-slate-950" onClick={() => setBasicOpen(open => !open)}>
          Basic details
          {basicOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {basicOpen && (
          <div className="mt-4 grid gap-4">
            <Field label="English prompt">
              <AdminInput value={word.englishPrompt} onChange={event => onChange({ englishPrompt: event.target.value })} />
            </Field>
            <Field label="Welsh answer">
              <AdminInput value={word.welshAnswer} onChange={event => onChange({ welshAnswer: event.target.value })} />
            </Field>
            <Field label="Dialect">
              <AdminSelect value={word.dialect} onChange={event => onChange({ dialect: event.target.value as AdminWord['dialect'] })}>
                <option>Both</option>
                <option>North Wales</option>
                <option>South Wales / Standard</option>
                <option>Standard</option>
                <option>Other</option>
              </AdminSelect>
            </Field>
            <Field label="Dialect note">
              <AdminTextarea value={word.dialectNote} onChange={event => onChange({ dialectNote: event.target.value })} />
            </Field>
            <Field label="Usage note">
              <AdminTextarea value={word.usageNote} onChange={event => onChange({ usageNote: event.target.value })} />
            </Field>
            <Field label="Variant group ID" helper="Link dialect variants of the same prompt.">
              <AdminInput value={word.variantGroupId} onChange={event => onChange({ variantGroupId: event.target.value })} />
            </Field>
            <Field label="Accepted alternatives" helper="Only same-slot spelling variations.">
              <AdminInput value={word.acceptedAlternatives.join(', ')} placeholder="Add alternative" onChange={event => onChange({ acceptedAlternatives: event.target.value.split(',').map(item => item.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Difficulty">
              <AdminSelect value={word.difficulty} onChange={event => onChange({ difficulty: Number(event.target.value) })}>
                <option value={1}>1 - Beginner</option>
                <option value={2}>2 - Easy</option>
                <option value={3}>3 - Developing</option>
                <option value={4}>4 - Challenging</option>
                <option value={5}>5 - Advanced</option>
              </AdminSelect>
            </Field>
          </div>
        )}
      </div>
      <div className="border-b border-slate-200 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-black">Audio</h3>
          {word.audioStatus === 'generated' ? <StatusPill tone="green">Ready</StatusPill> : word.audioStatus === 'failed' ? <StatusPill tone="amber">Failed</StatusPill> : <StatusPill tone="red">Missing</StatusPill>}
        </div>
        <p className="mb-4 text-sm text-slate-500">{word.audioUrl ? 'Audio file is linked for this word.' : 'No audio file for this word yet.'}</p>
        <div className="flex flex-wrap gap-2">
          <AdminButton variant="primary" onClick={() => onChange({ audioStatus: 'generated', audioUrl: '/audio/mock.m4a' })}>Generate audio</AdminButton>
          <AdminButton onClick={() => onChange({ audioStatus: 'failed' })}>Mark as failed</AdminButton>
        </div>
      </div>
      <div className="p-5">
        <button className="flex w-full items-center justify-between text-left font-black text-slate-950" onClick={() => setAdvancedOpen(open => !open)}>
          Advanced
          {advancedOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {advancedOpen && (
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <div className="flex items-center gap-2"><Info size={15} /> Raw IDs are hidden in normal editing.</div>
            <Field label="Internal notes"><AdminTextarea value={word.notes} onChange={event => onChange({ notes: event.target.value })} /></Field>
            <div>Created {word.createdAt}</div>
            <div>Updated {word.updatedAt}</div>
          </div>
        )}
      </div>
    </aside>
  );
}
