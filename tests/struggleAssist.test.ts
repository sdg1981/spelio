import {
  clearPracticeStruggleAssistStorage,
  createStruggleAssistAudioPlan,
  createStruggleAssistEmphasisPlan,
  createStruggleAssistState,
  hasSeenPracticeStruggleAssist,
  markPracticeStruggleAssistSeen,
  PRACTICE_STRUGGLE_ASSIST_INCORRECT_THRESHOLD,
  PRACTICE_STRUGGLE_ASSIST_AUDIO_EMPHASIS_MS,
  PRACTICE_STRUGGLE_ASSIST_HELPER_AUDIO_FALLBACK_MS,
  PRACTICE_STRUGGLE_ASSIST_REVEAL_EMPHASIS_DELAY_MS,
  PRACTICE_STRUGGLE_ASSIST_REVEAL_EMPHASIS_MS,
  PRACTICE_STRUGGLE_ASSIST_TEXT_EMPHASIS_DELAY_MS,
  PRACTICE_STRUGGLE_ASSIST_STORAGE_KEY,
  registerStruggleAssistIncorrectAttempt,
  resetStruggleAssistForWord,
  shouldShowStruggleAssistShortcutHint,
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
  assertEqual(result.shouldTrigger, true, 'Assist should trigger on the third incorrect attempt for the same word.');
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
    ['replay-word', 'play-helper'],
    'Audio plan should request word replay before helper guidance.'
  );
  assertArrayEqual(
    createStruggleAssistAudioPlan({ audioPrompts: true, helperAudioAvailable: false }),
    ['replay-word'],
    'Missing helper audio should still allow word replay.'
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
    'Text fallback timing should allow the shortcut hint to appear before visual emphasis.'
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
