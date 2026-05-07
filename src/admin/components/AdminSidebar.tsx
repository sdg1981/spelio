import { BarChart3, BookOpen, Files, FolderTree, Headphones, Import, Layers3, LogOut, Menu, Settings, SlidersHorizontal, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

type Navigate = (path: string) => void;

const navGroups = [
  {
    label: 'Content',
    items: [
      { label: 'Overview', path: '/admin', icon: BarChart3 },
      { label: 'Word Lists', path: '/admin/word-lists', icon: Files },
      { label: 'Words', path: '/admin/words', icon: BookOpen },
      { label: 'Audio Queue', path: '/admin/audio', icon: Headphones },
      { label: 'Import', path: '/admin/import', icon: Import, badge: 'New' }
    ]
  },
  {
    label: 'Structure',
    items: [
      { label: 'Stages', path: '/admin/stages', icon: Layers3 },
      { label: 'Focus Categories', path: '/admin/focus-categories', icon: SlidersHorizontal },
      { label: 'Dialects', path: '/admin/dialects', icon: FolderTree }
    ]
  },
  {
    label: 'System',
    items: [{ label: 'Settings', path: '/admin/settings', icon: Settings }]
  }
];

export function AdminSidebar({ path, navigate }: { path: string; navigate: Navigate }) {
  const [open, setOpen] = useState(false);
  const go = (nextPath: string) => {
    navigate(nextPath);
    setOpen(false);
  };

  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <LogoBlock />
        <button className="rounded-md border border-slate-200 p-2 text-slate-700" onClick={() => setOpen(true)} aria-label="Open admin navigation">
          <Menu size={20} />
        </button>
      </div>
      {open && <button className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-7 py-7">
          <LogoBlock />
          <button className="rounded-md p-2 text-slate-500 lg:hidden" onClick={() => setOpen(false)} aria-label="Close admin navigation">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 pb-5">
          {navGroups.map(group => (
            <div key={group.label} className="border-b border-slate-200 py-5 first:pt-3">
              <div className="mb-3 px-3 text-xs font-bold uppercase tracking-[.13em] text-slate-500">{group.label}</div>
              <div className="grid gap-1">
                {group.items.map(item => (
                  <NavItem key={item.path} active={isActive(path, item.path)} onClick={() => go(item.path)} badge={item.badge} icon={<item.icon size={18} />}>
                    {item.label}
                  </NavItem>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-5">
          <button className="mb-5 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => go('/admin/login')}>
            <LogOut size={18} />
            Sign out
          </button>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-sm font-black text-slate-900">A</div>
            <div>
              <div className="text-sm font-bold text-slate-950">Admin</div>
              <div className="text-xs text-slate-500">Founder</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function LogoBlock() {
  return <img src="/spelio-logo.svg" alt="Spelio" className="h-auto w-[116px]" />;
}

function NavItem({ active, children, icon, badge, onClick }: { active: boolean; children: ReactNode; icon: ReactNode; badge?: string; onClick: () => void }) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-bold transition ${active ? 'bg-red-50 text-red-700' : 'text-slate-800 hover:bg-slate-50'}`}
      onClick={onClick}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {badge && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">{badge}</span>}
    </button>
  );
}

function isActive(currentPath: string, itemPath: string) {
  if (itemPath === '/admin') return currentPath === '/admin';
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}
