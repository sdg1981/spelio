import type { WordList } from '../../data/wordLists';
import type { SpelioStorage } from './storage';
import { hasDifficultWords } from './sessionEngine';

export type Recommendation = {
  kind: 'list' | 'review';
  listId?: string;
  title: string;
  subtitle: string;
};

function findList(lists: WordList[], id?: string | null) {
  return id ? lists.find(list => list.id === id) : undefined;
}

function firstIncomplete(lists: WordList[], storage: SpelioStorage) {
  return lists.find(list => !storage.listProgress[list.id]?.completed) ?? lists[0];
}

export function getRecommendation(storage: SpelioStorage, lists: WordList[]): Recommendation {
  if (storage.lastSessionResult?.state === 'struggled' && hasDifficultWords(storage)) {
    return {
      kind: 'review',
      listId: storage.currentPathPosition ?? storage.selectedListIds[0] ?? lists[0]?.id,
      title: 'Review difficult words',
      subtitle: 'Based on your last session'
    };
  }

  const current = findList(lists, storage.currentPathPosition) ?? findList(lists, storage.selectedListIds[0]);
  if (current && !storage.listProgress[current.id]?.completed) {
    return { kind: 'list', listId: current.id, title: 'Continue learning', subtitle: current.name };
  }

  const next = findList(lists, current?.nextListId);
  if (next) return { kind: 'list', listId: next.id, title: 'Continue learning', subtitle: next.name };

  const fallback = firstIncomplete(lists, storage);
  return {
    kind: 'list',
    listId: fallback?.id,
    title: 'Continue learning',
    subtitle: fallback?.name ?? 'Select a word list'
  };
}
