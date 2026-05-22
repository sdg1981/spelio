import {
  clearPracticeStruggleAssistStorage,
  createStruggleAssistAudioPlan,
  createStruggleAssistEmphasisPlan,
  createStruggleAssistPreAssistPlan,
  createStruggleAssistState,
  hasSeenPracticeStruggleAssist,
  markPracticeStruggleAssistSeen,
  PRACTICE_STRUGGLE_ASSIST_PRE_REPLAY_ATTEMPT,
  PRACTICE_STRUGGLE_ASSIST_INCORRECT_THRESHOLD,
  PRACTICE_STRUGGLE_ASSIST_AUDIO_EMPHASIS_MS,
  PRACTICE_STRUGGLE_ASSIST_HELPER_AUDIO_FALLBACK_MS,
  PRACTICE_STRUGGLE_ASSIST_REVEAL_EMPHASIS_DELAY_MS,
  PRACTICE_STRUGGLE_ASSIST_REVEAL_EMPHASIS_MS,
  PRACTICE_STRUGGLE_ASSIST_TEXT_EMPHASIS_DELAY_MS,
  PRACTICE_STRUGGLE_ASSIST_STORAGE_KEY,
  registerStruggleAssistIncorrectAttempt,
  resetStruggleAssistForWord,
  shouldShowStruggleAssistMobileHint,
  shouldReplayStruggleAssistPreAssist,
  shouldShowStruggleAssistShortcutHint,
  shouldStartStruggleAssistHelperInGesture,
  shouldWaitForStruggleAssistHelperAudio,
  shouldShowLegacyShortcutHint
} from '../src/lib/practice/struggleAssist';
import { createDefaultInterfaceAudioClips, createInterfaceAudioRegistry, getPlayableInterfaceAudioUrl, PRACTICE_STRUGGLE_ASSIST_AUDIO_KEY, resolveInterfaceAudioClip } from '../src/lib/interfaceAudio';
import { clearSpelioStorageData } from '../src/lib/practice/storage';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function assertArrayEqual<T>(actual: readonly T[], expected: readonly T[], message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}\nExpected: ${expectedJson}\nActual: ${actualJson}`);
  }
}

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => Array.from(values.keys())[index] ?? null,
    removeItem: key => values.delete(key),
    setItem: (key, value) => {
      values.set(key, value);
    }
  };
}

{
  let state = createStruggleAssistState('word-1');
  for (let attempt = 1; attempt < PRACTICE_STRUGGLE_ASSIST_INCORRECT_THRESHOLD; attempt += 1) {
    const result = registerStruggleAssistIncorrectAttempt({
      state,
      wordId: 'word-1',
      practiceTestMode: false,
      alreadySeen: false
    });
    state = result.state;
    assertEqual(result.shouldTrigger, false, 'Assist should not trigger before the incorrect-attempt threshold.');
  }

  const result = registerStruggleAssistIncorrectAttempt({
    state,
    wordId: 'word-1',
    practiceTestMode: false,
    alreadySeen: false
  });
  assertEqual(result.shouldTrigger, true, 'Assist should trigger on the second incorrect attempt for the same word.');
  assertEqual(result.state.triggeredForWord, true, 'Triggered word should be marked to avoid repeated firing.');
}

{
  let state = createStruggleAssistState('word-1');
  let triggered = 0;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = registerStruggleAssistIncorrectAttempt({
      state,
      wordId: 'word-1',
      practiceTestMode: false,
      alreadySeen: false
    });
    state = result.state;
    if (result.shouldTrigger) triggered += 1;
  }
  assertEqual(triggered, 1, 'Assist should not repeatedly trigger on the same difficult word.');
}

{
  let state = createStruggleAssistState('word-1');
  state = registerStruggleAssistIncorrectAttempt({ state, wordId: 'word-1', practiceTestMode: false, alreadySeen: false }).state;
  state = resetStruggleAssistForWord(state, 'word-2');
  const result = registerStruggleAssistIncorrectAttempt({ state, wordId: 'word-2', practiceTestMode: false, alreadySeen: false });
  assertEqual(result.shouldTrigger, false, 'Incorrect-attempt tracking should reset on word change.');
  assertEqual(result.state.incorrectAttempts, 1, 'New word should start its own incorrect-attempt count.');
}

{
  let state = createStruggleAssistState('word-1');
  for (let attempt = 0; attempt < PRACTICE_STRUGGLE_ASSIST_INCORRECT_THRESHOLD; attempt += 1) {
    const result = registerStruggleAssistIncorrectAttempt({
      state,
      wordId: 'word-1',
      practiceTestMode: true,
      alreadySeen: false
    });
    state = result.state;
    assertEqual(result.shouldTrigger, false, 'Practice-test mode should never trigger struggle assist.');
  }
}

{
  const storage = createMemoryStorage();
  assertEqual(hasSeenPracticeStruggleAssist(storage), false, 'Fresh local storage should not mark struggle assist as seen.');
  markPracticeStruggleAssistSeen(storage);
  assertEqual(storage.getItem(PRACTICE_STRUGGLE_ASSIST_STORAGE_KEY), 'true', 'Seen state should use the requested localStorage key.');
  assertEqual(hasSeenPracticeStruggleAssist(storage), true, 'Seen state should suppress future assists.');

  const result = registerStruggleAssistIncorrectAttempt({
    state: createStruggleAssistState('word-1'),
    wordId: 'word-1',
    practiceTestMode: false,
    alreadySeen: true
  });
  assertEqual(result.shouldTrigger, false, 'Seen local storage state should suppress the assist.');
}

{
  const storage = createMemoryStorage();
  markPracticeStruggleAssistSeen(storage);
  storage.setItem('spelio.practiceStruggleAssistCooldown.v1', 'active');
  storage.setItem('spelio.practiceStruggleAssistHelperAudio.v1', 'played');
  storage.setItem('spelio.practiceOtherFeature.v1', 'keep');

  clearPracticeStruggleAssistStorage(storage);

  assertEqual(storage.getItem(PRACTICE_STRUGGLE_ASSIST_STORAGE_KEY), null, 'Clearing assist state should remove the seen key.');
  assertEqual(storage.getItem('spelio.practiceStruggleAssistCooldown.v1'), null, 'Clearing assist state should remove future trigger cooldown state.');
  assertEqual(storage.getItem('spelio.practiceStruggleAssistHelperAudio.v1'), null, 'Clearing assist state should remove related helper-audio state.');
  assertEqual(storage.getItem('spelio.practiceOtherFeature.v1'), 'keep', 'Clearing assist state should not remove unrelated practice keys.');
}

{
  const storage = createMemoryStorage();
  storage.setItem('spelio-storage-v1', '{"settings":{"theme":"dark"}}');
  storage.setItem('spelio-recent-custom-lists', '["recent-list"]');
  storage.setItem('selectedListIds', '["legacy-list"]');
  storage.setItem('settings', '{"soundEffects":false}');
  storage.setItem('spelio-custom-list-client-id', 'client-id');
  markPracticeStruggleAssistSeen(storage);
  storage.setItem('spelio.practiceStruggleAssistCooldown.v1', 'active');

  clearSpelioStorageData(storage);

  assertEqual(storage.getItem('spelio-storage-v1'), null, 'Reset progress should remove primary progress storage.');
  assertEqual(storage.getItem('spelio-recent-custom-lists'), null, 'Reset progress should remove recent custom-list references.');
  assertEqual(storage.getItem('selectedListIds'), null, 'Reset progress should remove legacy progress storage.');
  assertEqual(storage.getItem('settings'), null, 'Reset progress should preserve existing legacy reset behaviour.');
  assertEqual(storage.getItem(PRACTICE_STRUGGLE_ASSIST_STORAGE_KEY), null, 'Reset progress should clear struggle-assist seen state.');
  assertEqual(storage.getItem('spelio.practiceStruggleAssistCooldown.v1'), null, 'Reset progress should clear future struggle-assist trigger state.');
  assertEqual(storage.getItem('spelio-custom-list-client-id'), 'client-id', 'Reset progress should not clear unrelated local app data.');

  let state = createStruggleAssistState('word-1');
  let triggered = false;
  for (let attempt = 0; attempt < PRACTICE_STRUGGLE_ASSIST_INCORRECT_THRESHOLD; attempt += 1) {
    const result = registerStruggleAssistIncorrectAttempt({
      state,
      wordId: 'word-1',
      practiceTestMode: false,
      alreadySeen: hasSeenPracticeStruggleAssist(storage)
    });
    state = result.state;
    triggered = triggered || result.shouldTrigger;
  }
  assertEqual(triggered, true, 'Assist should be able to trigger again after reset clears local seen state.');
}

{
  assertArrayEqual(
    createStruggleAssistAudioPlan({ audioPrompts: true, helperAudioAvailable: true }),
    ['play-helper'],
    'Second-attempt helper guidance should not replay the word immediately before helper audio.'
  );
  assertArrayEqual(
    createStruggleAssistAudioPlan({ audioPrompts: true, helperAudioAvailable: false }),
    [],
    'Missing helper audio should use text/visual fallback rather than replaying again on the second attempt.'
  );
  assertArrayEqual(
    createStruggleAssistAudioPlan({ audioPrompts: false, helperAudioAvailable: true }),
    [],
    'Audio prompts off should suppress both word replay and helper guidance audio.'
  );
  assertEqual(
    shouldShowStruggleAssistShortcutHint({ keyboardCapable: true, practiceTestMode: false, audioPrompts: true, helperAudioAvailable: true }),
    false,
    'Audio prompts on should not show desktop shortcut text when spoken helper guidance is available.'
  );
  assertEqual(
    shouldShowStruggleAssistShortcutHint({ keyboardCapable: true, practiceTestMode: false, audioPrompts: false, helperAudioAvailable: true }),
    true,
    'Audio prompts off should show the shortcut text fallback even when helper audio metadata exists.'
  );
  assertEqual(
    shouldShowStruggleAssistShortcutHint({ keyboardCapable: true, practiceTestMode: false, audioPrompts: true, helperAudioAvailable: false }),
    true,
    'Missing helper audio should allow the shortcut text fallback.'
  );
  assertEqual(
    shouldShowStruggleAssistShortcutHint({ keyboardCapable: true, practiceTestMode: true, audioPrompts: false, helperAudioAvailable: true }),
    false,
    'Practice-test mode should still suppress the shortcut hint.'
  );
  assertArrayEqual(
    createStruggleAssistAudioPlan({ audioPrompts: true, helperAudioAvailable: true }),
    ['play-helper'],
    'Mobile audio-on second attempt should use the same spoken helper plan as desktop when helper audio is available.'
  );
  assertEqual(
    shouldShowStruggleAssistMobileHint({ practiceTestMode: false, audioPrompts: true, helperAudioAvailable: true }),
    false,
    'Mobile audio-on second attempt should not show written fallback when helper audio is available.'
  );
  assertEqual(
    shouldWaitForStruggleAssistHelperAudio({ audioPrompts: true, interfaceAudioReady: false, practiceTestMode: false }),
    true,
    'Audio-on struggle assist should wait for interface audio metadata before falling back.'
  );
  assertEqual(
    shouldWaitForStruggleAssistHelperAudio({ audioPrompts: false, interfaceAudioReady: false, practiceTestMode: false }),
    false,
    'Audio-off struggle assist should not wait for helper audio metadata.'
  );
  assertEqual(
    shouldStartStruggleAssistHelperInGesture({ audioPrompts: true, helperAudioAvailable: true, mobileLayout: true, practiceTestMode: false }),
    true,
    'Mobile audio-on second attempt with helper audio should start helper playback in the input gesture path.'
  );
  assertEqual(
    shouldStartStruggleAssistHelperInGesture({ audioPrompts: true, helperAudioAvailable: true, mobileLayout: false, practiceTestMode: false }),
    false,
    'Desktop audio-on second attempt should keep the calmer delayed helper timing.'
  );
  assertEqual(
    shouldStartStruggleAssistHelperInGesture({ audioPrompts: false, helperAudioAvailable: true, mobileLayout: true, practiceTestMode: false }),
    false,
    'Audio-off mobile fallback should not attempt helper playback.'
  );

  let state = createStruggleAssistState('word-1');
  state = registerStruggleAssistIncorrectAttempt({ state, wordId: 'word-1', practiceTestMode: false, alreadySeen: false }).state;
  const secondAttempt = registerStruggleAssistIncorrectAttempt({ state, wordId: 'word-1', practiceTestMode: false, alreadySeen: false });
  assertEqual(secondAttempt.shouldTrigger, true, 'Second incorrect attempt should fire the main struggle assist guidance.');
  assertArrayEqual(
    createStruggleAssistAudioPlan({ audioPrompts: false, helperAudioAvailable: true }),
    [],
    'Audio-off second attempt should not schedule replay or helper audio.'
  );
  assertEqual(
    shouldShowStruggleAssistShortcutHint({ keyboardCapable: true, practiceTestMode: false, audioPrompts: false, helperAudioAvailable: true }),
    true,
    'Audio-off desktop second attempt should use shortcut text fallback.'
  );
  assertEqual(
    shouldShowStruggleAssistShortcutHint({ keyboardCapable: false, practiceTestMode: false, audioPrompts: false, helperAudioAvailable: true }),
    false,
    'Audio-off mobile second attempt should not show keyboard shortcut text.'
  );
  assertEqual(
    shouldShowStruggleAssistMobileHint({ practiceTestMode: false, audioPrompts: false, helperAudioAvailable: true }),
    true,
    'Audio-off mobile second attempt should show written fallback guidance.'
  );
  assertArrayEqual(
    createStruggleAssistEmphasisPlan({ practiceTestMode: false, startDelayMs: PRACTICE_STRUGGLE_ASSIST_TEXT_EMPHASIS_DELAY_MS }).map(step => step.target),
    ['audio', null, 'reveal', null],
    'Audio-off second attempt should schedule replay then reveal visual emphasis.'
  );
}

{
  assertArrayEqual(
    createStruggleAssistPreAssistPlan({
      incorrectAttempts: PRACTICE_STRUGGLE_ASSIST_PRE_REPLAY_ATTEMPT,
      audioPrompts: true,
      audioAvailable: true,
      keyboardCapable: true,
      practiceTestMode: false,
      alreadySeen: false
    }),
    ['replay-word'],
    'Audio-on first attempt should schedule replay only.'
  );
  assertArrayEqual(
    createStruggleAssistPreAssistPlan({
      incorrectAttempts: PRACTICE_STRUGGLE_ASSIST_PRE_REPLAY_ATTEMPT,
      audioPrompts: false,
      audioAvailable: true,
      keyboardCapable: true,
      practiceTestMode: false,
      alreadySeen: false
    }),
    [],
    'Audio-off desktop first attempt should show no guidance.'
  );
  assertArrayEqual(
    createStruggleAssistPreAssistPlan({
      incorrectAttempts: PRACTICE_STRUGGLE_ASSIST_PRE_REPLAY_ATTEMPT,
      audioPrompts: false,
      audioAvailable: true,
      keyboardCapable: false,
      practiceTestMode: false,
      alreadySeen: false
    }),
    [],
    'Audio-off mobile first attempt should show no guidance.'
  );
  assertArrayEqual(
    createStruggleAssistPreAssistPlan({
      incorrectAttempts: PRACTICE_STRUGGLE_ASSIST_PRE_REPLAY_ATTEMPT,
      audioPrompts: false,
      audioAvailable: true,
      keyboardCapable: false,
      practiceTestMode: true,
      alreadySeen: false
    }),
    [],
    'Practice-test mode should schedule no first-attempt replay, text guidance, or visual emphasis.'
  );
  assertEqual(
    shouldReplayStruggleAssistPreAssist({
      incorrectAttempts: PRACTICE_STRUGGLE_ASSIST_PRE_REPLAY_ATTEMPT,
      audioPrompts: true,
      audioAvailable: true,
      practiceTestMode: false,
      alreadySeen: false
    }),
    true,
    'First incorrect attempt should schedule a replay-only pre-assist nudge when audio prompts are on.'
  );
  assertEqual(
    shouldReplayStruggleAssistPreAssist({
      incorrectAttempts: PRACTICE_STRUGGLE_ASSIST_PRE_REPLAY_ATTEMPT,
      audioPrompts: false,
      audioAvailable: true,
      practiceTestMode: false,
      alreadySeen: false
    }),
    false,
    'Audio prompts off should suppress the first-attempt replay nudge.'
  );
  assertEqual(
    shouldReplayStruggleAssistPreAssist({
      incorrectAttempts: PRACTICE_STRUGGLE_ASSIST_PRE_REPLAY_ATTEMPT,
      audioPrompts: true,
      audioAvailable: true,
      practiceTestMode: true,
      alreadySeen: false
    }),
    false,
    'Practice-test mode should suppress the first-attempt replay nudge.'
  );
  const storage = createMemoryStorage();
  let state = createStruggleAssistState('word-1');
  state = registerStruggleAssistIncorrectAttempt({ state, wordId: 'word-1', practiceTestMode: false, alreadySeen: hasSeenPracticeStruggleAssist(storage) }).state;
  assertEqual(hasSeenPracticeStruggleAssist(storage), false, 'First-attempt replay nudge should not mark struggle assist as seen.');
  assertEqual(state.incorrectAttempts, PRACTICE_STRUGGLE_ASSIST_PRE_REPLAY_ATTEMPT, 'First-attempt replay nudge should not change the main assist threshold.');
}

{
  assertArrayEqual(
    createStruggleAssistEmphasisPlan({ practiceTestMode: false }),
    [
      { target: 'audio', delayMs: 0 },
      { target: null, delayMs: PRACTICE_STRUGGLE_ASSIST_AUDIO_EMPHASIS_MS },
      { target: 'reveal', delayMs: PRACTICE_STRUGGLE_ASSIST_REVEAL_EMPHASIS_DELAY_MS },
      { target: null, delayMs: PRACTICE_STRUGGLE_ASSIST_REVEAL_EMPHASIS_DELAY_MS + PRACTICE_STRUGGLE_ASSIST_REVEAL_EMPHASIS_MS }
    ],
    'Assist trigger should schedule audio emphasis first, then reveal emphasis, then clear both.'
  );
  assertArrayEqual(
    createStruggleAssistEmphasisPlan({ practiceTestMode: false, startDelayMs: PRACTICE_STRUGGLE_ASSIST_HELPER_AUDIO_FALLBACK_MS }),
    [
      { target: 'audio', delayMs: PRACTICE_STRUGGLE_ASSIST_HELPER_AUDIO_FALLBACK_MS },
      { target: null, delayMs: PRACTICE_STRUGGLE_ASSIST_HELPER_AUDIO_FALLBACK_MS + PRACTICE_STRUGGLE_ASSIST_AUDIO_EMPHASIS_MS },
      { target: 'reveal', delayMs: PRACTICE_STRUGGLE_ASSIST_HELPER_AUDIO_FALLBACK_MS + PRACTICE_STRUGGLE_ASSIST_REVEAL_EMPHASIS_DELAY_MS },
      { target: null, delayMs: PRACTICE_STRUGGLE_ASSIST_HELPER_AUDIO_FALLBACK_MS + PRACTICE_STRUGGLE_ASSIST_REVEAL_EMPHASIS_DELAY_MS + PRACTICE_STRUGGLE_ASSIST_REVEAL_EMPHASIS_MS }
    ],
    'Spoken helper fallback timing should delay visual emphasis until after the helper guidance window.'
  );
  assertEqual(
    createStruggleAssistEmphasisPlan({ practiceTestMode: false, startDelayMs: PRACTICE_STRUGGLE_ASSIST_TEXT_EMPHASIS_DELAY_MS })[0]?.delayMs,
    PRACTICE_STRUGGLE_ASSIST_TEXT_EMPHASIS_DELAY_MS,
    'Text fallback timing should wait for the written guidance to finish before visual emphasis.'
  );
  assertArrayEqual(
    createStruggleAssistEmphasisPlan({ practiceTestMode: true }),
    [],
    'Practice-test mode should not schedule visual assist emphasis.'
  );
}

{
  const registry = createInterfaceAudioRegistry(createDefaultInterfaceAudioClips());
  const clip = resolveInterfaceAudioClip(registry, PRACTICE_STRUGGLE_ASSIST_AUDIO_KEY, 'cy');
  if (!clip) throw new Error('Default helper clip metadata should exist for Welsh.');
  assertEqual(getPlayableInterfaceAudioUrl(clip), null, 'Missing helper audio should resolve to no playable URL without breaking metadata lookup.');
  assertEqual(
    getPlayableInterfaceAudioUrl({
      ...clip,
      audioUrl: 'https://example.com/interface/practice-struggle-assist/cy.mp3',
      audioStatus: 'ready',
      updatedAt: '2026-05-22T10:15:00.000Z'
    }),
    'https://example.com/interface/practice-struggle-assist/cy.mp3?updated=2026-05-22T10%3A15%3A00.000Z',
    'Playable helper audio URLs should include updatedAt as a cache buster after regeneration.'
  );
}

assertEqual(shouldShowLegacyShortcutHint(), false, 'Older timed shortcut hints should not duplicate the contextual assist.');

console.log('struggle assist tests passed');
