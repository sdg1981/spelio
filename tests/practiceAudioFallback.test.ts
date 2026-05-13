import { getEnglishPromptDisplayState, getRecallPauseDelayMs, isAudioUnavailableForPrompt, shouldDelayEnglishPrompt, shouldShowEnglishPrompt } from '../src/lib/practice/audioAvailability';
import type { PracticeWord } from '../src/data/wordLists';
import { createDefaultStorage, normaliseStorage } from '../src/lib/practice/storage';

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function makeWord(overrides: Partial<PracticeWord> = {}): PracticeWord {
  return {
    id: 'test-word',
    listId: 'test-list',
    prompt: 'work',
    answer: 'gweithio',
    englishPrompt: 'work',
    welshAnswer: 'gweithio',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    acceptedAlternatives: [],
    audioUrl: 'https://example.com/audio/gweithio.m4a',
    audioStatus: 'ready',
    notes: '',
    order: 1,
    difficulty: 1,
    dialect: 'Both',
    dialectNote: '',
    usageNote: '',
    variantGroupId: '',
    ...overrides
  };
}

function promptVisible(englishVisible: boolean, word: PracticeWord, playbackFailed = false) {
  return shouldShowEnglishPrompt(englishVisible, isAudioUnavailableForPrompt(word, playbackFailed));
}

function shouldDelayPrompt(
  settings: Partial<ReturnType<typeof createDefaultStorage>['settings']>,
  word: PracticeWord,
  playbackFailed = false
) {
  return shouldDelayEnglishPrompt({ ...createDefaultStorage().settings, ...settings }, word, playbackFailed);
}

assertEqual(
  createDefaultStorage().settings.recallPause,
  false,
  'Recall pause should default to off.'
);

assertEqual(
  normaliseStorage({
    settings: {
      englishVisible: true,
      audioPrompts: true,
      soundEffects: true,
      welshSpelling: 'flexible'
    }
  }).settings.recallPause,
  false,
  'Older stored settings without recallPause should normalize to false.'
);

assertEqual(
  promptVisible(false, makeWord()),
  false,
  'English off + audio available should keep the prompt hidden.'
);

assertEqual(
  promptVisible(false, makeWord({ audioUrl: '', audioStatus: 'missing' })),
  true,
  'English off + missing audio should show the prompt for that word.'
);

assertEqual(
  promptVisible(true, makeWord({ audioUrl: '', audioStatus: 'missing' })),
  true,
  'English on + missing audio should show the prompt as normal.'
);

const missingAudioWord = makeWord({ id: 'missing-audio-word', audioUrl: '', audioStatus: 'missing' });
const nextAudioWord = makeWord({ id: 'next-audio-word' });

assertEqual(
  promptVisible(false, missingAudioWord),
  true,
  'The fallback prompt should be visible on the missing-audio word.'
);

assertEqual(
  promptVisible(false, nextAudioWord),
  false,
  'Moving to a word with usable audio should restore normal English-off behaviour.'
);

assertEqual(
  promptVisible(false, makeWord(), true),
  true,
  'English off + playback failure should show the prompt for the failed word.'
);

assertEqual(
  shouldDelayPrompt({ recallPause: true, audioPrompts: true, englishVisible: true }, makeWord()),
  true,
  'Recall pause should delay English only when recall pause, audio prompts, English prompts, and usable audio are all enabled.'
);

const initialRecallPauseDisplay = getEnglishPromptDisplayState({
  basePromptVisible: true,
  shouldDelay: true,
  delayedVisible: false
});

assertEqual(
  initialRecallPauseDisplay.visible,
  false,
  'Recall pause should not visibly render English on the initial word render.'
);

assertEqual(
  initialRecallPauseDisplay.reserved,
  true,
  'Recall pause should reserve prompt space while English is hidden.'
);

const releasedRecallPauseDisplay = getEnglishPromptDisplayState({
  basePromptVisible: true,
  shouldDelay: true,
  delayedVisible: true
});

assertEqual(
  releasedRecallPauseDisplay.visible,
  true,
  'Recall pause should visibly render English after the delay releases.'
);

assertEqual(
  releasedRecallPauseDisplay.reserved,
  false,
  'Recall pause should stop using the hidden reserved state after release.'
);

assertEqual(
  getRecallPauseDelayMs({ prompt: 'work', answer: 'gweithio' }),
  1500,
  'Short recall pause prompts should use the minimum 1500ms delay.'
);

assertEqual(
  getRecallPauseDelayMs({ prompt: 'open window', answer: 'agor drws' }),
  1650,
  'Longer recall pause phrases should receive a longer adaptive delay.'
);

assertEqual(
  getRecallPauseDelayMs({
    prompt: 'please open the big window now',
    answer: 'agorwch y ffenestr fawr os gwelwch yn dda'
  }),
  2400,
  'Recall pause delay should cap at 2400ms.'
);

assertEqual(
  shouldDelayPrompt({ recallPause: false, audioPrompts: true, englishVisible: true }, makeWord()),
  false,
  'English should appear immediately when recall pause is off.'
);

assertEqual(
  shouldDelayPrompt({ recallPause: true, audioPrompts: false, englishVisible: true }, makeWord()),
  false,
  'Recall pause should not delay English when audio prompts are off.'
);

assertEqual(
  shouldDelayPrompt({ recallPause: true, audioPrompts: true, englishVisible: false }, makeWord()),
  false,
  'Recall pause should not delay English when English prompts are off.'
);

assertEqual(
  shouldDelayPrompt({ recallPause: true, audioPrompts: true, englishVisible: true }, makeWord({ audioUrl: '', audioStatus: 'missing' })),
  false,
  'Recall pause should fall back to immediate English when audio is unavailable.'
);

assertEqual(
  shouldDelayPrompt({ recallPause: true, audioPrompts: true, englishVisible: true }, makeWord(), true),
  false,
  'Recall pause should fall back to immediate English after playback failure.'
);

console.log('practice audio fallback tests passed');
