import { AdminButton } from './primitives';

export function UnsavedChangesBar({ visible, onDiscard, onSave }: { visible: boolean; onDiscard: () => void; onSave: () => void }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-30 mx-auto max-w-7xl rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_50px_rgba(7,21,34,.12)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-red-600" />
          <span className="text-sm font-black text-slate-950">Unsaved changes</span>
          <span className="text-sm text-slate-500">You have edits that have not been saved.</span>
        </div>
        <div className="flex gap-3">
          <AdminButton onClick={onDiscard}>Discard changes</AdminButton>
          <AdminButton variant="primary" onClick={onSave}>Save changes</AdminButton>
        </div>
      </div>
    </div>
  );
}
