import type { DialectPreference, PracticeWord, WordList } from '../../data/wordLists';
import type { SessionResult, SessionState, SpelioStorage } from './storage';

export interface SessionWord extends PracticeWord {}

export interface PracticeSession {
  words: SessionWord[];
  listIds: string[];
}

const SESSION_TARGET = 10;

function scoreWord(word: PracticeWord, storage: SpelioStorage) {
  const progress = storage.wordProgress[word.id];
  if (!progress?.seen) return 0;
  if (progress.incorrectAttempts > 0) return 1;
  if (progress.revealedCount > 0) return 2;
  if (!progress.completedCount) return 3;
  return 10 + progress.completedCount;
}

function selectSessionWords(pool: PracticeWord[], listIds: string[], storage: SpelioStorage) {
  const byList = new Map<string, PracticeWord[]>();

  for (const word of pool) {
    byList.set(word.listId, [...(byList.get(word.listId) ?? []), word]);
  }

  for (const [listId, words] of byList) {
    byList.set(
      listId,
      [...words].sort((a, b) => scoreWord(a, storage) - scoreWord(b, storage) || a.order - b.order)
    );
  }

  const orderedListIds = [
    ...listIds.filter(id => byList.has(id)),
    ...Array.from(byList.keys()).filter(id => !listIds.includes(id)).sort()
  ];
  const words: PracticeWord[] = [];

  while (words.length < SESSION_TARGET && orderedListIds.some(id => (byList.get(id)?.length ?? 0) > 0)) {
    for (const listId of orderedListIds) {
      const nextWord = byList.get(listId)?.shift();
      if (!nextWord) continue;

      words.push(nextWord);
      if (words.length >= SESSION_TARGET) break;
    }
  }

  return words;
}

function dialectRank(word: PracticeWord, preference: DialectPreference) {
  if (preference === 'north') {
    if (word.dialect === 'North Wales') return 0;
    if (word.dialect === 'Both') return 1;
    return 2;
  }

  if (preference === 'south_standard') {
    if (word.dialect === 'South Wales / Standard' || word.dialect === 'Standard') return 0;
    if (word.dialect === 'Both') return 1;
    return 2;
  }

  return 0;
}

function mixedVariantRank(word: PracticeWord, storage?: SpelioStorage) {
  const progress = storage?.wordProgress[word.id];
  if (!progress?.seen) return 0;
  if (progress.incorrectAttempts > 0 || progress.revealedCount > 0) return 1;
  if (!progress.completedCount) return 2;
  return 3 + progress.completedCount;
}

function variantProgressScore(word: PracticeWord, storage?: SpelioStorage) {
  return storage ? scoreWord(word, storage) : word.order;
}

function isNorthVariant(word: PracticeWord) {
  return word.dialect === 'North Wales';
}

function isSouthStandardVariant(word: PracticeWord) {
  return word.dialect === 'South Wales / Standard' || word.dialect === 'Standard';
}

function mixedStartOffset(groups: PracticeWord[][], storage?: SpelioStorage) {
  if (!storage) return 0;

  const seenVariantCount = groups.flat().filter(word => storage.wordProgress[word.id]?.seen).length;
  return seenVariantCount % 2;
}

function chooseMixedVariant(group: PracticeWord[], groupIndex: number, startOffset: number, storage?: SpelioStorage): PracticeWord {
  const fallback = group[0] as PracticeWord;
  const preferNorth = (groupIndex + startOffset) % 2 === 1;
  const preferred = group.filter(word => preferNorth ? isNorthVariant(word) : isSouthStandardVariant(word));
  const candidates = preferred.length ? preferred : group;
  const chosen = [...candidates].sort((a, b) => (
    mixedVariantRank(a, storage) - mixedVariantRank(b, storage) ||
    variantProgressScore(a, storage) - variantProgressScore(b, storage) ||
    a.order - b.order
  ))[0];

  return chosen ?? fallback;
}

function chooseVariant(group: PracticeWord[], preference: DialectPreference, storage?: SpelioStorage): PracticeWord {
  const fallback = group[0] as PracticeWord;
  const chosen = [...group].sort((a, b) => {
    return dialectRank(a, preference) - dialectRank(b, preference) || variantProgressScore(a, storage) - variantProgressScore(b, storage) || a.order - b.order;
  })[0];

  return chosen ?? fallback;
}

export function filterDialectVariants(words: PracticeWord[], preference: DialectPreference, storage?: SpelioStorage) {
  const grouped = new Map<string, PracticeWord[]>();
  const ungrouped: PracticeWord[] = [];

  for (const word of words) {
    const groupId = word.variantGroupId?.trim();
    if (!groupId) {
      ungrouped.push(word);
      continue;
    }
    grouped.set(groupId, [...(grouped.get(groupId) ?? []), word]);
  }

  const groups = Array.from(grouped.values());
  const startOffset = preference === 'mixed' ? mixedStartOffset(groups, storage) : 0;
  const chosen = groups.map((group, index) => (
    preference === 'mixed'
      ? chooseMixedVariant(group, index, startOffset, storage)
      : chooseVariant(group, preference, storage)
  ));

  return [...ungrouped, ...chosen].sort((a, b) => a.order - b.order);
}

export function createPracticeSession(lists: WordList[], storage: SpelioStorage, reviewDifficult = false): PracticeSession {
  const selectedIds = storage.selectedListIds.length ? storage.selectedListIds : [lists[0]?.id].filter(Boolean) as string[];
  const eligibleLists = reviewDifficult
    ? lists.filter(list => list.isActive)
    : lists.filter(list => selectedIds.includes(list.id) && list.isActive);
  const allCandidates = eligibleLists.flatMap(list => list.words);
  const dialectResolvedCandidates = filterDialectVariants(allCandidates, storage.settings.dialectPreference, storage);

  const reviewWords = allCandidates.filter(word => {
    const progress = storage.wordProgress[word.id];
    return progress?.difficult === true;
  });

  const pool = reviewDifficult
    ? filterDialectVariants(reviewWords, storage.settings.dialectPreference, storage)
    : dialectResolvedCandidates;
  const words = selectSessionWords(pool, eligibleLists.map(list => list.id), storage);

  return {
    words,
    listIds: Array.from(new Set(words.map(word => word.listId)))
  };
}

export function classifySession(base: Pick<SessionResult, 'correctWords' | 'totalWords' | 'incorrectAttempts' | 'revealedLetters'>): SessionState {
  const accuracy = base.totalWords ? base.correctWords / base.totalWords : 0;

  if (base.incorrectAttempts > 0 || base.revealedLetters > 0) return 'struggled';
  if (accuracy >= 0.9) return 'strong';
  if (accuracy >= 0.75 && accuracy < 0.9) return 'good';
  if (accuracy < 0.75) return 'struggled';
  return 'good';
}

export function hasDifficultWords(storage: SpelioStorage) {
  return Object.values(storage.wordProgress).some(progress => progress.difficult === true);
}
