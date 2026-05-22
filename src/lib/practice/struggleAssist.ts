export const PRACTICE_STRUGGLE_ASSIST_INCORRECT_THRESHOLD = 2;
export const PRACTICE_STRUGGLE_ASSIST_PRE_REPLAY_ATTEMPT = 1;
export const PRACTICE_STRUGGLE_ASSIST_STORAGE_KEY = 'spelio.practiceStruggleAssistSeen.v1';
export const PRACTICE_STRUGGLE_ASSIST_STORAGE_PREFIX = 'spelio.practiceStruggleAssist';
export const PRACTICE_STRUGGLE_ASSIST_HELPER_DELAY_MS = 900;
export const PRACTICE_STRUGGLE_ASSIST_HELPER_AUDIO_FALLBACK_MS = 4200;
export const PRACTICE_STRUGGLE_ASSIST_HINT_VISIBLE_MS = 3600;
export const PRACTICE_STRUGGLE_ASSIST_HINT_FADE_MS = 320;
export const PRACTICE_STRUGGLE_ASSIST_TEXT_EMPHASIS_DELAY_MS =
  PRACTICE_STRUGGLE_ASSIST_HINT_VISIBLE_MS + PRACTICE_STRUGGLE_ASSIST_HINT_FADE_MS;
export const PRACTICE_STRUGGLE_ASSIST_AUDIO_EMPHASIS_MS = 1560;
export const PRACTICE_STRUGGLE_ASSIST_REVEAL_EMPHASIS_DELAY_MS = 1760;
export const PRACTICE_STRUGGLE_ASSIST_REVEAL_EMPHASIS_MS = 1560;
export const PRACTICE_REPEATED_INCORRECT_REPLAY_ATTEMPT = 2;

export type StruggleAssistEmphasisTarget = 'audio' | 'reveal';
export type StruggleAssistPreAssistAction = 'replay-word' | 'show-shortcut-hint' | 'show-mobile-guidance' | 'emphasize-controls';

export interface StruggleAssistState {
  wordId: string | null;
  incorrectAttempts: number;
  triggeredForWord: boolean;
}

export interface StruggleAssistInput {
  state: StruggleAssistState;
  wordId: string | null;
  practiceTestMode: boolean;
  alreadySeen: boolean;
}

export interface StruggleAssistResult {
  state: StruggleAssistState;
  shouldTrigger: boolean;
}

export interface RepeatedIncorrectReplayState {
  wordId: string | null;
  incorrectAttempts: number;
  replayedForWord: boolean;
}

export interface RepeatedIncorrectReplayInput {
  state: RepeatedIncorrectReplayState;
  wordId: string | null;
  audioPrompts: boolean;
  audioAvailable: boolean;
  practiceTestMode: boolean;
  suppressForHelperAudio: boolean;
}

export interface RepeatedIncorrectReplayResult {
  state: RepeatedIncorrectReplayState;
  shouldReplay: boolean;
}

export function createStruggleAssistState(wordId: string | null = null): StruggleAssistState {
  return {
    wordId,
    incorrectAttempts: 0,
    triggeredForWord: false
  };
}

export function resetStruggleAssistForWord(previous: StruggleAssistState, wordId: string | null): StruggleAssistState {
  if (previous.wordId === wordId) return previous;
  return createStruggleAssistState(wordId);
}

export function createRepeatedIncorrectReplayState(wordId: string | null = null): RepeatedIncorrectReplayState {
  return {
    wordId,
    incorrectAttempts: 0,
    replayedForWord: false
  };
}

export function resetRepeatedIncorrectReplayForWord(
  previous: RepeatedIncorrectReplayState,
  wordId: string | null
): RepeatedIncorrectReplayState {
  if (previous.wordId === wordId) return previous;
  return createRepeatedIncorrectReplayState(wordId);
}

export function registerStruggleAssistIncorrectAttempt({
  state,
  wordId,
  practiceTestMode,
  alreadySeen
}: StruggleAssistInput): StruggleAssistResult {
  const base = resetStruggleAssistForWord(state, wordId);
  if (!wordId || practiceTestMode || alreadySeen || base.triggeredForWord) {
    return { state: base, shouldTrigger: false };
  }

  const next = {
    ...base,
    incorrectAttempts: base.incorrectAttempts + 1
  };
  const shouldTrigger = next.incorrectAttempts === PRACTICE_STRUGGLE_ASSIST_INCORRECT_THRESHOLD;

  return {
    state: shouldTrigger ? { ...next, triggeredForWord: true } : next,
    shouldTrigger
  };
}

export function registerRepeatedIncorrectReplayAttempt({
  state,
  wordId,
  audioPrompts,
  audioAvailable,
  practiceTestMode,
  suppressForHelperAudio
}: RepeatedIncorrectReplayInput): RepeatedIncorrectReplayResult {
  const base = resetRepeatedIncorrectReplayForWord(state, wordId);
  if (!wordId) return { state: base, shouldReplay: false };

  const next = {
    ...base,
    incorrectAttempts: base.incorrectAttempts + 1
  };
  const shouldReplay =
    next.incorrectAttempts === PRACTICE_REPEATED_INCORRECT_REPLAY_ATTEMPT &&
    audioPrompts &&
    audioAvailable &&
    !practiceTestMode &&
    !base.replayedForWord &&
    !suppressForHelperAudio;

  return {
    state: shouldReplay ? { ...next, replayedForWord: true } : next,
    shouldReplay
  };
}

