import type { PracticeWord, WordList } from '../../data/wordLists';
import type { SpelioStorage } from './storage';
import { hasDifficultWords } from './sessionEngine';
import { getSelectedListLabel, getSelectedLists } from './wordListSelection';

export type Recommendation = {
  kind: 'list' | 'review';
  listId?: string;
  title: string;
  subtitle: string;
};

function findList(lists: WordList[], id?: string | null) {
  return id ? lists.find(list => list.id === id) : undefined;
}

function asListRecommendation(list: WordList): Recommendation {
  return { kind: 'list', listId: list.id, title: 'Continue learning', subtitle: list.name };
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

export function getRecommendation(storage: SpelioStorage, lists: WordList[]): Recommendation {
  const difficultWordsExist = hasDifficultWords(storage, lists);
  const selectedLists = getSelectedLists(storage.selectedListIds, lists);

  if (selectedLists.length > 1) {
    if (difficultWordsExist) {
      return {
        kind: 'review',
        title: 'Review difficult words',
        subtitle: 'From your mixed selection'
      };
    }

    if (mixedSelectionIsComplete(storage, selectedLists)) {
      return {
        kind: 'list',
        title: 'Practise again',
        subtitle: 'You’ve completed this mixed selection'
      };
    }

    return {
      kind: 'list',
      title: 'Continue mixed practice',
      subtitle: getSelectedListLabel(storage.selectedListIds, lists)
    };
  }

  if (storage.lastSessionResult?.state === 'struggled' && difficultWordsExist) {
    return {
      kind: 'review',
      listId: selectedLists.length === 1 ? selectedLists[0].id : undefined,
      title: 'Review difficult words',
      subtitle: 'Based on your last session'
    };
  }

  const current = findList(lists, storage.currentPathPosition) ?? findList(lists, storage.selectedListIds[0]);
  if (current) {
    const currentProgress = storage.listProgress[current.id];
    const nextList = findList(lists, current.nextListId);

    if (currentProgress?.completed === true && nextList && wasJustPractised(storage, current.id)) {
      return asListRecommendation(nextList);
    }

    return asListRecommendation(current);
  }

  const fallback = lists[0];
  return {
    kind: 'list',
    listId: fallback?.id,
    title: 'Continue learning',
    subtitle: fallback?.name ?? 'Select a word list'
  };
}
