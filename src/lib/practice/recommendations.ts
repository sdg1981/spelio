import type { WordList } from '../../data/wordLists';
import { mainWordLists } from '../../data/supportWordLists';
import type { InterfaceLanguage, Translate } from '../../i18n';
import type { SpelioStorage } from './storage';
import { isListFullyComplete } from './storage';
import { groupLearningItems, isLearningItemSeen } from './learningItems';
import { hasDifficultWords } from './sessionEngine';
import { compareWordListsForProgression, getListDisplayName } from './wordListDisplay';
import { normalizeSingleSelectedListIds, getSelectedLists } from './wordListSelection';

export type Recommendation = {
  kind: 'list' | 'review' | 'choose_list';
  listId?: string;
  title: string;
  subtitle: string;
};

function findList(lists: WordList[], id?: string | null) {
  return id ? lists.find(list => list.id === id) : undefined;
}

function asListRecommendation(list: WordList, t?: Translate, interfaceLanguage?: InterfaceLanguage): Recommendation {
  return { kind: 'list', listId: list.id, title: t ? t('home.continueLearning') : 'Continue learning', subtitle: getListDisplayName(list, interfaceLanguage) };
}

function isPracticeEligibleList(list: WordList) {
  return list.isActive && list.words.length > 0;
}

function wasJustPractised(storage: SpelioStorage, listId: string) {
  return storage.lastSessionResult?.listIds.includes(listId) === true;
}

export function isListProgressionComplete(storage: SpelioStorage, list: WordList) {
  const items = groupLearningItems(list.words);
  return items.length > 0 && items.every(group => isLearningItemSeen(storage, group));
}

export function isListProgressionReady(storage: SpelioStorage, list: WordList) {
  return isListProgressionComplete(storage, list);
}

function listHasUnseenLearningItems(storage: SpelioStorage, list: WordList) {
  return !isListProgressionComplete(storage, list);
}

export function isListFullyCompleteForTick(storage: SpelioStorage, list: WordList) {
  return isListFullyComplete(storage, list);
}

export function isListFullyCompletedForRecommendation(storage: SpelioStorage, list: WordList) {
  return isListFullyCompleteForTick(storage, list);
}

export function findNextSequentialRecommendationList(storage: SpelioStorage, lists: WordList[], current: WordList) {
  const activeLists = mainWordLists(lists).filter(isPracticeEligibleList);
  const visited = new Set([current.id]);
  let nextListId = current.nextListId;

  while (nextListId) {
    if (visited.has(nextListId)) return undefined;
    visited.add(nextListId);

    const next = findList(activeLists, nextListId);
    if (!next) return undefined;
    if (!isListFullyCompleteForTick(storage, next)) return next;

    nextListId = next.nextListId;
  }

  return undefined;
}

function findNextUnfinishedList(storage: SpelioStorage, lists: WordList[], current: WordList) {
  const activeLists = mainWordLists(lists).filter(isPracticeEligibleList);
  const sequentialNext = findNextSequentialRecommendationList(storage, activeLists, current);
  if (sequentialNext) return sequentialNext;

  const incompleteLists = activeLists.filter(list => listHasUnseenLearningItems(storage, list));
  const orderedLists = sortListsByCollectionProgression(activeLists);
  const orderedIndexById = new Map(orderedLists.map((list, index) => [list.id, index]));
  const incompleteListIds = new Set(incompleteLists.map(list => list.id));
  const currentIndex = orderedLists.findIndex(list => list.id === current.id);
  const orderedIncompleteLists = orderedLists.filter(list => incompleteListIds.has(list.id));

  if (currentIndex >= 0) {
    const nextByCollectionOrder = orderedIncompleteLists.find(list => (orderedIndexById.get(list.id) ?? -1) > currentIndex);
    if (nextByCollectionOrder) return nextByCollectionOrder;
  }

  return orderedIncompleteLists[0];
}

function compareListsByCollectionProgression(left: WordList, right: WordList) {
  const leftCollection = left.collection;
  const rightCollection = right.collection;
  const leftCollectionOrder = Number.isFinite(leftCollection?.order) ? Number(leftCollection?.order) : Number.POSITIVE_INFINITY;
  const rightCollectionOrder = Number.isFinite(rightCollection?.order) ? Number(rightCollection?.order) : Number.POSITIVE_INFINITY;
  const leftCollectionName = leftCollection?.name ?? left.collectionId;
  const rightCollectionName = rightCollection?.name ?? right.collectionId;

  return leftCollectionOrder - rightCollectionOrder ||
    leftCollectionName.localeCompare(rightCollectionName) ||
    left.collectionId.localeCompare(right.collectionId) ||
    compareWordListsForProgression(left, right);
}

function sortListsByCollectionProgression(lists: WordList[]) {
  return [...lists].sort(compareListsByCollectionProgression);
}

export function getNormalContinuationRecommendation(storage: SpelioStorage, lists: WordList[], t?: Translate, interfaceLanguage?: InterfaceLanguage): Recommendation {
  const recommendationLists = mainWordLists(lists);
  const selectedListIds = normalizeSingleSelectedListIds(storage.selectedListIds, recommendationLists);
  const current = findList(recommendationLists, storage.currentPathPosition) ?? findList(recommendationLists, selectedListIds[0]);
  if (current) {
    if (!isListProgressionComplete(storage, current)) {
      return asListRecommendation(current, t, interfaceLanguage);
    }

    if (!storage.lastSessionResult || (!wasJustPractised(storage, current.id) && !isListFullyCompleteForTick(storage, current))) {
      return asListRecommendation(current, t, interfaceLanguage);
    }

    const next = findNextUnfinishedList(storage, recommendationLists, current);
    if (next) return asListRecommendation(next, t, interfaceLanguage);

    return asListRecommendation(current, t, interfaceLanguage);
  }

  const fallback = recommendationLists.find(isPracticeEligibleList) ?? recommendationLists[0];
  return {
    kind: 'list',
    listId: fallback?.id,
    title: t ? t('home.continueLearning') : 'Continue learning',
    subtitle: fallback ? getListDisplayName(fallback, interfaceLanguage) : (t ? t('home.selectWordList') : 'Select a word list')
  };
}

export function getRecommendation(storage: SpelioStorage, lists: WordList[], t?: Translate, interfaceLanguage?: InterfaceLanguage): Recommendation {
  const recommendationLists = mainWordLists(lists);
  const difficultWordsExist = hasDifficultWords(storage, recommendationLists);
  const selectedLists = getSelectedLists(normalizeSingleSelectedListIds(storage.selectedListIds, recommendationLists), recommendationLists);

  if (difficultWordsExist) {
    return {
      kind: 'review',
      listId: selectedLists.length === 1 ? selectedLists[0].id : undefined,
      title: t ? t('home.reviewDifficult') : 'Review difficult words',
      subtitle: t ? t('home.currentDifficultWords') : 'Your current difficult words'
    };
  }

  return getNormalContinuationRecommendation(storage, recommendationLists, t, interfaceLanguage);
}
