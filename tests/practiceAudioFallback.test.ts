import {
  getEnglishPromptDisplayState,
  getPostAnswerEnglishConfirmationDelayMs,
  getRecallPauseDelayMs,
  isAudioUnavailableForPrompt,
  shouldAllowAudioPlayback,
  shouldDelayEnglishPrompt,
  shouldShowEnglishPrompt,
  shouldShowPostAnswerEnglishConfirmation
} from '../src/lib/practice/audioAvailability';
import type { PracticeWord } from '../src/data/wordLists';
import { createDefaultStorage, normaliseStorage } from '../src/lib/practice/storage';
import { getResolvedPracticeAudioUrl } from '../src/lib/audioProvider';

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
  true,
  'Recall pause should default to on.'
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
  true,
  'Older stored settings without recallPause should normalize to the current default.'
);

assertEqual(
  normaliseStorage({
    settings: {
      recallPause: false
    }
  }).settings.recallPause,
  false,
  'Stored recallPause=false should be preserved for returning users.'
);

assertEqual(
  normaliseStorage({
    settings: {
      recallPause: true
    }
  }).settings.recallPause,
  true,
  'Stored recallPause=true should be preserved for returning users.'
);

assertEqual(
  promptVisible(false, makeWord()),
  false,
  'English off + audio available should keep the prompt hidden.'
);

assertEqual(
  isAudioUnavailableForPrompt(makeWord({
    audioUrl: 'https://example.com/audio/generated-ready.mp3',
    audioStatus: 'ready'
  })),
  false,
  'Generated/ready live audio with a valid URL should be treated as playable in practice.'
);

assertEqual(
  shouldShowPostAnswerEnglishConfirmation({
    englishVisible: false,
    practiceTestMode: false,
    audioUnavailable: false
  }),
  true,
  'English off + correct answer should show post-answer English before advancing.'
);

assertEqual(
  getPostAnswerEnglishConfirmationDelayMs('work'),
  1200,
  'Single-word post-answer English confirmation should use the 1200ms base delay.'
);

assertEqual(
  getPostAnswerEnglishConfirmationDelayMs('open the big window'),
  1650,
  'Longer post-answer English confirmations should add 150ms for each prompt word after the first.'
);

assertEqual(
  getPostAnswerEnglishConfirmationDelayMs('one two three four five six seven eight nine ten'),
  2000,
  'Post-answer English confirmation delay should cap at 2000ms.'
);

assertEqual(
  shouldShowPostAnswerEnglishConfirmation({
    englishVisible: true,
    practiceTestMode: false,
    audioUnavailable: false
  }),
  false,
  'English on should keep the existing immediate advance behaviour.'
);

assertEqual(
  shouldShowPostAnswerEnglishConfirmation({
    englishVisible: false,
    practiceTestMode: true,
    audioUnavailable: false
  }),
  false,
  'Practice test mode should never show post-answer English confirmation.'
);

assertEqual(
  shouldShowPostAnswerEnglishConfirmation({
    englishVisible: false,
    practiceTestMode: false,
    audioUnavailable: true
  }),
  false,
  'Post-answer confirmation should not add a second delay when English is already visible as an audio fallback.'
);

assertEqual(
  getResolvedPracticeAudioUrl(makeWord({
    audioUrl: 'https://example.com/audio/azure.mp3',
    elevenLabsAudioUrl: 'https://example.com/audio/elevenlabs.mp3',
    elevenLabsAudioStatus: 'generated'
  }), 'elevenlabs'),
  'https://example.com/audio/elevenlabs.mp3',
  'ElevenLabs provider should use transformed audio when it exists.'
);

assertEqual(
  getResolvedPracticeAudioUrl(makeWord({
    audioUrl: 'https://example.com/audio/azure.mp3',
    elevenLabsAudioUrl: '',
    elevenLabsAudioStatus: 'missing'
  }), 'elevenlabs'),
  'https://example.com/audio/azure.mp3',
  'ElevenLabs provider should fall back to Azure when transformed audio is missing.'
);

assertEqual(
  shouldAllowAudioPlayback(true, false),
  true,
  'Normal sessions should allow playback when audio prompts are on.'
);

assertEqual(
  shouldAllowAudioPlayback(false, false),
  true,
  'Normal sessions should keep manual audio playback available when audio prompts are off.'
);

assertEqual(
  shouldAllowAudioPlayback(false, true),
  true,
  'Practice test sessions should keep manual audio playback available when prompts are off.'
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
  2500,
  'Short recall pause prompts should use the minimum 2500ms delay.'
);

assertEqual(
  getRecallPauseDelayMs({ prompt: 'open window', answer: 'agor drws' }),
  2650,
  'Longer recall pause phrases should receive a longer adaptive delay.'
);

assertEqual(
  getRecallPauseDelayMs({
    prompt: 'please open the big window now',
    answer: 'agorwch y ffenestr fawr os gwelwch yn dda'
  }),
  3400,
  'Recall pause delay should cap at 3400ms.'
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
