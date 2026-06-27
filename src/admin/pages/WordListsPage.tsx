import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTimestamp } from '../components/AdminTimestamp';
import { AdminButton, AdminCard, AdminInput } from '../components/primitives';
import { StatusPill } from '../components/StatusPill';
import type { AdminRepository } from '../repositories';
import { getAudioHealth } from '../repositories';
import { createDraftAdminWordList } from '../services/wordListDraft';
import type { AdminStructureOption, AdminWordList, AdminWordListCollection } from '../types';

export function WordListsPage({ navigate, repository }: { navigate: (path: string) => void; repository: AdminRepository }) {
  const [query, setQuery] = useState('');
  const [wordLists, setWordLists] = useState<AdminWordList[]>([]);
  const [stages, setStages] = useState<AdminStructureOption[]>([]);
  const [collections, setCollections] = useState<AdminWordListCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  useEffect(() => {
    Promise.all([repository.listWordLists(), repository.listStages(), repository.listCollections()])
      .then(([lists, nextStages, nextCollections]) => {
        setWordLists(lists);
        setStages(nextStages);
        setCollections(nextCollections);
      })
      .catch(error => {
        console.error(error);
        setErrorMessage(error instanceof Error ? error.message : 'Could not load word lists.');
      })
      .finally(() => setLoading(false));
  }, [repository]);
  const lists = useMemo(() => wordLists.filter(list => `${list.name} ${list.stage} ${list.collectionName}`.toLowerCase().includes(query.toLowerCase())), [query, wordLists]);

  async function createList() {
    const name = window.prompt('Name this word list', 'New Word List');
    if (!name) return;
    const list = createDraftAdminWordList({ name, existingLists: wordLists, stages, collections });
    try {
      setSaving(true);
      setErrorMessage('');
      const created = await repository.createWordList(list);
      navigate(`/admin/word-lists/${created.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not create word list.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Word Lists"
        description="Manage learner-facing journey and Practice Library lists, plus ordering, visibility, and metadata."
        actions={<AdminButton variant="primary" onClick={createList} disabled={saving}><Plus size={16} /> {saving ? 'Adding...' : 'Add word list'}</AdminButton>}
      />
      {errorMessage && <div className="mb-5 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{errorMessage}</div>}
      <AdminCard className="overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <AdminInput className="pl-9" placeholder="Search word lists" value={query} onChange={event => setQuery(event.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-medium text-slate-500">
              <tr>
                {['Name', 'Type', 'Collection', 'Internal stage', 'Difficulty', 'Words', 'Audio health', 'Active', 'Updated'].map(column => <th key={column} className="px-5 py-3">{column}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-slate-500">Loading word lists...</td></tr>
              )}
              {!loading && lists.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-slate-500">No word lists found.</td></tr>
              )}
              {lists.map(list => {
                const audio = getAudioHealth(list);
                return (
                  <tr key={list.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/admin/word-lists/${list.id}`)}>
                    <td className="px-5 py-4 font-bold text-slate-950">{list.name}</td>
                    <td className="px-5 py-4"><StatusPill tone={list.listType === 'support' || list.isSupportList ? 'amber' : 'slate'}>{list.listType === 'support' || list.isSupportList ? 'Support list' : 'Main list'}</StatusPill></td>
                    <td className="px-5 py-4 text-slate-600">{list.collectionName}</td>
                    <td className="px-5 py-4 text-slate-600">{list.stage}</td>
                    <td className="px-5 py-4 text-slate-600">{list.difficulty}</td>
                    <td className="px-5 py-4 text-slate-600">{list.words.length}</td>
                    <td className="px-5 py-4"><StatusPill tone={audio.missing ? 'red' : 'green'}>{audio.missing ? `${audio.missing} missing` : 'Ready'}</StatusPill></td>
                    <td className="px-5 py-4"><StatusPill tone={list.isActive ? 'green' : 'slate'}>{list.isActive ? 'Active' : 'Draft'}</StatusPill></td>
                    <td className="px-5 py-4 text-slate-500"><AdminTimestamp value={list.updatedAt} /></td>
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
