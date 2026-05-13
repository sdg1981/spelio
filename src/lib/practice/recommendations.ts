import type { WordList } from '../../data/wordLists';
import type { InterfaceLanguage, Translate } from '../../i18n';
import type { SpelioStorage } from './storage';
import { isListFullyComplete } from './storage';
import { groupLearningItems, isLearningItemSeen } from './learningItems';
import { hasDifficultWords } from './sessionEngine';
import { getListDisplayName } from './wordListDisplay';
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

function wasJustPractised(storage: SpelioStorage, listId: string) {
  return storage.lastSessionResult?.listIds.includes(listId) === true;
}

export function isListProgressionReady(storage: SpelioStorage, list: WordList) {
  const items = groupLearningItems(list.words);
  return items.length > 0 && items.every(group => isLearningItemSeen(storage, group));
}

function listHasUnseenLearningItems(storage: SpelioStorage, list: WordList) {
  return !isListProgressionReady(storage, list);
}

export function isListFullyCompletedForRecommendation(storage: SpelioStorage, list: WordList) {
  return isListFullyComplete(storage, list);
}

export function findNextSequentialRecommendationList(storage: SpelioStorage, lists: WordList[], current: WordList) {
  const activeLists = lists.filter(list => list.isActive);
  const visited = new Set([current.id]);
  let nextListId = current.nextListId;

  while (nextListId) {
    if (visited.has(nextListId)) return undefined;
    visited.add(nextListId);

    const next = findList(activeLists, nextListId);
    if (!next) return undefined;
    if (!isListFullyCompletedForRecommendation(storage, next)) return next;

    nextListId = next.nextListId;
  }

  return undefined;
}

function findNextUnfinishedList(storage: SpelioStorage, lists: WordList[], current: WordList) {
  const activeLists = lists.filter(list => list.isActive);
  const sequentialNext = findNextSequentialRecommendationList(storage, activeLists, current);
  if (sequentialNext) return sequentialNext;

  const incompleteLists = activeLists.filter(list => listHasUnseenLearningItems(storage, list));

  const currentStageNext = incompleteLists.find(list => {
    return list.stage === current.stage && list.order > current.order;
  });
  if (currentStageNext) return currentStageNext;

  const nextStageName = activeLists.find(list => list.order > current.order && list.stage !== current.stage)?.stage;
  const nextStageFirst = nextStageName
    ? incompleteLists.find(list => list.stage === nextStageName)
    : undefined;
  if (nextStageFirst) return nextStageFirst;

  return [...incompleteLists].sort((left, right) => {
    const leftSeenCount = groupLearningItems(left.words).filter(group => isLearningItemSeen(storage, group)).length;
    const rightSeenCount = groupLearningItems(right.words).filter(group => isLearningItemSeen(storage, group)).length;
    return leftSeenCount - rightSeenCount || left.order - right.order;
  })[0];
}

export function getNormalContinuationRecommendation(storage: SpelioStorage, lists: WordList[], t?: Translate, interfaceLanguage?: InterfaceLanguage): Recommendation {
  const selectedListIds = normalizeSingleSelectedListIds(storage.selectedListIds, lists);
  const current = findList(lists, storage.currentPathPosition) ?? findList(lists, selectedListIds[0]);
  if (current) {
    if (!isListProgressionReady(storage, current)) {
      return asListRecommendation(current, t, interfaceLanguage);
    }

    if (!wasJustPractised(storage, current.id)) {
      return asListRecommendation(current, t, interfaceLanguage);
    }

    const next = findNextUnfinishedList(storage, lists, current);
    if (next) return asListRecommendation(next, t, interfaceLanguage);

    return asListRecommendation(current, t, interfaceLanguage);
  }

  const fallback = lists.find(list => list.isActive) ?? lists[0];
  return {
    kind: 'list',
    listId: fallback?.id,
    title: t ? t('home.continueLearning') : 'Continue learning',
    subtitle: fallback ? getListDisplayName(fallback, interfaceLanguage) : (t ? t('home.selectWordList') : 'Select a word list')
  };
}

export function getRecommendation(storage: SpelioStorage, lists: WordList[], t?: Translate, interfaceLanguage?: InterfaceLanguage): Recommendation {
  const difficultWordsExist = hasDifficultWords(storage, lists);
  const selectedLists = getSelectedLists(normalizeSingleSelectedListIds(storage.selectedListIds, lists), lists);

  if (storage.lastSessionResult?.state === 'struggled' && difficultWordsExist) {
    return {
      kind: 'review',
      listId: selectedLists.length === 1 ? selectedLists[0].id : undefined,
      title: t ? t('home.reviewDifficult') : 'Review difficult words',
      subtitle: t ? t('home.basedOnLastSession') : 'Based on your last session'
    };
  }

  return getNormalContinuationRecommendation(storage, lists, t, interfaceLanguage);
}
