import { ExternalLink, RefreshCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminButton, AdminCard } from '../components/primitives';
import { StatusPill } from '../components/StatusPill';
import type { AdminCustomWordListSummary, AdminRepository } from '../repositories';
import { formatAdminDate } from '../utils/dateFormat';

export function CustomListsPage({ repository }: { repository: AdminRepository }) {
  const [lists, setLists] = useState<AdminCustomWordListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  async function load() {
    setLoading(true);
    try {
      setLists(await repository.listCustomWordLists());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, [repository]);

  async function cleanupExpired() {
    const deleted = await repository.cleanupExpiredCustomWordLists();
    setStatus(`Cleaned up ${deleted} expired custom list${deleted === 1 ? '' : 's'}.`);
    await load();
  }

  return (
    <>
      <AdminPageHeader
        title="Custom Lists"
        description="Temporary custom spelling lists created through the public preview flow."
        actions={(
          <div className="flex gap-2">
            <AdminButton variant="secondary" onClick={() => load()}>
              <RefreshCcw size={16} />
              Refresh
            </AdminButton>
            <AdminButton variant="secondary" onClick={cleanupExpired}>
              <Trash2 size={16} />
              Cleanup expired
            </AdminButton>
          </div>
        )}
      />
      {status && <div className="mb-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">{status}</div>}
      <AdminCard className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-black tracking-[-0.02em]">Recent custom lists</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[.12em] text-slate-500">
              <tr>
                <th className="px-5 py-3">Public ID</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Expires</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Moderation</th>
                <th className="px-5 py-3">Words</th>
                <th className="px-5 py-3">Audio</th>
                <th className="px-5 py-3">Share URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td className="px-5 py-5 text-slate-500" colSpan={8}>Loading custom lists...</td>
                </tr>
              )}
              {!loading && lists.length === 0 && (
                <tr>
                  <td className="px-5 py-5 text-slate-500" colSpan={8}>No custom lists yet.</td>
                </tr>
              )}
              {!loading && lists.map(list => (
                <tr key={list.id}>
                  <td className="px-5 py-4 font-mono text-xs text-slate-700">{list.publicId}</td>
                  <td className="px-5 py-4 text-slate-600">{formatAdminDate(list.createdAt)}</td>
                  <td className="px-5 py-4 text-slate-600">{formatAdminDate(list.expiresAt)}</td>
                  <td className="px-5 py-4"><StatusPill tone={list.status === 'ready' ? 'green' : list.status === 'rejected' ? 'red' : 'slate'}>{list.status}</StatusPill></td>
                  <td className="px-5 py-4"><StatusPill tone={list.moderationStatus === 'pass' ? 'green' : 'red'}>{list.moderationStatus}</StatusPill></td>
                  <td className="px-5 py-4 font-bold text-slate-900">{list.wordCount}</td>
                  <td className="px-5 py-4 text-slate-600">{list.audioReady} ready{list.audioFailed ? `, ${list.audioFailed} failed` : ''}</td>
                  <td className="px-5 py-4">
                    <a className="inline-flex max-w-[260px] items-center gap-2 truncate font-bold text-red-700" href={list.shareUrl} target="_blank" rel="noreferrer">
                      <span className="truncate">{list.shareUrl}</span>
                      <ExternalLink size={14} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </>
  );
}
