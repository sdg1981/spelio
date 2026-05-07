import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminCard, AdminInput } from '../components/primitives';
import { AudioStatusPill } from '../components/audioStatus';
import type { AdminRepository, AdminWordWithListName } from '../repositories';

export function WordsPage({ navigate, repository }: { navigate: (path: string) => void; repository: AdminRepository }) {
  const [words, setWords] = useState<AdminWordWithListName[]>([]);
  useEffect(() => {
    repository.listWords().then(items => setWords(items.slice(0, 30))).catch(console.error);
  }, [repository]);
  return (
    <>
      <AdminPageHeader title="Words" description="A searchable editorial view across all Welsh spelling words." />
      <AdminCard className="overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <AdminInput className="pl-9" placeholder="Search words" />
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {words.map(word => (
            <button key={word.id} className="grid w-full gap-2 px-5 py-4 text-left hover:bg-slate-50 lg:grid-cols-[1fr_1fr_180px_auto] lg:items-center" onClick={() => navigate(`/admin/word-lists/${word.listId}`)}>
              <div className="font-bold text-slate-950">{word.englishPrompt}</div>
              <div className="font-medium text-slate-700">{word.welshAnswer}</div>
              <div className="text-sm text-slate-500">{word.dialect}</div>
              <AudioStatusPill status={word.audioStatus} />
            </button>
          ))}
        </div>
      </AdminCard>
    </>
  );
}
