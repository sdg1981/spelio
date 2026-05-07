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
  recapDue?: boolean;
  cleanRecapCount?: number;
  lastPractisedAt?: string;
}

export interface ListProgress {
  seenWordIds: string[];
  completed: boolean;
  completedAt?: string;
  lastPractisedAt?: string;
  strongSessionCount: number;
}

export interface LearningStats {
  totalActiveMs: number;
  totalSessionsCompleted: number;
  firstPractisedAt: string | null;
  lastPractisedAt: string | null;
}

export interface SpelioStorage {
  selectedListIds: string[];
  currentPathPosition: string | null;
  hasStartedPracticeSession: boolean;
  lastSessionDate: string | null;
  lastSessionResult: SessionResult | null;
  completedNormalSessionCount?: number;
  learningStats?: LearningStats;
  shownMilestones: number[];
  wordProgress: Record<string, WordProgress>;
  listProgress: Record<string, ListProgress>;
  settings: SpelioSettings;
}

export interface WordProgressPatch {
  incorrect?: boolean;
  revealed?: boolean;
  completed?: boolean;
  cleanCompleted?: boolean;
  recapCompletedClean?: boolean;
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

function createDefaultLearningStats(): LearningStats {
  return {
    totalActiveMs: 0,
    totalSessionsCompleted: 0,
    firstPractisedAt: null,
    lastPractisedAt: null
  };
}

export const defaultStorage: SpelioStorage = {
  selectedListIds: ['foundations_first_words'],
  currentPathPosition: 'foundations_first_words',
  hasStartedPracticeSession: false,
  lastSessionDate: null,
  lastSessionResult: null,
  completedNormalSessionCount: 0,
  learningStats: createDefaultLearningStats(),
  shownMilestones: [],
  wordProgress: {},
  listProgress: {},
  settings: defaultSettings
};

export function createDefaultStorage(): SpelioStorage {
  return {
    ...defaultStorage,
    selectedListIds: [...defaultStorage.selectedListIds],
    learningStats: createDefaultLearningStats(),
    shownMilestones: [],
    wordProgress: {},
    listProgress: {},
    settings: { ...defaultSettings }
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normaliseDialectPreference(value: unknown): DialectPreference {
  if (value === 'north' || value === 'south_standard' || value === 'mixed') return value;
  if (value === 'south-standard') return 'south_standard';
  return defaultSettings.dialectPreference;
}

export function normaliseStorage(value: unknown): SpelioStorage {
  const source = isObject(value) ? value : {};
  const settings = isObject(source.settings) ? source.settings : {};
  const learningStats = isObject(source.learningStats) ? source.learningStats : {};
  const audioPrompts = typeof settings.audioPrompts === 'boolean' ? settings.audioPrompts : defaultSettings.audioPrompts;
  const englishVisible = audioPrompts
    ? typeof settings.englishVisible === 'boolean' ? settings.englishVisible : defaultSettings.englishVisible
    : true;

  return {
    ...defaultStorage,
    ...source,
    selectedListIds: Array.isArray(source.selectedListIds) ? source.selectedListIds.filter(id => typeof id === 'string') : defaultStorage.selectedListIds,
    currentPathPosition: typeof source.currentPathPosition === 'string' ? source.currentPathPosition : defaultStorage.currentPathPosition,
    hasStartedPracticeSession: typeof source.hasStartedPracticeSession === 'boolean' ? source.hasStartedPracticeSession : defaultStorage.hasStartedPracticeSession,
    lastSessionDate: typeof source.lastSessionDate === 'string' ? source.lastSessionDate : null,
    lastSessionResult: isObject(source.lastSessionResult) ? source.lastSessionResult as unknown as SessionResult : null,
    completedNormalSessionCount: typeof source.completedNormalSessionCount === 'number' ? source.completedNormalSessionCount : 0,
    learningStats: {
      totalActiveMs: typeof learningStats.totalActiveMs === 'number' ? Math.max(0, learningStats.totalActiveMs) : 0,
      totalSessionsCompleted: typeof learningStats.totalSessionsCompleted === 'number' ? Math.max(0, learningStats.totalSessionsCompleted) : 0,
      firstPractisedAt: typeof learningStats.firstPractisedAt === 'string' ? learningStats.firstPractisedAt : null,
      lastPractisedAt: typeof learningStats.lastPractisedAt === 'string' ? learningStats.lastPractisedAt : null
    },
    shownMilestones: Array.isArray(source.shownMilestones)
      ? source.shownMilestones.filter((threshold): threshold is number => Number.isFinite(threshold))
      : [],
    wordProgress: isObject(source.wordProgress) ? source.wordProgress as Record<string, WordProgress> : {},
    listProgress: isObject(source.listProgress) ? source.listProgress as Record<string, ListProgress> : {},
    settings: {
      ...defaultSettings,
      englishVisible,
      audioPrompts,
      soundEffects: typeof settings.soundEffects === 'boolean' ? settings.soundEffects : defaultSettings.soundEffects,
      welshSpelling: settings.welshSpelling === 'strict' ? 'strict' : 'flexible',
      dialectPreference: normaliseDialectPreference(settings.dialectPreference)
    }
  };
}

export function addLearningStats(storage: SpelioStorage, activeMs: number, practisedAt = new Date().toISOString()): SpelioStorage {
  const previous = storage.learningStats ?? createDefaultLearningStats();
  const safeActiveMs = Math.max(0, Math.round(activeMs));

  return {
    ...storage,
    learningStats: {
      totalActiveMs: (previous?.totalActiveMs ?? 0) + safeActiveMs,
      totalSessionsCompleted: (previous?.totalSessionsCompleted ?? 0) + 1,
      firstPractisedAt: previous?.firstPractisedAt ?? practisedAt,
      lastPractisedAt: practisedAt
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

export function applyPracticeStartListSelection(storage: SpelioStorage, listId?: string): SpelioStorage {
  if (!listId) return storage;

  return {
    ...storage,
    selectedListIds: [listId],
    currentPathPosition: listId
  };
}

export function applyManualWordListSelection(storage: SpelioStorage, selectedListIds: string[]): SpelioStorage {
  return {
    ...storage,
    selectedListIds,
    currentPathPosition: selectedListIds[0] ?? null,
    lastSessionResult: null
  };
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

export function applyWordProgressPatch(
  storage: SpelioStorage,
  word: PracticeWord,
  patch: WordProgressPatch,
  practisedAt = new Date().toISOString()
): SpelioStorage {
  const previous = storage.wordProgress[word.id] ?? {
    seen: false,
    completedCount: 0,
    incorrectAttempts: 0,
    revealedCount: 0,
    difficult: false
  };
  const madeDifficult = Boolean(patch.incorrect || patch.revealed);
  const previousCleanRecapCount = previous.cleanRecapCount ?? 0;
  const nextCleanRecapCount = madeDifficult
    ? 0
    : patch.recapCompletedClean
      ? previousCleanRecapCount + 1
      : previousCleanRecapCount;
  const nextDifficult = madeDifficult
    ? true
    : patch.cleanCompleted
      ? false
      : previous.difficult;
  const nextRecapDue = madeDifficult
    ? true
    : patch.recapCompletedClean
      ? nextCleanRecapCount < 2
      : patch.cleanCompleted && (previous.difficult || previous.recapDue)
        ? true
        : previous.recapDue;

  return {
    ...storage,
    currentPathPosition: storage.currentPathPosition || word.listId,
    wordProgress: {
      ...storage.wordProgress,
      [word.id]: {
        ...previous,
        seen: true,
        completedCount: previous.completedCount + (patch.completed ? 1 : 0),
        incorrectAttempts: previous.incorrectAttempts + (patch.incorrect ? 1 : 0),
        revealedCount: previous.revealedCount + (patch.revealed ? 1 : 0),
        difficult: nextDifficult,
        recapDue: nextRecapDue,
        cleanRecapCount: nextCleanRecapCount,
        lastPractisedAt: practisedAt
      }
    }
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function eligibleCompletionItems(list: WordList) {
  const byGroup = new Map<string, PracticeWord[]>();
  const items: PracticeWord[][] = [];

  for (const word of list.words) {
    const groupId = word.variantGroupId?.trim();
    if (!groupId) {
      items.push([word]);
      continue;
    }
    byGroup.set(groupId, [...(byGroup.get(groupId) ?? []), word]);
  }

  return [...items, ...Array.from(byGroup.values())];
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

    const completionItems = eligibleCompletionItems(list);
    const seenRepresentatives = completionItems
      .filter(group => group.some(word => storage.wordProgress[word.id]?.seen))
      .map(group => group[0]?.id)
      .filter((id): id is string => Boolean(id));
    const seenWordIds = unique([
      ...previous.seenWordIds,
      ...seenRepresentatives
    ]);

    const allWordsSeen = completionItems.every(group => {
      const representativeId = group[0]?.id;
      return Boolean(representativeId && seenWordIds.includes(representativeId)) || group.some(word => storage.wordProgress[word.id]?.seen);
    });
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
