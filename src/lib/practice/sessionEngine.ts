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

function learningItemKey(word: PracticeWord) {
  const groupId = word.variantGroupId?.trim();
  return groupId ? `${word.listId}:${groupId}` : `${word.listId}:${word.id}`;
}

function scoreLearningItem(words: PracticeWord[], storage: SpelioStorage) {
  const progressItems = words
    .map(word => storage.wordProgress[word.id])
    .filter(Boolean);

  if (!progressItems.some(progress => progress.seen)) return 0;
  if (progressItems.some(progress => progress.difficult)) return 1;
  if (progressItems.some(progress => progress.incorrectAttempts > 0 || progress.revealedCount > 0)) return 2;

  const completedCounts = progressItems
    .map(progress => progress.completedCount)
    .filter(count => count > 0);

  if (!completedCounts.length) return 3;
  return 10 + Math.min(...completedCounts);
}

function getLearningItemScores(words: PracticeWord[], storage: SpelioStorage) {
  const byItem = new Map<string, PracticeWord[]>();
  const scores = new Map<string, number>();

  for (const word of words) {
    const key = learningItemKey(word);
    byItem.set(key, [...(byItem.get(key) ?? []), word]);
  }

  for (const [key, itemWords] of byItem) {
    scores.set(key, scoreLearningItem(itemWords, storage));
  }

  return scores;
}

