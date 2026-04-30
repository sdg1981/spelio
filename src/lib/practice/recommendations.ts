import type { WordList } from '../../data/wordLists';
import type { SpelioStorage } from './storage';
import { hasDifficultWords } from './sessionEngine';

export type RecommendationKind = 'review' | 'continue' | 'next-list';

export interface Recommendation {
  kind: RecommendationKind;
  title: string;
  subtitle?: string;
  listId?: string;
}

export function getCurrentList(storage: SpelioStorage, lists: WordList[]) {
  const selected = storage.currentPathPosition || storage.selectedListIds[0];
  return lists.find(list => list.id === selected) ?? lists[0];
}

export function getRecommendation(storage: SpelioStorage, lists: WordList[]): Recommendation {
  const current = getCurrentList(storage, lists);

  if (storage.lastSessionResult?.state === 'struggled' && hasDifficultWords(storage)) {
    return {
      kind: 'review',
      title: 'Review difficult words',
      subtitle: 'Based on your last session'
    };
  }

  if (current && !storage.listProgress[current.id]?.completed) {
    return {
      kind: 'continue',
      title: 'Continue learning',
      subtitle: current.name,
      listId: current.id
    };
  }

  const nextList = current?.nextListId ? lists.find(list => list.id === current.nextListId) : undefined;
  if (nextList) {
    return {
      kind: 'next-list',
      title: 'Continue learning',
      subtitle: nextList.name,
      listId: nextList.id
    };
  }

  const unfinishedInStage = lists.find(list => list.stage === current?.stage && !storage.listProgress[list.id]?.completed);
  if (unfinishedInStage) {
    return {
      kind: 'continue',
      title: 'Continue learning',
      subtitle: unfinishedInStage.name,
      listId: unfinishedInStage.id
    };
  }

  const unfinished = lists.find(list => !storage.listProgress[list.id]?.completed);
  if (unfinished) {
    return {
      kind: 'continue',
      title: 'Continue learning',
      subtitle: unfinished.name,
      listId: unfinished.id
    };
  }

  return {
    kind: 'continue',
    title: 'Continue learning',
    subtitle: current?.name,
    listId: current?.id
  };
}
