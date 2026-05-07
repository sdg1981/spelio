import type { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout({ children, path, navigate }: { children: ReactNode; path: string; navigate: (path: string) => void }) {
  return (
    <div className="min-h-screen bg-[#fbfbfc] text-slate-950">
      <div className="lg:grid lg:grid-cols-[288px_1fr]">
        <AdminSidebar path={path} navigate={navigate} />
        <main className="min-w-0 px-4 py-6 sm:px-7 lg:px-10 lg:py-8 xl:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
