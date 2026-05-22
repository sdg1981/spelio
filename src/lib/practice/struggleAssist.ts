export const PRACTICE_STRUGGLE_ASSIST_INCORRECT_THRESHOLD = 3;
export const PRACTICE_STRUGGLE_ASSIST_STORAGE_KEY = 'spelio.practiceStruggleAssistSeen.v1';
export const PRACTICE_STRUGGLE_ASSIST_HELPER_DELAY_MS = 900;
export const PRACTICE_STRUGGLE_ASSIST_HINT_VISIBLE_MS = 3600;

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
  return helperAudioAvailable
    ? ['replay-word', 'play-helper']
    : ['replay-word'];
}

export function shouldShowStruggleAssistShortcutHint({
  keyboardCapable,
  practiceTestMode
}: {
  keyboardCapable: boolean;
  practiceTestMode: boolean;
}) {
  return keyboardCapable && !practiceTestMode;
}
