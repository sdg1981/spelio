import type { AdminWordList } from '../types';
import { isValidWordListSlug, slugifyWordListName } from '../../lib/wordListSharing';

export function createAdminWordListSlug(name: string, existingLists: Pick<AdminWordList, 'id' | 'slug' | 'isActive'>[] = []) {
  const baseSlug = slugifyWordListName(name);
  const activeSlugs = new Set(existingLists.filter(list => list.isActive).map(list => list.slug));
  if (!activeSlugs.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (activeSlugs.has(`${baseSlug}-${suffix}`)) suffix += 1;
  return `${baseSlug}-${suffix}`;
}

export function validateAdminWordListSlug(
  slug: string,
  lists: Pick<AdminWordList, 'id' | 'slug' | 'isActive'>[],
  currentListId: string
) {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return 'Enter a public URL slug.';
  if (normalizedSlug !== slug) return 'Slug cannot have leading or trailing spaces.';
  if (!isValidWordListSlug(normalizedSlug)) {
    return 'Use lowercase letters, numbers, and hyphens only. Do not start or end with a hyphen.';
  }

  const duplicate = lists.find(list => list.id !== currentListId && list.isActive && list.slug === normalizedSlug);
  if (duplicate) return `Slug is already used by "${duplicate.id}".`;
  return '';
}
