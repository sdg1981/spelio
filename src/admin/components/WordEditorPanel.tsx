import { ChevronDown, ChevronUp, Info, Play, RefreshCw, Wand2, X } from 'lucide-react';
import { useState } from 'react';
import type { AdminWord } from '../types';
import { hasPlayableAudioUrl, logAudioPlaybackClick, playAudioUrl } from '../../lib/audioPlayback';
import { AdminTimestamp } from './AdminTimestamp';
import { AudioStatusPill } from './audioStatus';
import { AdminButton, AdminInput, AdminSelect, AdminSpinner, AdminTextarea, Field } from './primitives';

export function WordEditorPanel({
  word,
  index,
  total,
  onClose,
  onChange,
  onGenerateAudio,
  onRetryAudio,
  audioBusy,
  variant = 'panel'
}: {
  word: AdminWord;
  index: number;
  total: number;
  onClose: () => void;
  onChange: (patch: Partial<AdminWord>) => void;
  onGenerateAudio: (word: AdminWord) => void;
  onRetryAudio: (word: AdminWord) => void;
  audioBusy?: boolean;
  variant?: 'panel' | 'page';
}) {
  const [basicOpen, setBasicOpen] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const hasAudioPreview = hasPlayableAudioUrl(word.audioUrl);
  const isRegenerating = word.audioStatus === 'ready';
  const generateAudioLabel = isRegenerating ? 'Regenerate audio' : 'Generate audio';
  const generatingAudioLabel = isRegenerating ? 'Regenerating...' : 'Generating...';

  if (variant === 'page') {
    return (
      <section className="rounded-lg border border-slate-200 bg-white shadow-[0_18px_42px_rgba(7,21,34,.035)]">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black tracking-[-0.02em]">Basic details</h2>
              <p className="mt-2 text-sm text-slate-500">Editing word {index + 1} of {total}</p>
            </div>
            <AudioStatusPill status={word.audioStatus} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
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
        </div>
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-black tracking-[-0.02em]">Learner/content notes</h2>
          <div className="mt-5 grid gap-4">
            <Field label="Dialect note">
              <AdminTextarea value={word.dialectNote} onChange={event => onChange({ dialectNote: event.target.value })} />
            </Field>
            <Field label="Usage note">
              <AdminTextarea value={word.usageNote} onChange={event => onChange({ usageNote: event.target.value })} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Accepted alternatives" helper="Only same-slot spelling variations.">
                <AdminInput value={word.acceptedAlternatives.join(', ')} placeholder="Add alternative" onChange={event => onChange({ acceptedAlternatives: event.target.value.split(',').map(item => item.trim()).filter(Boolean) })} />
              </Field>
              <Field label="Variant group ID" helper="Link dialect variants of the same prompt.">
                <AdminInput value={word.variantGroupId} onChange={event => onChange({ variantGroupId: event.target.value })} />
              </Field>
            </div>
          </div>
        </div>
        <div className="border-b border-slate-200 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-black tracking-[-0.02em]">Audio</h2>
            <AudioStatusPill status={word.audioStatus} />
          </div>
          <p className="mb-4 text-sm text-slate-500">{hasAudioPreview ? 'Audio file is linked for this word.' : 'No playable audio file for this word yet.'}</p>
          <div className="flex flex-wrap gap-2">
            {hasAudioPreview && (
              <AdminButton onClick={() => {
                logAudioPlaybackClick('admin-word-editor-preview', word.audioUrl);
                void playAudioUrl(word.audioUrl);
              }}>
                <Play size={15} /> Preview
              </AdminButton>
            )}
            <AdminButton variant="primary" onClick={() => onGenerateAudio(word)} disabled={audioBusy} aria-disabled={audioBusy}>
              {audioBusy ? <AdminSpinner /> : <Wand2 size={15} />}
              {audioBusy ? generatingAudioLabel : generateAudioLabel}
            </AdminButton>
            {word.audioStatus === 'failed' && (
              <AdminButton onClick={() => onRetryAudio(word)} disabled={audioBusy} aria-disabled={audioBusy}>
                {audioBusy ? <AdminSpinner /> : <RefreshCw size={15} />}
                {audioBusy ? 'Generating...' : 'Retry'}
              </AdminButton>
            )}
          </div>
          <div className="mt-5 max-w-xs">
            <Field label="Audio status">
              <AdminSelect value={word.audioStatus} onChange={event => onChange({ audioStatus: event.target.value as AdminWord['audioStatus'] })}>
                <option value="missing">missing</option>
                <option value="queued">queued</option>
                <option value="generating">generating</option>
                <option value="ready">ready</option>
                <option value="failed">failed</option>
              </AdminSelect>
            </Field>
          </div>
        </div>
        <div className="p-5">
          <button className="flex w-full items-center justify-between text-left font-black text-slate-950" onClick={() => setAdvancedOpen(open => !open)}>
            Advanced
            {advancedOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {advancedOpen && (
            <div className="mt-4 grid gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2"><Info size={15} /> Technical fields for admin editing.</div>
              <Field label="Internal notes"><AdminTextarea value={word.notes} onChange={event => onChange({ notes: event.target.value })} /></Field>
              <SpellingHintControls word={word} onChange={onChange} />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Audio URL">
                  <AdminInput className="font-mono text-xs text-slate-600" value={word.audioUrl} onChange={event => onChange({ audioUrl: event.target.value })} />
                </Field>
                <Field label="Order"><AdminInput type="number" value={word.order} onChange={event => onChange({ order: Number(event.target.value) })} /></Field>
              </div>
              <div className="grid gap-2 text-xs leading-5 text-slate-500 md:grid-cols-2">
                <div><span className="font-bold text-slate-700">Word ID:</span> {word.id}</div>
                <div><span className="font-bold text-slate-700">List ID:</span> {word.listId}</div>
                <div>Created <AdminTimestamp value={word.createdAt} /></div>
                <div>Updated <AdminTimestamp value={word.updatedAt} /></div>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

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
          <AudioStatusPill status={word.audioStatus} />
        </div>
        <p className="mb-4 text-sm text-slate-500">{hasAudioPreview ? 'Audio file is linked for this word.' : 'No playable audio file for this word yet.'}</p>
        <div className="flex flex-wrap gap-2">
          {hasAudioPreview && (
            <AdminButton onClick={() => {
              logAudioPlaybackClick('admin-word-editor-preview', word.audioUrl);
              void playAudioUrl(word.audioUrl);
            }}>
              <Play size={15} /> Preview
            </AdminButton>
          )}
          <AdminButton variant="primary" onClick={() => onGenerateAudio(word)} disabled={audioBusy} aria-disabled={audioBusy}>
            {audioBusy ? <AdminSpinner /> : <Wand2 size={15} />}
            {audioBusy ? generatingAudioLabel : generateAudioLabel}
          </AdminButton>
          {word.audioStatus === 'failed' && (
            <AdminButton onClick={() => onRetryAudio(word)} disabled={audioBusy} aria-disabled={audioBusy}>
              {audioBusy ? <AdminSpinner /> : <RefreshCw size={15} />}
              {audioBusy ? 'Generating...' : 'Retry'}
            </AdminButton>
          )}
        </div>
        <div className="mt-4 grid gap-4">
          <Field label="Audio URL">
            <AdminInput value={word.audioUrl} onChange={event => onChange({ audioUrl: event.target.value })} />
          </Field>
          <Field label="Audio status">
            <AdminSelect value={word.audioStatus} onChange={event => onChange({ audioStatus: event.target.value as AdminWord['audioStatus'] })}>
              <option value="missing">missing</option>
              <option value="queued">queued</option>
              <option value="generating">generating</option>
              <option value="ready">ready</option>
              <option value="failed">failed</option>
            </AdminSelect>
          </Field>
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
            <SpellingHintControls word={word} onChange={onChange} />
            <Field label="Order"><AdminInput type="number" value={word.order} onChange={event => onChange({ order: Number(event.target.value) })} /></Field>
            <div>Created <AdminTimestamp value={word.createdAt} /></div>
            <div>Updated <AdminTimestamp value={word.updatedAt} /></div>
          </div>
        )}
      </div>
    </aside>
  );
}

function SpellingHintControls({ word, onChange }: { word: AdminWord; onChange: (patch: Partial<AdminWord>) => void }) {
  return (
    <div className="grid gap-3 rounded-md border border-slate-100 bg-slate-50/60 p-3">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Advanced spelling hint controls</div>
        <p className="mt-1 text-xs leading-5 text-slate-500">Optional pattern hint overrides. Leave blank unless a reviewed hint should be forced.</p>
      </div>
      <Field label="Spelling hint ID">
        <AdminInput
          className="font-mono text-xs text-slate-600"
          value={word.spellingHintId ?? ''}
          placeholder="cy.dd.softTh"
          onChange={event => onChange({ spellingHintId: event.target.value })}
        />
      </Field>
      <label className="flex items-start gap-3 text-xs leading-5 text-slate-600">
        <input
          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950"
          type="checkbox"
          checked={word.disablePatternHints === true}
          onChange={event => onChange({ disablePatternHints: event.target.checked })}
        />
        <span>
          <span className="block font-bold text-slate-700">Disable automatic pattern hints</span>
          Suppresses generic spelling pattern hints for this word.
        </span>
      </label>
    </div>
  );
}
