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

function isDialectEligible(word: PracticeWord, preference: DialectPreference) {
  if (preference === 'mixed') return true;
  if (preference === 'north') return word.dialect === 'Both' || word.dialect === 'North Wales';
  return word.dialect === 'Both' || word.dialect === 'South Wales / Standard' || word.dialect === 'Standard';
}

function dialectRank(word: PracticeWord, preference: DialectPreference) {
  if (preference === 'north') return word.dialect === 'North Wales' ? 0 : 1;
  if (preference === 'south-standard') return word.dialect === 'South Wales / Standard' || word.dialect === 'Standard' ? 0 : 1;
  const progress = word.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return progress % 2;
}

export function filterDialectVariants(words: PracticeWord[], preference: DialectPreference) {
  const eligible = words.filter(word => isDialectEligible(word, preference));
  const grouped = new Map<string, PracticeWord[]>();
  const ungrouped: PracticeWord[] = [];

  for (const word of eligible) {
    const groupId = word.variantGroupId?.trim();
    if (!groupId) {
      ungrouped.push(word);
      continue;
    }
    grouped.set(groupId, [...(grouped.get(groupId) ?? []), word]);
  }

  const chosen = Array.from(grouped.values()).map(group => {
    return [...group].sort((a, b) => dialectRank(a, preference) - dialectRank(b, preference) || a.order - b.order)[0];
  });

  return [...ungrouped, ...chosen].sort((a, b) => a.order - b.order);
}

export function createPracticeSession(lists: WordList[], storage: SpelioStorage, reviewDifficult = false): PracticeSession {
  const selectedIds = storage.selectedListIds.length ? storage.selectedListIds : [lists[0]?.id].filter(Boolean) as string[];
  const eligibleLists = reviewDifficult
    ? lists.filter(list => list.isActive)
    : lists.filter(list => selectedIds.includes(list.id) && list.isActive);
  const allCandidates = eligibleLists.flatMap(list => list.words);
  const candidates = filterDialectVariants(allCandidates, storage.settings.dialectPreference);

  const reviewWords = candidates.filter(word => {
    const progress = storage.wordProgress[word.id];
    return progress?.difficult === true;
  });

  const pool = reviewDifficult ? reviewWords : candidates;
  const words = [...pool]
    .sort((a, b) => scoreWord(a, storage) - scoreWord(b, storage) || a.listId.localeCompare(b.listId) || a.order - b.order)
    .slice(0, SESSION_TARGET);

  return {
    words,
    listIds: Array.from(new Set(words.map(word => word.listId)))
  };
}

export function classifySession(base: Pick<SessionResult, 'correctWords' | 'totalWords' | 'incorrectAttempts' | 'revealedLetters'>): SessionState {
  const accuracy = base.totalWords ? base.correctWords / base.totalWords : 0;
  const difficultyScore = base.incorrectAttempts + base.revealedLetters * 2;

  if (accuracy >= 0.9 && base.revealedLetters === 0) return 'strong';
  if (accuracy >= 0.75 && accuracy < 0.9) return 'good';
  if (accuracy < 0.75 || base.revealedLetters > 0 || difficultyScore >= 3) return 'struggled';
  return 'good';
}

export function hasDifficultWords(storage: SpelioStorage) {
  return Object.values(storage.wordProgress).some(progress => progress.difficult === true);
}