function selectSessionWords(
  pool: PracticeWord[],
  listIds: string[],
  storage: SpelioStorage,
  score: (word: PracticeWord) => number = word => scoreWord(word, storage)
) {
  const byList = new Map<string, PracticeWord[]>();

  for (const word of pool) {
    byList.set(word.listId, [...(byList.get(word.listId) ?? []), word]);
  }

  for (const [listId, words] of byList) {
    byList.set(
      listId,
      [...words].sort((a, b) => score(a) - score(b) || a.order - b.order)
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

function isReviewEligibleForPreference(word: PracticeWord, preference: DialectPreference) {
  if (preference === 'mixed') return true;
  if (word.dialect === 'Both') return true;
  if (preference === 'north') return isNorthVariant(word);
  return isSouthStandardVariant(word);
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

function getTrackedCandidates(
  words: PracticeWord[],
  storage: SpelioStorage,
  isEligibleProgress: (word: PracticeWord) => boolean
) {
  const grouped = new Map<string, PracticeWord[]>();
  const candidates: PracticeWord[] = [];

  for (const word of words) {
    const eligible = isEligibleProgress(word) && isReviewEligibleForPreference(word, storage.settings.dialectPreference);
    const groupId = word.variantGroupId?.trim();
    if (!groupId) {
      if (eligible) candidates.push(word);
      continue;
    }
    if (eligible) grouped.set(groupId, [...(grouped.get(groupId) ?? []), word]);
  }

  for (const group of grouped.values()) {
    candidates.push(filterDialectVariants(group, storage.settings.dialectPreference, storage)[0] as PracticeWord);
  }

  return candidates.filter(Boolean);
}

function getReviewCandidates(words: PracticeWord[], storage: SpelioStorage) {
  return getTrackedCandidates(words, storage, word => {
    const progress = storage.wordProgress[word.id];
    return progress?.difficult === true;
  });
}

function getDifficultCandidates(words: PracticeWord[], storage: SpelioStorage) {
  return getTrackedCandidates(words, storage, word => storage.wordProgress[word.id]?.difficult === true);
}

export function getRecapCandidates(words: PracticeWord[], storage: SpelioStorage) {
  return getTrackedCandidates(words, storage, word => storage.wordProgress[word.id]?.recapDue === true)
    .sort((a, b) => {
      const leftProgress = storage.wordProgress[a.id];
      const rightProgress = storage.wordProgress[b.id];
      const leftDifficult = leftProgress?.difficult ? 0 : 1;
      const rightDifficult = rightProgress?.difficult ? 0 : 1;
      const leftPractised = leftProgress?.lastPractisedAt ?? '';
      const rightPractised = rightProgress?.lastPractisedAt ?? '';

      return leftDifficult - rightDifficult || rightPractised.localeCompare(leftPractised) || a.order - b.order;
    });
}

export function createPracticeSession(lists: WordList[], storage: SpelioStorage, reviewDifficult = false, includeRecapDue = false): PracticeSession {
  const selectedIds = storage.selectedListIds.length ? storage.selectedListIds : [lists[0]?.id].filter(Boolean) as string[];
  const eligibleLists = reviewDifficult
    ? lists.filter(list => list.isActive)
    : lists.filter(list => selectedIds.includes(list.id) && list.isActive);
  const allCandidates = eligibleLists.flatMap(list => list.words);
  const dialectResolvedCandidates = filterDialectVariants(allCandidates, storage.settings.dialectPreference, storage);

  const pool = reviewDifficult
    ? getReviewCandidates(allCandidates, storage)
    : dialectResolvedCandidates;
  const learningItemScores = reviewDifficult ? undefined : getLearningItemScores(allCandidates, storage);
  const words = selectSessionWords(
    pool,
    eligibleLists.map(list => list.id),
    storage,
    learningItemScores
      ? word => learningItemScores.get(learningItemKey(word)) ?? scoreWord(word, storage)
      : undefined
  );

  return {
    words,
    listIds: Array.from(new Set(words.map(word => word.listId)))
  };
}

export function getRecapWordCount(storage: SpelioStorage, lists: WordList[]) {
  const activeWords = lists.filter(list => list.isActive).flatMap(list => list.words);
  return getRecapCandidates(activeWords, storage).length;
}

export function getDifficultWordCount(storage: SpelioStorage, lists: WordList[]) {
  const activeWords = lists.filter(list => list.isActive).flatMap(list => list.words);
  return getDifficultCandidates(activeWords, storage).length;
}

function recapDifficultyRank(word: PracticeWord) {
  const difficulty = word.difficulty ?? 3;
  if (difficulty <= 3) return difficulty;
  if (difficulty === 4) return 4;
  return 5;
}

function sortPreSessionRecapCandidates(words: PracticeWord[], storage: SpelioStorage) {
  return [...words].sort((a, b) => {
    const leftProgress = storage.wordProgress[a.id];
    const rightProgress = storage.wordProgress[b.id];
    const leftResolved = leftProgress?.difficult ? 1 : 0;
    const rightResolved = rightProgress?.difficult ? 1 : 0;
    const leftCleanRecaps = leftProgress?.cleanRecapCount ?? 0;
    const rightCleanRecaps = rightProgress?.cleanRecapCount ?? 0;
    const leftPractised = leftProgress?.lastPractisedAt ?? '';
    const rightPractised = rightProgress?.lastPractisedAt ?? '';

    return (
      leftResolved - rightResolved ||
      leftCleanRecaps - rightCleanRecaps ||
      recapDifficultyRank(a) - recapDifficultyRank(b) ||
      rightPractised.localeCompare(leftPractised) ||
      a.order - b.order
    );
  });
}

export function selectPreSessionRecapWord(storage: SpelioStorage, lists: WordList[], sessionWords: PracticeWord[], reviewDifficult = false) {
  if (reviewDifficult || (storage.completedNormalSessionCount ?? 0) < 2) return undefined;

  const sessionWordIds = new Set(sessionWords.map(word => word.id));
  const activeWords = lists.filter(list => list.isActive).flatMap(list => list.words);
  const candidates = getRecapCandidates(activeWords, storage)
    .filter(word => !sessionWordIds.has(word.id));

  return sortPreSessionRecapCandidates(candidates, storage)[0];
}

export function classifySession(base: Pick<SessionResult, 'correctWords' | 'totalWords' | 'incorrectAttempts' | 'revealedLetters'>): SessionState {
  const accuracy = base.totalWords ? base.correctWords / base.totalWords : 0;

  if (base.incorrectAttempts > 0 || base.revealedLetters > 0) return 'struggled';
  if (accuracy >= 0.9) return 'strong';
  if (accuracy >= 0.75 && accuracy < 0.9) return 'good';
  if (accuracy < 0.75) return 'struggled';
  return 'good';
}

export function hasDifficultWords(storage: SpelioStorage, lists?: WordList[]) {
  if (!lists) return Object.values(storage.wordProgress).some(progress => progress.difficult === true);

  const activeWords = lists.filter(list => list.isActive).flatMap(list => list.words);
  return getDifficultCandidates(activeWords, storage).length > 0;
}
