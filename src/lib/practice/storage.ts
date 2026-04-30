import { defaultSelectedListIds } from '../../data/wordLists';
import type { WelshSpellingMode, WordList } from '../../data/wordLists';

export interface SpelioSettings {
  englishVisible: boolean;
  audioPrompts: boolean;
  soundEffects: boolean;
  welshSpelling: WelshSpellingMode;
}

export interface WordProgress {
  seen: boolean;
  completedCount: number;
  incorrectAttempts: number;
  revealedCount: number;
  difficult: boolean;
  lastPractisedAt?: string;
}

export interface ListProgress {
  completed: boolean;
  seenWordIds: string[];
  strongSessionCount: number;
  lastPractisedAt?: string;
}

export interface SessionResult {
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  revealedWords: number;
  incorrectAttempts: number;
  revealedLetters: number;
  durationSeconds: number;
  state: 'strong' | 'good' | 'struggled';
  listIds: string[];
}

export interface SpelioStorage {
  selectedListIds: string[];
  currentPathPosition: string | null;
  lastSessionDate: string | null;
  lastSessionResult: SessionResult | null;
  wordProgress: Record<string, WordProgress>;
  listProgress: Record<string, ListProgress>;
  settings: SpelioSettings;
}

const STORAGE_KEY = 'spelio:mvp-progress:v1';

export const defaultSettings: SpelioSettings = {
  englishVisible: true,
  audioPrompts: true,
  soundEffects: true,
  welshSpelling: 'flexible'
};

export const defaultStorage: SpelioStorage = {
  selectedListIds: defaultSelectedListIds,
  currentPathPosition: defaultSelectedListIds[0] ?? null,
  lastSessionDate: null,
  lastSessionResult: null,
  wordProgress: {},
  listProgress: {},
  settings: defaultSettings
};

export function loadSpelioStorage(): SpelioStorage {
  if (typeof window === 'undefined') return defaultStorage;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStorage;
    const parsed = JSON.parse(raw) as Partial<SpelioStorage>;

    return {
      ...defaultStorage,
      ...parsed,
      selectedListIds: parsed.selectedListIds?.length ? parsed.selectedListIds : defaultStorage.selectedListIds,
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
      wordProgress: parsed.wordProgress ?? {},
      listProgress: parsed.listProgress ?? {}
    };
  } catch {
    return defaultStorage;
  }
}

export function saveSpelioStorage(data: SpelioStorage) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetSpelioStorage() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function updateListCompletion(data: SpelioStorage, lists: WordList[], session: SessionResult): SpelioStorage {
  const next: SpelioStorage = {
    ...data,
    wordProgress: { ...data.wordProgress },
    listProgress: { ...data.listProgress }
  };

  for (const listId of session.listIds) {
    const list = lists.find(item => item.id === listId);
    if (!list) continue;

    const existing = next.listProgress[listId] ?? {
      completed: false,
      seenWordIds: [],
      strongSessionCount: 0
    };

    const seenWordIds = new Set(existing.seenWordIds);
    list.words.forEach(word => {
      if (next.wordProgress[word.id]?.seen) seenWordIds.add(word.id);
    });

    const everyWordSeen = list.words.every(word => seenWordIds.has(word.id));
    const strongEnoughToComplete = session.correctWords / Math.max(session.totalWords, 1) >= 0.85 && session.revealedWords === 0;

    next.listProgress[listId] = {
      ...existing,
      seenWordIds: Array.from(seenWordIds),
      completed: existing.completed || (everyWordSeen && strongEnoughToComplete),
      strongSessionCount: session.state === 'strong' ? existing.strongSessionCount + 1 : existing.strongSessionCount,
      lastPractisedAt: new Date().toISOString()
    };
  }

  return next;
}
