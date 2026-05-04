import type { DialectPreference, PracticeWord, WelshSpellingMode, WordList } from '../../data/wordLists';

export type SessionState = 'strong' | 'good' | 'struggled';

export interface SessionResult {
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  revealedWords: number;
  incorrectAttempts: number;
  revealedLetters: number;
  durationSeconds: number;
  listIds: string[];
  state: SessionState;
}

export interface SpelioSettings {
  englishVisible: boolean;
  audioPrompts: boolean;
  soundEffects: boolean;
  welshSpelling: WelshSpellingMode;
  dialectPreference: DialectPreference;
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
  seenWordIds: string[];
  completed: boolean;
  completedAt?: string;
  lastPractisedAt?: string;
  strongSessionCount: number;
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

const STORAGE_KEY = 'spelio-storage-v1';
const LEGACY_STORAGE_KEYS = [
  'selectedListIds',
  'currentPathPosition',
  'lastSessionDate',
  'lastSessionResult',
  'wordProgress',
  'listProgress',
  'settings'
];

export const defaultSettings: SpelioSettings = {
  englishVisible: true,
  audioPrompts: true,
  soundEffects: true,
  welshSpelling: 'flexible',
  dialectPreference: 'mixed'
};

export const defaultStorage: SpelioStorage = {
  selectedListIds: ['foundations_first_words'],
  currentPathPosition: 'foundations_first_words',
  lastSessionDate: null,
  lastSessionResult: null,
  wordProgress: {},
  listProgress: {},
  settings: defaultSettings
};

export function createDefaultStorage(): SpelioStorage {
  return {
    ...defaultStorage,
    selectedListIds: [...defaultStorage.selectedListIds],
    wordProgress: {},
    listProgress: {},
    settings: { ...defaultSettings }
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function normaliseStorage(value: unknown): SpelioStorage {
  const source = isObject(value) ? value : {};
  const settings = isObject(source.settings) ? source.settings : {};

  return {
    ...defaultStorage,
    ...source,
    selectedListIds: Array.isArray(source.selectedListIds) ? source.selectedListIds.filter(id => typeof id === 'string') : defaultStorage.selectedListIds,
    currentPathPosition: typeof source.currentPathPosition === 'string' ? source.currentPathPosition : defaultStorage.currentPathPosition,
    lastSessionDate: typeof source.lastSessionDate === 'string' ? source.lastSessionDate : null,
    lastSessionResult: isObject(source.lastSessionResult) ? source.lastSessionResult as unknown as SessionResult : null,
    wordProgress: isObject(source.wordProgress) ? source.wordProgress as Record<string, WordProgress> : {},
    listProgress: isObject(source.listProgress) ? source.listProgress as Record<string, ListProgress> : {},
    settings: {
      ...defaultSettings,
      ...settings,
      welshSpelling: settings.welshSpelling === 'strict' ? 'strict' : 'flexible',
      dialectPreference:
        settings.dialectPreference === 'north' || settings.dialectPreference === 'south-standard'
          ? settings.dialectPreference
          : 'mixed'
    }
  };
}

export function loadSpelioStorage(): SpelioStorage {
  if (typeof window === 'undefined') return createDefaultStorage();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normaliseStorage(raw ? JSON.parse(raw) : null);
  } catch {
    return createDefaultStorage();
  }
}

export function saveSpelioStorage(storage: SpelioStorage) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normaliseStorage(storage)));
  } catch {
    // Local storage should never block practice.
  }
}

export function clearSpelioStorageData() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    for (const key of LEGACY_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Local storage should never block resetting in-memory progress.
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function isDialectEligible(word: PracticeWord, preference: DialectPreference) {
  if (preference === 'mixed') return true;
  if (preference === 'north') return word.dialect === 'Both' || word.dialect === 'North Wales';
  return word.dialect === 'Both' || word.dialect === 'South Wales / Standard' || word.dialect === 'Standard';
}

function eligibleCompletionWords(list: WordList, preference: DialectPreference) {
  const eligible = list.words.filter(word => isDialectEligible(word, preference));
  const byGroup = new Map<string, PracticeWord[]>();
  const ungrouped: PracticeWord[] = [];

  for (const word of eligible) {
    const groupId = word.variantGroupId?.trim();
    if (!groupId) {
      ungrouped.push(word);
      continue;
    }
    byGroup.set(groupId, [...(byGroup.get(groupId) ?? []), word]);
  }

  return [
    ...ungrouped,
    ...Array.from(byGroup.values()).map(group => group[0])
  ];
}

export function updateListCompletion(storage: SpelioStorage, lists: WordList[], result: SessionResult): SpelioStorage {
  const now = new Date().toISOString();
  const nextListProgress = { ...storage.listProgress };

  for (const listId of result.listIds) {
    const list = lists.find(item => item.id === listId);
    if (!list) continue;

    const previous = nextListProgress[listId] ?? {
      seenWordIds: [],
      completed: false,
      strongSessionCount: 0
    };

    const completionWords = eligibleCompletionWords(list, storage.settings.dialectPreference);
    const seenWordIds = unique([
      ...previous.seenWordIds,
      ...completionWords.filter(word => storage.wordProgress[word.id]?.seen).map(word => word.id)
    ]);

    const allWordsSeen = completionWords.every(word => seenWordIds.includes(word.id) || storage.wordProgress[word.id]?.seen);
    const accuracy = result.totalWords ? result.correctWords / result.totalWords : 0;
    const strongSession = accuracy >= 0.85 && result.revealedLetters === 0;
    const completed = previous.completed || (allWordsSeen && strongSession);

    nextListProgress[listId] = {
      ...previous,
      seenWordIds,
      completed,
      completedAt: completed && !previous.completed ? now : previous.completedAt,
      lastPractisedAt: now,
      strongSessionCount: previous.strongSessionCount + (strongSession ? 1 : 0)
    };
  }

  return { ...storage, listProgress: nextListProgress };
}
