import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTimestamp } from '../components/AdminTimestamp';
import { AdminButton, AdminCard } from '../components/primitives';
import { StatusPill } from '../components/StatusPill';
import type { AdminRepository } from '../repositories';
import type { AdminWordList, AdminWordListCollection } from '../types';

export function CollectionsPage({ navigate, repository }: { navigate: (path: string) => void; repository: AdminRepository }) {
  const [collections, setCollections] = useState<AdminWordListCollection[]>([]);
  const [wordLists, setWordLists] = useState<AdminWordList[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

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

  function openCollection(collection: AdminWordListCollection) {
    navigate(`/admin/collections/${encodeURIComponent(collection.id)}`);
  }

  return (
    <>
      <AdminPageHeader
        title="Collections"
        description="Collection metadata for grouping word lists. Ownership and permissions are future work."
        actions={(
          <div className="grid gap-1 justify-items-start lg:justify-items-end">
            {/* TODO: Add a collection creation form after ownership/default-metadata rules are defined. */}
            <AdminButton variant="primary" disabled title="Collection creation needs a dedicated create form before this button can be enabled.">
              <Plus size={16} /> Add collection
            </AdminButton>
            <span className="text-xs font-semibold text-slate-500">Collection creation is not exposed in this MVP editor yet.</span>
          </div>
        )}
      />

      {errorMessage && (
        <div className="mb-5 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-medium text-slate-500">
              <tr>
                {['Name', 'Slug', 'Type', 'Content', 'Active', 'Updated'].map(column => <th key={column} className="px-5 py-3">{column}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {collections.map(collection => {
                const counts = contentCounts.get(collection.id) ?? { lists: 0, words: 0 };
                return (
                  <tr
                    key={collection.id}
                    role="link"
                    tabIndex={0}
                    className="cursor-pointer transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-200"
                    onClick={() => openCollection(collection)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openCollection(collection);
                      }
                    }}
                    aria-label={`Edit ${collection.name}`}
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-950">{collection.name}</div>
                      {collection.nameCy && <div className="mt-1 text-xs font-semibold text-slate-700">{collection.nameCy}</div>}
                      {collection.description && <div className="mt-1 max-w-md truncate text-xs text-slate-500">{collection.description}</div>}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">{collection.slug}</td>
                    <td className="px-5 py-4 text-slate-600">{collection.type}</td>
                    <td className="px-5 py-4 text-slate-600">{counts.lists} list(s), {counts.words} word(s)</td>
                    <td className="px-5 py-4"><StatusPill tone={collection.isActive ? 'green' : 'slate'}>{collection.isActive ? 'Active' : 'Inactive'}</StatusPill></td>
                    <td className="px-5 py-4 text-slate-500"><AdminTimestamp value={collection.updatedAt} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </>
  );
}
