import type { PracticeWord, WordList } from '../../data/wordLists';
import type { InterfaceLanguage, Translate } from '../../i18n';
import type { SpelioStorage } from './storage';
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

function dialectMatchesPreference(word: PracticeWord, storage: SpelioStorage) {
  const preference = storage.settings.dialectPreference;
  if (preference === 'mixed') return true;
  if (word.dialect === 'Both') return true;
  if (preference === 'north') return word.dialect === 'North Wales';
  return word.dialect === 'South Wales / Standard' || word.dialect === 'Standard';
}

function asListRecommendation(list: WordList, t?: Translate, interfaceLanguage?: InterfaceLanguage): Recommendation {
  return { kind: 'list', listId: list.id, title: t ? t('home.continueLearning') : 'Continue learning', subtitle: getListDisplayName(list, interfaceLanguage) };
}

function wasJustPractised(storage: SpelioStorage, listId: string) {
  return storage.lastSessionResult?.listIds.includes(listId) === true;
}

function groupLearningItems(words: PracticeWord[]) {
  const byGroup = new Map<string, PracticeWord[]>();
  const items: PracticeWord[][] = [];

  for (const word of words) {
    const groupId = word.variantGroupId?.trim();
    if (!groupId) {
      items.push([word]);
      continue;
    }
    byGroup.set(groupId, [...(byGroup.get(groupId) ?? []), word]);
  }

  return [...items, ...Array.from(byGroup.values())];
}

export function isListProgressionReady(storage: SpelioStorage, list: WordList) {
  const items = groupLearningItems(list.words.filter(word => dialectMatchesPreference(word, storage)));

  return items.length > 0 && items.every(group => {
    return group.some(word => {
      const progress = storage.wordProgress[word.id];
      return progress?.seen === true;
    });
  });
}

function listHasUnseenLearningItems(storage: SpelioStorage, list: WordList) {
  return !isListProgressionReady(storage, list);
}

function findNextUnfinishedList(storage: SpelioStorage, lists: WordList[], current: WordList) {
  const activeLists = lists.filter(list => list.isActive);
  const incompleteLists = activeLists.filter(list => listHasUnseenLearningItems(storage, list));
  const nextList = findList(activeLists, current.nextListId);

  if (nextList && listHasUnseenLearningItems(storage, nextList)) return nextList;

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
    const leftSeenCount = left.words.filter(word => storage.wordProgress[word.id]?.seen).length;
    const rightSeenCount = right.words.filter(word => storage.wordProgress[word.id]?.seen).length;
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
