import { Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTimestamp } from '../components/AdminTimestamp';
import { AdminButton, AdminCard, AdminInput } from '../components/primitives';
import { StatusPill } from '../components/StatusPill';
import type { AdminRepository } from '../repositories';
import type { AdminWordListCollection } from '../types';
import { ADMIN_CONTENT_DELETE_FLAG, getDeleteConfirmationPhrase, isAdminContentDeleteAllowed, isDeleteConfirmationValid } from '../services/contentDeleteSafety';
import type { AdminWordList } from '../types';

export function CollectionsPage({ repository }: { repository: AdminRepository }) {
  const [collections, setCollections] = useState<AdminWordListCollection[]>([]);
  const [wordLists, setWordLists] = useState<AdminWordList[]>([]);
  const [clearingCollection, setClearingCollection] = useState<AdminWordListCollection | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [busyCollectionId, setBusyCollectionId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const deleteAllowed = isAdminContentDeleteAllowed(import.meta.env.VITE_ALLOW_ADMIN_CONTENT_DELETE);

  useEffect(() => {
    Promise.all([repository.listCollections(), repository.listWordLists()])
      .then(([nextCollections, nextWordLists]) => {
        setCollections(nextCollections);
        setWordLists(nextWordLists);
      })
      .catch(error => {
        console.error(error);
        setErrorMessage(error instanceof Error ? error.message : 'Could not load collections.');
      });
  }, [repository]);

  const contentCounts = useMemo(() => {
    const counts = new Map<string, { lists: number; words: number }>();
    for (const list of wordLists) {
      const current = counts.get(list.collectionId) ?? { lists: 0, words: 0 };
      counts.set(list.collectionId, { lists: current.lists + 1, words: current.words + list.words.length });
    }
    return counts;
  }, [wordLists]);

  const clearingCounts = clearingCollection ? contentCounts.get(clearingCollection.id) ?? { lists: 0, words: 0 } : { lists: 0, words: 0 };
  const canConfirmClear = clearingCollection ? isDeleteConfirmationValid(confirmationText, clearingCollection.id) : false;

  async function refreshContent() {
    const [nextCollections, nextWordLists] = await Promise.all([repository.listCollections(), repository.listWordLists()]);
    setCollections(nextCollections);
    setWordLists(nextWordLists);
  }

  async function clearCollectionContent() {
    if (!clearingCollection || !canConfirmClear) return;
    try {
      setBusyCollectionId(clearingCollection.id);
      setErrorMessage('');
      setStatusMessage('');
      const result = await repository.clearCollectionContent(clearingCollection.id);
      await refreshContent();
      setStatusMessage(`Cleared ${result.listsDeleted} list(s) and ${result.wordsDeleted} word(s) from ${clearingCollection.name}.`);
      setClearingCollection(null);
      setConfirmationText('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not clear collection content.');
    } finally {
      setBusyCollectionId('');
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Collections"
        description="Collection metadata for grouping word lists. Ownership and permissions are future work."
        // TODO: Add school/teacher/user ownership workflows after account and permissions models exist.
        actions={<AdminButton variant="primary" disabled><Plus size={16} /> Add collection</AdminButton>}
      />
      {!deleteAllowed && (
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          Destructive content deletion is unavailable. Set {ADMIN_CONTENT_DELETE_FLAG}=true only for an intentional admin cleanup.
        </div>
      )}
      {(statusMessage || errorMessage) && (
        <div className={`mb-5 rounded-md border px-4 py-3 text-sm font-bold ${errorMessage ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
          {errorMessage || statusMessage}
        </div>
      )}
      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-medium text-slate-500">
              <tr>
                {['Name', 'Slug', 'Type', 'Languages', 'Owner', 'Content', 'Active', 'Updated', 'Actions'].map(column => <th key={column} className="px-5 py-3">{column}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {collections.map(collection => {
                const counts = contentCounts.get(collection.id) ?? { lists: 0, words: 0 };
                return (
                  <tr key={collection.id}>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-950">{collection.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{collection.description}</div>
                      <div className="mt-1 font-mono text-[11px] text-slate-400">{collection.id}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">{collection.slug}</td>
                    <td className="px-5 py-4 text-slate-600">{collection.type}</td>
                    <td className="px-5 py-4 text-slate-600">{collection.sourceLanguage} -&gt; {collection.targetLanguage}</td>
                    <td className="px-5 py-4 text-slate-600">{collection.ownerType ?? 'none'}</td>
                    <td className="px-5 py-4 text-slate-600">{counts.lists} list(s), {counts.words} word(s)</td>
                    <td className="px-5 py-4"><StatusPill tone={collection.isActive ? 'green' : 'slate'}>{collection.isActive ? 'Active' : 'Inactive'}</StatusPill></td>
                    <td className="px-5 py-4 text-slate-500"><AdminTimestamp value={collection.updatedAt} /></td>
                    <td className="px-5 py-4">
                      {deleteAllowed && (
                        <AdminButton
                          variant="danger"
                          className="min-h-9 px-3 text-xs"
                          disabled={busyCollectionId === collection.id || counts.lists === 0}
                          onClick={() => {
                            setClearingCollection(collection);
                            setConfirmationText('');
                            setStatusMessage('');
                            setErrorMessage('');
                          }}
                        >
                          <Trash2 size={14} /> Clear content
                        </AdminButton>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminCard>
      {clearingCollection && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-lg border border-red-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-black text-slate-950">Clear collection content</h2>
                <p className="mt-1 text-sm text-slate-600">This will delete word lists and words, but preserve the collection row.</p>
              </div>
              <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" type="button" onClick={() => setClearingCollection(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 p-5 text-sm">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="font-bold text-slate-950">{clearingCollection.name}</div>
                <div className="mt-1 font-mono text-xs text-slate-600">{clearingCollection.id}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-slate-200 p-3"><b>{clearingCounts.lists}</b><span className="ml-1 text-slate-600">list(s) deleted</span></div>
                <div className="rounded-md border border-slate-200 p-3"><b>{clearingCounts.words}</b><span className="ml-1 text-slate-600">word(s) deleted</span></div>
              </div>
              <div className="rounded-md border border-red-100 bg-red-50 p-4 font-bold text-red-700">This cannot be undone.</div>
              <label className="grid gap-2">
                <span className="text-xs font-bold text-slate-700">Type {getDeleteConfirmationPhrase(clearingCollection.id)} to confirm</span>
                <AdminInput value={confirmationText} onChange={event => setConfirmationText(event.target.value)} autoFocus />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <AdminButton onClick={() => setClearingCollection(null)}>Cancel</AdminButton>
              <AdminButton variant="danger" disabled={!canConfirmClear || busyCollectionId === clearingCollection.id} onClick={clearCollectionContent}>
                <Trash2 size={16} /> {busyCollectionId === clearingCollection.id ? 'Deleting...' : 'Delete lists & words'}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
