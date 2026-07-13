import type { WordList } from '../../data/wordLists';
import {
  WELSH_FOUNDATIONS_COLLECTION_ID,
  compareWordListsForCatalogue,
  getListDisplayName
} from './wordListDisplay';
import type { InterfaceLanguage } from '../../i18n';
import { normalizeSingleSelectedListIds, selectSingleWordList } from './wordListSelection';

export function isWelshFoundationsJourneyList(list: WordList) {
  return list.collectionId === WELSH_FOUNDATIONS_COLLECTION_ID ||
    list.collection?.id === WELSH_FOUNDATIONS_COLLECTION_ID ||
    list.stageId === 'foundations' ||
    list.stage.trim().toLowerCase() === 'foundations';
}

function getOrderedFoundationsLists(lists: WordList[], interfaceLanguage: InterfaceLanguage) {
  return lists
    .filter(list => isWelshFoundationsJourneyList(list) && list.isActive && list.words.length > 0)
    .sort((left, right) => (
      left.order - right.order ||
      getListDisplayName(left, interfaceLanguage).localeCompare(getListDisplayName(right, interfaceLanguage))
    ));
}

function findNextIncompleteFoundationsList(
  lists: WordList[],
  completedIds: ReadonlySet<string>,
  current?: WordList
) {
  if (!current) return undefined;
  const activeById = new Map(lists.map(list => [list.id, list]));
  const visited = new Set([current.id]);
  let nextListId = current.nextListId;

  while (nextListId) {
    if (visited.has(nextListId)) break;
    visited.add(nextListId);

    const next = activeById.get(nextListId);
    if (!next) break;
    if (!completedIds.has(next.id)) return next;

    nextListId = next.nextListId;
  }

  const orderedLists = [...lists].sort((left, right) => compareWordListsForCatalogue(left, right));
  const currentIndex = orderedLists.findIndex(list => list.id === current.id);
  if (currentIndex >= 0) {
    const nextByOrder = orderedLists.slice(currentIndex + 1).find(list => !completedIds.has(list.id));
    if (nextByOrder) return nextByOrder;
  }

  return orderedLists.find(list => !completedIds.has(list.id)) ?? current;
}

export function getWelshFoundationsJourneyDefaultList(
  lists: WordList[],
  selectedListId: string | undefined,
  completedIds: ReadonlySet<string>,
  inProgressIds: ReadonlySet<string>,
  interfaceLanguage: InterfaceLanguage
) {
  const foundationsLists = getOrderedFoundationsLists(lists, interfaceLanguage);
  const selectedFoundationList = selectedListId
    ? foundationsLists.find(list => list.id === selectedListId)
    : undefined;
  const anchor = selectedFoundationList ??
    foundationsLists.find(list => inProgressIds.has(list.id) && !completedIds.has(list.id)) ??
    foundationsLists.find(list => !completedIds.has(list.id)) ??
    foundationsLists[0];

  if (!anchor || !completedIds.has(anchor.id)) return anchor;
  return findNextIncompleteFoundationsList(foundationsLists, completedIds, anchor) ?? anchor;
}

export function getInitialWordListPageSelection(
  lists: WordList[],
  initialSelectedIds: string[],
  completedIds: ReadonlySet<string>,
  inProgressIds: ReadonlySet<string>,
  interfaceLanguage: InterfaceLanguage
) {
  const normalizedSelection = normalizeSingleSelectedListIds(initialSelectedIds, lists);
  const defaultJourneyList = getWelshFoundationsJourneyDefaultList(
    lists,
    normalizedSelection[0],
    completedIds,
    inProgressIds,
    interfaceLanguage
  );

  return defaultJourneyList ? selectSingleWordList(defaultJourneyList.id) : normalizedSelection;
}

export function getPendingWelshFoundationsJourneyList(
  lists: WordList[],
  selectedListId: string | undefined,
  completedIds: ReadonlySet<string>,
  inProgressIds: ReadonlySet<string>,
  interfaceLanguage: InterfaceLanguage
) {
  const selectedFoundationList = selectedListId
    ? lists.find(list => list.id === selectedListId && isWelshFoundationsJourneyList(list) && list.isActive && list.words.length > 0)
    : undefined;

  return selectedFoundationList ?? getWelshFoundationsJourneyDefaultList(
    lists,
    selectedListId,
    completedIds,
    inProgressIds,
    interfaceLanguage
  );
}
