import { Download, Upload } from 'lucide-react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminButton, AdminCard } from '../components/primitives';
import { StatusPill } from '../components/StatusPill';

export function SettingsPage() {
  return (
    <>
      <AdminPageHeader title="Settings" description="Founder settings and integration readiness. No backend secrets are stored in the frontend." />
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard className="p-5">
          <h2 className="mb-5 text-lg font-black tracking-[-0.02em]">Services</h2>
          <SettingRow label="Azure Voice status" status="Not connected" tone="slate" />
          <SettingRow label="Storage status" status="Mock only" tone="amber" />
          <SettingRow label="Analytics status" status="Disabled" tone="slate" />
          <SettingRow label="Admin analytics excluded" status="Enabled" tone="green" />
        </AdminCard>
        <AdminCard className="p-5">
          <h2 className="mb-5 text-lg font-black tracking-[-0.02em]">Export and import</h2>
          <p className="mb-5 text-sm leading-6 text-slate-500">Placeholders for content export, JSON import history, and future storage-backed publishing.</p>
          <div className="flex flex-wrap gap-3">
            <AdminButton><Download size={16} /> Export JSON</AdminButton>
            <AdminButton><Upload size={16} /> Import history</AdminButton>
          </div>
        </AdminCard>
      </div>
    </>
  );
}

function SettingRow({ label, status, tone }: { label: string; status: string; tone: 'green' | 'amber' | 'slate' }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-4 last:border-0">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <StatusPill tone={tone}>{status}</StatusPill>
    </div>
  );
}
