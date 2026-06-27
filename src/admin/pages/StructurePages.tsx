import { useEffect, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminCard } from '../components/primitives';
import { StatusPill } from '../components/StatusPill';
import type { AdminRepository } from '../repositories';
import type { AdminStructureOption } from '../types';

export function StagesPage({ repository }: { repository: AdminRepository }) {
  return <StructurePage title="Stages" description="Lightweight progression structure for spelling difficulty. Used by word-list metadata and public catalogue grouping." repository={repository} kind="stages" />;
}

export function FocusCategoriesPage({ repository }: { repository: AdminRepository }) {
  return <StructurePage title="Focus Categories" description="Editorial groupings used to describe the purpose of each list. Used by word-list metadata, filters, and content export." repository={repository} kind="focus" />;
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
      <AdminPageHeader
        title={title}
        description={description}
        actions={<span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">Read-only</span>}
      />
      <AdminCard className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500">
          Structure editing is not implemented in this admin UI yet. Update these records through migrations or repository methods before exposing inline edits.
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map(row => (
            <div key={row.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_120px_120px] md:items-center">
              <div>
                <div className="font-semibold text-slate-900">{row.name}</div>
                <div className="text-xs text-slate-500">{row.id}</div>
              </div>
              <div className="text-sm font-medium text-slate-600">Order {row.order}</div>
              <StatusPill tone={row.active ? 'green' : 'slate'}>{row.active ? 'Active' : 'Inactive'}</StatusPill>
            </div>
          ))}
        </div>
      </AdminCard>
    </>
  );
}
