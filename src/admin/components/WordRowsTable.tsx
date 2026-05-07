import { Copy, GripVertical, Pencil, Play, Trash2, Wand2, ArrowUp, ArrowDown } from 'lucide-react';
import type { AdminWord } from '../types';
import { hasPlayableAudioUrl, logAudioPlaybackClick, playAudioUrl } from '../../lib/audioPlayback';
import { AdminButton } from './primitives';
import { AudioStatusPill } from './audioStatus';

const filters = ['All', 'Missing audio', 'Missing notes', 'North Wales', 'South Wales', 'Has variants'];

export function WordRowsTable({
  words,
  selectedWordId,
  onSelectWord,
  onQuickAdd,
  onAddWord,
  onGenerateMissingAudio,
  onDuplicateWord,
  onDeleteWord,
  onMoveWord
}: {
  words: AdminWord[];
  selectedWordId?: string;
  onSelectWord: (word: AdminWord) => void;
  onQuickAdd: () => void;
  onAddWord: () => void;
  onGenerateMissingAudio: () => void;
  onDuplicateWord: (word: AdminWord) => void;
  onDeleteWord: (word: AdminWord) => void;
  onMoveWord: (wordId: string, direction: 'up' | 'down') => void;
}) {
  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-[-0.02em]">Words ({words.length})</h2>
          <p className="text-sm text-slate-500">Drag rows to reorder</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminButton onClick={onQuickAdd}>+ Quick add</AdminButton>
          <AdminButton onClick={onAddWord}>+ Add word</AdminButton>
          <AdminButton onClick={onGenerateMissingAudio}>
            <Wand2 size={16} />
            Generate missing audio ({words.filter(word => word.audioStatus === 'missing').length})
          </AdminButton>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-5 py-4">
        <span className="text-sm font-medium text-slate-700">Filter:</span>
        {filters.map(filter => (
          <button
            key={filter}
            className={`rounded-md border px-3 py-1.5 text-xs font-bold ${filter === 'All' ? 'border-red-100 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            {filter}
          </button>
        ))}
        <button className="ml-auto text-xs font-medium text-slate-500">Clear</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-t border-slate-200 text-left text-sm">
          <thead className="bg-white text-xs font-medium text-slate-500">
            <tr>
              <th className="w-10 px-4 py-3" />
              <th className="w-14 px-2 py-3">#</th>
              <th className="px-4 py-3">English prompt</th>
              <th className="px-4 py-3">Welsh answer</th>
              <th className="px-4 py-3">Dialect</th>
              <th className="px-4 py-3">Audio</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {words.map(word => (
              <tr
                key={word.id}
                className={`cursor-pointer transition hover:bg-slate-50 ${selectedWordId === word.id ? 'bg-red-50/35' : 'bg-white'}`}
                onClick={() => onSelectWord(word)}
              >
                <td className="px-4 py-3 text-slate-500"><GripVertical size={16} /></td>
                <td className="px-2 py-3 text-slate-500">{word.order}</td>
                <td className="px-4 py-3 font-medium text-slate-950">{word.englishPrompt}</td>
                <td className="px-4 py-3 font-medium text-slate-950">{word.welshAnswer}</td>
                <td className="px-4 py-3 text-slate-700">{word.dialect}</td>
                <td className="px-4 py-3">
                  <button className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" disabled={!hasPlayableAudioUrl(word.audioUrl)} onClick={event => {
                    event.stopPropagation();
                    logAudioPlaybackClick('admin-word-row-preview', word.audioUrl);
                    void playAudioUrl(word.audioUrl);
                  }} aria-label="Preview audio">
                    <Play size={14} fill="currentColor" />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <AudioStatusPill status={word.audioStatus} />
                  {word.variantGroupId && <span className="ml-2 rounded-full bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700">1</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2 text-slate-700">
                    <IconAction label="Move up" icon={<ArrowUp size={15} />} onClick={() => onMoveWord(word.id, 'up')} />
                    <IconAction label="Move down" icon={<ArrowDown size={15} />} onClick={() => onMoveWord(word.id, 'down')} />
                    <IconAction label="Edit" icon={<Pencil size={15} />} onClick={() => onSelectWord(word)} />
                    <IconAction label="Duplicate as variant" icon={<Copy size={15} />} onClick={() => onDuplicateWord(word)} />
                    <IconAction label="Delete" icon={<Trash2 size={15} />} onClick={() => onDeleteWord(word)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-500">Showing {words.length} of {words.length} words</div>
    </div>
  );
}

function IconAction({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className="grid h-8 w-8 place-items-center rounded-md text-slate-700 hover:bg-slate-100"
      aria-label={label}
      title={label}
      onClick={event => {
        event.stopPropagation();
        onClick();
      }}
    >
      {icon}
    </button>
  );
}