export function hasSeenPracticeStruggleAssist(storage: Pick<Storage, 'getItem'> | null | undefined) {
  if (!storage) return false;
  try {
    return storage.getItem(PRACTICE_STRUGGLE_ASSIST_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markPracticeStruggleAssistSeen(storage: Pick<Storage, 'setItem'> | null | undefined) {
  if (!storage) return;
  try {
    storage.setItem(PRACTICE_STRUGGLE_ASSIST_STORAGE_KEY, 'true');
  } catch {
    // Local discovery state is best-effort only.
  }
}

export function isPracticeStruggleAssistStorageKey(key: string) {
  return key.startsWith(PRACTICE_STRUGGLE_ASSIST_STORAGE_PREFIX);
}

export function clearPracticeStruggleAssistStorage(storage: Pick<Storage, 'length' | 'key' | 'removeItem'> | null | undefined) {
  if (!storage) return;
  try {
    const keysToRemove: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && isPracticeStruggleAssistStorageKey(key)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      storage.removeItem(key);
    }
  } catch {
    // Local discovery state is best-effort only.
  }
}

export function shouldShowLegacyShortcutHint() {
  return false;
}

export function createStruggleAssistAudioPlan({
  audioPrompts,
  helperAudioAvailable
}: {
  audioPrompts: boolean;
  helperAudioAvailable: boolean;
}): Array<'replay-word' | 'play-helper'> {
  if (!audioPrompts) return [];
  return helperAudioAvailable ? ['play-helper'] : [];
}

export function shouldWaitForStruggleAssistHelperAudio({
  audioPrompts,
  interfaceAudioReady,
  practiceTestMode
}: {
  audioPrompts: boolean;
  interfaceAudioReady: boolean;
  practiceTestMode: boolean;
}) {
  return audioPrompts && !interfaceAudioReady && !practiceTestMode;
}

export function shouldStartStruggleAssistHelperInGesture({
  audioPrompts,
  helperAudioAvailable,
  mobileLayout,
  practiceTestMode
}: {
  audioPrompts: boolean;
  helperAudioAvailable: boolean;
  mobileLayout: boolean;
  practiceTestMode: boolean;
}) {
  return audioPrompts && helperAudioAvailable && mobileLayout && !practiceTestMode;
}

export function shouldReplayStruggleAssistPreAssist({
  incorrectAttempts: _incorrectAttempts,
  audioPrompts: _audioPrompts,
  audioAvailable: _audioAvailable,
  practiceTestMode: _practiceTestMode,
  alreadySeen: _alreadySeen
}: {
  incorrectAttempts: number;
  audioPrompts: boolean;
  audioAvailable: boolean;
  practiceTestMode: boolean;
  alreadySeen: boolean;
}) {
  return false;
}

export function createStruggleAssistPreAssistPlan({
  incorrectAttempts,
  audioPrompts,
  audioAvailable,
  keyboardCapable,
  practiceTestMode,
  alreadySeen
}: {
  incorrectAttempts: number;
  audioPrompts: boolean;
  audioAvailable: boolean;
  keyboardCapable: boolean;
  practiceTestMode: boolean;
  alreadySeen: boolean;
}): StruggleAssistPreAssistAction[] {
  if (incorrectAttempts !== PRACTICE_STRUGGLE_ASSIST_PRE_REPLAY_ATTEMPT || practiceTestMode || alreadySeen) return [];
  if (audioPrompts && audioAvailable) return [];
  return [];
}

export function shouldShowStruggleAssistShortcutHint({
  keyboardCapable,
  practiceTestMode,
  audioPrompts,
  helperAudioAvailable
}: {
  keyboardCapable: boolean;
  practiceTestMode: boolean;
  audioPrompts: boolean;
  helperAudioAvailable: boolean;
}) {
  return keyboardCapable && !practiceTestMode && !(audioPrompts && helperAudioAvailable);
}

export function shouldShowStruggleAssistMobileHint({
  practiceTestMode,
  audioPrompts,
  helperAudioAvailable
}: {
  practiceTestMode: boolean;
  audioPrompts: boolean;
  helperAudioAvailable: boolean;
}) {
  return !practiceTestMode && !(audioPrompts && helperAudioAvailable);
}

export function createStruggleAssistEmphasisPlan({
  practiceTestMode,
  startDelayMs = 0
}: {
  practiceTestMode: boolean;
  startDelayMs?: number;
}): Array<{ target: StruggleAssistEmphasisTarget | null; delayMs: number }> {
  if (practiceTestMode) return [];
  return [
    { target: 'audio', delayMs: startDelayMs },
    { target: null, delayMs: startDelayMs + PRACTICE_STRUGGLE_ASSIST_AUDIO_EMPHASIS_MS },
    { target: 'reveal', delayMs: startDelayMs + PRACTICE_STRUGGLE_ASSIST_REVEAL_EMPHASIS_DELAY_MS },
    { target: null, delayMs: startDelayMs + PRACTICE_STRUGGLE_ASSIST_REVEAL_EMPHASIS_DELAY_MS + PRACTICE_STRUGGLE_ASSIST_REVEAL_EMPHASIS_MS }
  ];
}
