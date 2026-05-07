import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminButton, AdminCard, AdminInput } from '../components/primitives';
import { StatusPill } from '../components/StatusPill';
import type { AdminRepository } from '../repositories';
import type { AdminStructureOption } from '../types';

export function StagesPage({ repository }: { repository: AdminRepository }) {
  return <StructurePage title="Stages" description="Lightweight progression structure for spelling difficulty." repository={repository} kind="stages" />;
}

export function FocusCategoriesPage({ repository }: { repository: AdminRepository }) {
  return <StructurePage title="Focus Categories" description="Editorial groupings used to describe the purpose of each list." repository={repository} kind="focus" />;
}

export function DialectsPage({ repository }: { repository: AdminRepository }) {
  return <StructurePage title="Dialects" description="Supported dialect labels for list and word-level content." repository={repository} kind="dialects" />;
}

function StructurePage({ title, description, repository, kind }: { title: string; description: string; repository: AdminRepository; kind: 'stages' | 'focus' | 'dialects' }) {
  const [rows, setRows] = useState<AdminStructureOption[]>([]);

  useEffect(() => {
    const loadRows = kind === 'stages'
      ? repository.listStages
      : kind === 'focus'
        ? repository.listFocusCategories
        : repository.listDialects;
    loadRows().then(setRows).catch(console.error);
  }, [kind, repository]);

  return (
    <>
      <AdminPageHeader title={title} description={description} actions={<AdminButton variant="primary"><Plus size={16} /> Add</AdminButton>} />
      <AdminCard className="overflow-hidden">
        <div className="divide-y divide-slate-100">
          {rows.map(row => (
            <div key={row.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_120px_120px_auto] md:items-center">
              <AdminInput defaultValue={row.name} />
              <AdminInput type="number" defaultValue={row.order} />
              <StatusPill tone={row.active ? 'green' : 'slate'}>{row.active ? 'Active' : 'Inactive'}</StatusPill>
              <button className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-700" aria-label={`Delete ${row.name}`}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </AdminCard>
    </>
  );
}
