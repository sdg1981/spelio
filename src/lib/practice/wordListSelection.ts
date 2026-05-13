import type { WordList } from '../../data/wordLists';
import type { InterfaceLanguage, Translate } from '../../i18n';
import type { SpelioStorage } from './storage';
import { getListDisplayName } from './wordListDisplay';

export function getSingleSelectedListId(selectedListIds: string[], lists: WordList[]) {
  const activeById = new Map(lists.filter(list => list.isActive).map(list => [list.id, list]));
  const selected = selectedListIds.find(id => activeById.has(id));
  return selected ?? lists.find(list => list.isActive)?.id ?? lists[0]?.id;
}

export function normalizeSingleSelectedListIds(selectedListIds: string[], lists: WordList[]) {
  const listId = getSingleSelectedListId(selectedListIds, lists);
  return listId ? [listId] : [];
}

export function selectSingleWordList(listId: string) {
  return listId ? [listId] : [];
}

export function normalizeStorageWordListSelection(storage: SpelioStorage, lists: WordList[]): SpelioStorage {
  const selectedListIds = normalizeSingleSelectedListIds(storage.selectedListIds, lists);
  const activeIds = new Set(lists.filter(list => list.isActive).map(list => list.id));
  const alreadySingleSelection =
    storage.selectedListIds.length === selectedListIds.length &&
    storage.selectedListIds.every((id, index) => id === selectedListIds[index]);
  const currentPathPosition = alreadySingleSelection && storage.currentPathPosition && activeIds.has(storage.currentPathPosition)
    ? storage.currentPathPosition
    : selectedListIds[0] ?? null;

  if (
    alreadySingleSelection &&
    storage.currentPathPosition === currentPathPosition
  ) {
    return storage;
  }

  return {
    ...storage,
    selectedListIds,
    currentPathPosition
  };
}

export function getSelectedLists(selectedListIds: string[], lists: WordList[]) {
  const byId = new Map(lists.map(list => [list.id, list]));
  return selectedListIds
    .map(id => byId.get(id))
    .filter((list): list is WordList => Boolean(list));
}

export function getSelectedListLabel(selectedListIds: string[], lists: WordList[], t?: Translate, interfaceLanguage?: InterfaceLanguage) {
  const selectedLists = getSelectedLists(normalizeSingleSelectedListIds(selectedListIds, lists), lists);

  if (selectedLists.length === 0) return t ? t('home.selectWordList') : 'Select a word list';
  return getListDisplayName(selectedLists[0], interfaceLanguage);
}
