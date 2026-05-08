import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTimestamp } from '../components/AdminTimestamp';
import { AdminButton, AdminCard } from '../components/primitives';
import { StatusPill } from '../components/StatusPill';
import type { AdminRepository } from '../repositories';
import type { AdminWordListCollection } from '../types';

export function CollectionsPage({ repository }: { repository: AdminRepository }) {
  const [collections, setCollections] = useState<AdminWordListCollection[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    repository.listCollections()
      .then(setCollections)
      .catch(error => {
        console.error(error);
        setErrorMessage(error instanceof Error ? error.message : 'Could not load collections.');
      });
  }, [repository]);

  return (
    <>
      <AdminPageHeader
        title="Collections"
        description="Collection metadata for grouping word lists. Ownership and permissions are future work."
        // TODO: Add school/teacher/user ownership workflows after account and permissions models exist.
        actions={<AdminButton variant="primary" disabled><Plus size={16} /> Add collection</AdminButton>}
      />
      {errorMessage && <div className="mb-5 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{errorMessage}</div>}
      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-medium text-slate-500">
              <tr>
                {['Name', 'Slug', 'Type', 'Languages', 'Owner', 'Active', 'Updated'].map(column => <th key={column} className="px-5 py-3">{column}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {collections.map(collection => (
                <tr key={collection.id}>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-950">{collection.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{collection.description}</div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-600">{collection.slug}</td>
                  <td className="px-5 py-4 text-slate-600">{collection.type}</td>
                  <td className="px-5 py-4 text-slate-600">{collection.sourceLanguage} → {collection.targetLanguage}</td>
                  <td className="px-5 py-4 text-slate-600">{collection.ownerType ?? 'none'}</td>
                  <td className="px-5 py-4"><StatusPill tone={collection.isActive ? 'green' : 'slate'}>{collection.isActive ? 'Active' : 'Inactive'}</StatusPill></td>
                  <td className="px-5 py-4 text-slate-500"><AdminTimestamp value={collection.updatedAt} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </>
  );
}
