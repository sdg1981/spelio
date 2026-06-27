import type { AdminWordList } from '../types';

export function sortCollectionWordLists(lists: AdminWordList[], collectionId: string) {
  return lists
    .filter(list => list.collectionId === collectionId)
    .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name) || left.id.localeCompare(right.id));
}

export function moveItem<T>(items: T[], index: number, direction: 'up' | 'down') {
  const nextIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || index >= items.length || nextIndex >= items.length) return items;
  const next = [...items];
  const item = next[index];
  next[index] = next[nextIndex];
  next[nextIndex] = item;
  return next;
}

export function applyCollectionCatalogueOrder(lists: AdminWordList[], orderedIds: string[]) {
  const orderById = new Map(orderedIds.map((id, index) => [id, index + 1]));
  return lists.map(list => {
    const order = orderById.get(list.id);
    return order ? { ...list, order } : list;
  });
}

export function deriveInitialProgressionListIds(collectionLists: AdminWordList[], allLists: AdminWordList[]) {
  const collectionListIds = new Set(collectionLists.map(list => list.id));
  const included = new Set<string>();

  collectionLists.forEach(list => {
    if (!list.nextListId) return;
    included.add(list.id);
    if (collectionListIds.has(list.nextListId)) included.add(list.nextListId);
  });

  const incomingIds = new Set(
    allLists
      .filter(list => collectionListIds.has(list.nextListId ?? ''))
      .map(list => list.nextListId as string)
  );
  incomingIds.forEach(id => included.add(id));

  return collectionLists
    .filter(list => included.has(list.id))
    .map(list => list.id);
}

export function applyCollectionProgressionOrder(lists: AdminWordList[], collectionId: string, includedIds: string[]) {
  const listById = new Map(lists.map(list => [list.id, list]));
  const collectionListIds = new Set(lists.filter(list => list.collectionId === collectionId).map(list => list.id));
  const includedSet = new Set(includedIds);

  return lists.map(list => {
    if (list.collectionId !== collectionId) return list;

    const includedIndex = includedIds.indexOf(list.id);
    if (includedIndex >= 0) {
      const nextIncludedId = includedIds[includedIndex + 1];
      if (nextIncludedId) return { ...list, nextListId: nextIncludedId };

      const existingNextList = list.nextListId ? listById.get(list.nextListId) : undefined;
      const preservesCrossCollectionNext = existingNextList && existingNextList.collectionId !== collectionId;
      return { ...list, nextListId: preservesCrossCollectionNext ? list.nextListId : null };
    }

    const currentNextIsInCollection = list.nextListId ? collectionListIds.has(list.nextListId) : false;
    const currentNextWasIncluded = list.nextListId ? includedSet.has(list.nextListId) : false;
    if (currentNextIsInCollection || currentNextWasIncluded) return { ...list, nextListId: null };

    return list;
  });
}
