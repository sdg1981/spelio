import { CUSTOM_LIST_TITLE } from './customListValidation';

const RECENT_CUSTOM_LISTS_STORAGE_KEY = 'spelio-recent-custom-lists';
const RECENT_CUSTOM_LISTS_LIMIT = 3;

export type RecentCustomListReference = {
  publicId: string;
  title: string;
  createdAt: string;
  expiresAt: string;
  shareUrl: string;
};

export { RECENT_CUSTOM_LISTS_STORAGE_KEY };

export function loadRecentCustomLists(storage: Pick<Storage, 'getItem'> | null | undefined = getBrowserStorage()): RecentCustomListReference[] {
  try {
    const raw = storage?.getItem(RECENT_CUSTOM_LISTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normaliseRecentCustomListReference)
      .filter((item): item is RecentCustomListReference => Boolean(item))
      .filter(item => !isRecentCustomListExpired(item))
      .slice(0, RECENT_CUSTOM_LISTS_LIMIT);
  } catch {
    return [];
  }
}

export function saveRecentCustomList(
  reference: RecentCustomListReference,
  storage: Pick<Storage, 'getItem' | 'setItem'> | null | undefined = getBrowserStorage()
) {
  if (!storage) return;
  const next = [
    normaliseRecentCustomListReference(reference),
    ...loadRecentCustomLists(storage).filter(item => item.publicId !== reference.publicId)
  ].filter((item): item is RecentCustomListReference => Boolean(item)).slice(0, RECENT_CUSTOM_LISTS_LIMIT);
  try {
    storage.setItem(RECENT_CUSTOM_LISTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Recent custom lists are a convenience only.
  }
}

export function removeRecentCustomList(
  publicId: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> | null | undefined = getBrowserStorage()
) {
  if (!storage) return;
  const next = loadRecentCustomLists(storage).filter(item => item.publicId !== publicId);
  try {
    storage.setItem(RECENT_CUSTOM_LISTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Recent custom lists are a convenience only.
  }
}

export function isRecentCustomListExpired(reference: Pick<RecentCustomListReference, 'expiresAt'>) {
  const expiresAt = new Date(reference.expiresAt).getTime();
  return Number.isFinite(expiresAt) && expiresAt <= Date.now();
}

function normaliseRecentCustomListReference(value: unknown): RecentCustomListReference | null {
  const row = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const publicId = typeof row.publicId === 'string' ? row.publicId.trim() : '';
  const title = typeof row.title === 'string' && row.title.trim() ? row.title.trim() : CUSTOM_LIST_TITLE;
  const createdAt = typeof row.createdAt === 'string' ? row.createdAt : '';
  const expiresAt = typeof row.expiresAt === 'string' ? row.expiresAt : '';
  const shareUrl = typeof row.shareUrl === 'string' ? row.shareUrl : '';
  if (!publicId || !expiresAt || !shareUrl) return null;
  return { publicId, title, createdAt, expiresAt, shareUrl };
}

function getBrowserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}
