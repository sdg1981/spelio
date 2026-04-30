import type { PracticeWord, WordList } from '../../data/wordLists';
import type { SpelioStorage, SessionResult } from './storage';

export interface SessionWord extends PracticeWord {
  sourceListName: string;
}

export interface PracticeSession {
  words: SessionWord[];
  listIds: string[];
  startedAt: number;
}

function scoreWord(word: PracticeWord, storage: SpelioStorage) {
  const progress = storage.wordProgress[word.id];
  if (!progress?.seen) return 0;
  if (progress.revealedCount > 0) return 1;
  if (progress.incorrectAttempts > 0) return 2;
  if (!progress.completedCount) return 3;
  return 10;
}

export function flattenWords(lists: WordList[], selectedListIds: string[]) {
  return lists
    .filter(list => selectedListIds.includes(list.id) && list.isActive)
    .flatMap(list => list.words.map(word => ({ ...word, sourceListName: list.name })));
}

export function createPracticeSession(lists: WordList[], storage: SpelioStorage, reviewDifficult = false): PracticeSession {
  const selectedIds = storage.selectedListIds.length ? storage.selectedListIds : lists.slice(0, 1).map(list => list.id);
  const sourceWords = flattenWords(lists, selectedIds);

  const ordered = [...sourceWords].sort((a, b) => {
    if (reviewDifficult) {
      const ap = storage.wordProgress[a.id];
      const bp = storage.wordProgress[b.id];
      const aDifficult = ap?.difficult ? 0 : 1;
      const bDifficult = bp?.difficult ? 0 : 1;
      if (aDifficult !== bDifficult) return aDifficult - bDifficult;
      const revealDiff = (bp?.revealedCount ?? 0) - (ap?.revealedCount ?? 0);
      if (revealDiff !== 0) return revealDiff;
      return (bp?.incorrectAttempts ?? 0) - (ap?.incorrectAttempts ?? 0);
    }

    const diff = scoreWord(a, storage) - scoreWord(b, storage);
    if (diff !== 0) return diff;
    return a.order - b.order;
  });

  const difficultOnly = reviewDifficult ? ordered.filter(word => storage.wordProgress[word.id]?.difficult) : ordered;

  return {
    words: difficultOnly.slice(0, 10),
    listIds: selectedIds,
    startedAt: Date.now()
  };
}

export function classifySession(result: Omit<SessionResult, 'state'>): SessionResult['state'] {
  const accuracy = result.correctWords / Math.max(result.totalWords, 1);
  const difficultyScore = result.incorrectAttempts + result.revealedLetters * 2;

  if (accuracy >= 0.9 && result.revealedLetters === 0) return 'strong';
  if (accuracy < 0.75 || result.revealedLetters > 0 || difficultyScore >= 3) return 'struggled';
  return 'good';
}

export function hasDifficultWords(storage: SpelioStorage) {
  return Object.values(storage.wordProgress).some(progress => progress.difficult);
}
