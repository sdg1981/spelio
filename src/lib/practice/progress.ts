import type { PracticeWord, WordList } from '../../data/wordLists';
import type { SpelioStorage } from './storage';

export const ACTIVE_IDLE_THRESHOLD_MS = 25_000;
export const ACTIVE_WORD_CAP_MS = 45_000;

export interface ActiveWordTiming {
  wordStartedAt: number;
  lastInteractionAt: number | null;
  activeMs: number;
}

export function addActiveInteractionTime(timing: ActiveWordTiming, interactedAt: number): ActiveWordTiming {
  const from = timing.lastInteractionAt ?? timing.wordStartedAt;
  const gap = Math.max(0, interactedAt - from);
  const countedGap = Math.min(gap, ACTIVE_IDLE_THRESHOLD_MS);
  const activeMs = Math.min(ACTIVE_WORD_CAP_MS, timing.activeMs + countedGap);

  return {
    wordStartedAt: timing.wordStartedAt,
    lastInteractionAt: interactedAt,
    activeMs
  };
}

function learningItemKey(word: PracticeWord) {
  const groupId = word.variantGroupId?.trim();
  return groupId ? `${word.listId}:${groupId}` : `${word.listId}:${word.id}`;
}

export function countLearnedSpellings(storage: SpelioStorage, lists: WordList[]) {
  const items = new Map<string, { hasCleanCompletion: boolean; hasCurrentDifficulty: boolean }>();

  for (const word of lists.flatMap(list => list.words)) {
    const progress = storage.wordProgress[word.id];
    if (!progress) continue;

    const key = learningItemKey(word);
    const previous = items.get(key) ?? { hasCleanCompletion: false, hasCurrentDifficulty: false };

    items.set(key, {
      hasCleanCompletion: previous.hasCleanCompletion || (progress.completedCount > 0 && progress.difficult !== true),
      hasCurrentDifficulty: previous.hasCurrentDifficulty || progress.difficult === true
    });
  }

  return Array.from(items.values()).filter(item => item.hasCleanCompletion && !item.hasCurrentDifficulty).length;
}

export function formatCumulativeProgress(storage: SpelioStorage, lists: WordList[], options?: { prefix?: string }) {
  const learnedSpellings = countLearnedSpellings(storage, lists);
  const activeMinutes = Math.floor((storage.learningStats?.totalActiveMs ?? 0) / 60_000);
  const parts: string[] = [];

  if (learnedSpellings > 0) {
    parts.push(`${learnedSpellings} ${learnedSpellings === 1 ? 'spelling' : 'spellings'} learned`);
  }

  if (activeMinutes > 0) {
    parts.push(`${activeMinutes} ${activeMinutes === 1 ? 'minute' : 'minutes'} practised`);
  }

  if (parts.length === 0) return null;

  const text = parts.join(' · ');
  return options?.prefix ? `${options.prefix}: ${text}` : text;
}
