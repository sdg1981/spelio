import type { PracticeWord } from '../../data/wordLists';
import type { SpelioStorage } from './storage';

export function learningItemKey(word: PracticeWord) {
  const groupId = word.variantGroupId?.trim();
  return groupId ? `${word.listId}:${groupId}` : `${word.listId}:${word.id}`;
}

export function groupLearningItems(words: PracticeWord[]) {
  const byKey = new Map<string, PracticeWord[]>();
  const keys: string[] = [];

  for (const word of words) {
    const key = learningItemKey(word);
    if (!byKey.has(key)) {
      byKey.set(key, []);
      keys.push(key);
    }
    byKey.get(key)?.push(word);
  }

  return keys.map(key => byKey.get(key) ?? []).filter(group => group.length > 0);
}

export function isLearningItemSeen(storage: SpelioStorage, words: PracticeWord[]) {
  return words.some(word => storage.wordProgress[word.id]?.seen === true);
}

export function countUnseenLearningItems(storage: SpelioStorage, words: PracticeWord[]) {
  return groupLearningItems(words).filter(group => !isLearningItemSeen(storage, group)).length;
}
