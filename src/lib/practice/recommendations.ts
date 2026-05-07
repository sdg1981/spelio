import type { PracticeWord, WordList } from '../../data/wordLists';
import type { InterfaceLanguage, Translate } from '../../i18n';
import type { SpelioStorage } from './storage';
import { hasDifficultWords } from './sessionEngine';
import { getListDisplayName } from './wordListDisplay';
import { getSelectedListLabel, getSelectedLists } from './wordListSelection';

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

function mixedSelectionIsComplete(storage: SpelioStorage, selectedLists: WordList[]) {
  const items = groupLearningItems(selectedLists.filter(list => list.isActive).flatMap(list => list.words));

  return items.length > 0 && items.every(group => {
    return group.some(word => {
      const progress = storage.wordProgress[word.id];
      return progress?.seen === true && progress.completedCount > 0;
    });
  });
}

export function getRecommendation(storage: SpelioStorage, lists: WordList[], t?: Translate, interfaceLanguage?: InterfaceLanguage): Recommendation {
  const difficultWordsExist = hasDifficultWords(storage, lists);
  const selectedLists = getSelectedLists(storage.selectedListIds, lists);

  if (selectedLists.length > 1) {
    if (difficultWordsExist) {
      return {
        kind: 'review',
        title: t ? t('home.reviewDifficult') : 'Review difficult words',
        subtitle: t ? t('home.fromMixedSelection') : 'From your mixed selection'
      };
    }

    if (mixedSelectionIsComplete(storage, selectedLists)) {
      return {
        kind: 'choose_list',
        title: t ? t('home.chooseAnotherList') : 'Choose another word list',
        subtitle: t ? t('home.mixedSelectionComplete') : 'You’ve completed this mixed selection'
      };
    }

    return {
      kind: 'list',
      title: t ? t('home.continueMixedPractice') : 'Continue mixed practice',
      subtitle: getSelectedListLabel(storage.selectedListIds, lists, t, interfaceLanguage)
    };
  }

  if (storage.lastSessionResult?.state === 'struggled' && difficultWordsExist) {
    return {
      kind: 'review',
      listId: selectedLists.length === 1 ? selectedLists[0].id : undefined,
      title: t ? t('home.reviewDifficult') : 'Review difficult words',
      subtitle: t ? t('home.basedOnLastSession') : 'Based on your last session'
    };
  }

  const current = findList(lists, storage.currentPathPosition) ?? findList(lists, storage.selectedListIds[0]);
  if (current) {
    const currentProgress = storage.listProgress[current.id];
    const nextList = findList(lists, current.nextListId);

    if (currentProgress?.completed === true && nextList && wasJustPractised(storage, current.id)) {
      return asListRecommendation(nextList, t, interfaceLanguage);
    }

    return asListRecommendation(current, t, interfaceLanguage);
  }

  const fallback = lists[0];
  return {
    kind: 'list',
    listId: fallback?.id,
    title: t ? t('home.continueLearning') : 'Continue learning',
    subtitle: fallback ? getListDisplayName(fallback, interfaceLanguage) : (t ? t('home.selectWordList') : 'Select a word list')
  };
}
