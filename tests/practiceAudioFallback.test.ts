import { isAudioUnavailableForPrompt, shouldShowEnglishPrompt } from '../src/lib/practice/audioAvailability';
import type { PracticeWord } from '../src/data/wordLists';

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

console.log('practice audio fallback tests passed');
