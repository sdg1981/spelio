import type { WordList } from '../data/wordLists';
import type { SpelioStorage } from './practice/storage';

export const WORD_LIST_ROUTE_PREFIX = '/list/';
export const PRACTICE_TEST_MODE = 'practice-test';

export function slugifyWordListName(value: string) {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || 'word-list';
}

export function isValidWordListSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function getWordListSlug(list: Pick<WordList, 'name'> & { slug?: string | null }) {
  const storedSlug = list.slug?.trim().toLowerCase();
  return storedSlug && isValidWordListSlug(storedSlug) ? storedSlug : slugifyWordListName(list.name);
}

export function getWordListPath(list: Pick<WordList, 'name'> & { slug?: string | null }) {
  return `${WORD_LIST_ROUTE_PREFIX}${getWordListSlug(list)}`;
}

export function getWordListCanonicalUrl(
  list: Pick<WordList, 'name'> & { slug?: string | null },
  origin?: string,
  options: { practiceTest?: boolean } = {}
) {
  const baseOrigin = (origin ?? (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
  return `${baseOrigin}${getWordListPath(list)}${options.practiceTest ? `?mode=${PRACTICE_TEST_MODE}` : ''}`;
}

export function getSharedWordListSlugFromPath(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, '');
  if (!normalizedPath.startsWith(WORD_LIST_ROUTE_PREFIX)) return null;
  const slug = normalizedPath.slice(WORD_LIST_ROUTE_PREFIX.length);
  if (!slug || slug.includes('/')) return null;

  try {
    const decodedSlug = decodeURIComponent(slug).toLowerCase();
    return isValidWordListSlug(decodedSlug) ? decodedSlug : null;
  } catch {
    return null;
  }
}

export function findActiveWordListBySlug(lists: WordList[], slug: string | null) {
  if (!slug || !isValidWordListSlug(slug)) return null;
  return lists.find(list => list.isActive && getWordListSlug(list) === slug) ?? null;
}

export function isPracticeTestShareMode(search: string) {
  try {
    return new URLSearchParams(search).get('mode') === PRACTICE_TEST_MODE;
  } catch {
    return false;
  }
}

export function applySharedWordListSelection(storage: SpelioStorage, list: WordList): SpelioStorage {
  return {
    ...storage,
    selectedListIds: [list.id],
    currentPathPosition: list.id,
    lastSessionResult: null
  };
}

export function shouldShowSelectedListShareAction(rowListId: string, selectedListId: string | undefined) {
  return Boolean(selectedListId) && rowListId === selectedListId;
}
