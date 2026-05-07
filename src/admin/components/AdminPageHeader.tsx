import type { ReactNode } from 'react';

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        {eyebrow && <div className="mb-3 text-sm font-medium text-slate-500">{eyebrow}</div>}
        <h1 className="text-3xl font-black leading-tight tracking-[-0.03em] text-slate-950">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
