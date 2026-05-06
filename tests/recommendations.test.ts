import { wordLists } from '../src/data/wordLists';
import type { PracticeWord, WordList } from '../src/data/wordLists';
import { classifySession, createPracticeSession, hasDifficultWords } from '../src/lib/practice/sessionEngine';
import { getSelectedListLabel } from '../src/lib/practice/wordListSelection';
import {
  applyWordProgressPatch,
  applyPracticeStartListSelection,
  createDefaultStorage,
  normaliseStorage,
  updateListCompletion,
  type SessionResult,
  type SpelioStorage
} from '../src/lib/practice/storage';
import { getRecommendation } from '../src/lib/practice/recommendations';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function numbersStorage(): SpelioStorage {
  return {
    ...createDefaultStorage(),
    selectedListIds: ['foundations_numbers'],
    currentPathPosition: 'foundations_numbers'
  };
}

function weatherAndWorkStorage(): SpelioStorage {
  return {
    ...createDefaultStorage(),
    selectedListIds: ['stage2_weather', 'stage2_work'],
    currentPathPosition: 'stage2_weather'
  };
}

function firstWordsStorage(dialectPreference: SpelioStorage['settings']['dialectPreference']): SpelioStorage {
  return {
    ...createDefaultStorage(),
    selectedListIds: ['foundations_first_words'],
    currentPathPosition: 'foundations_first_words',
    settings: {
      ...createDefaultStorage().settings,
      dialectPreference
    }
  };
}

function makeTestWord(id: string, order: number, overrides: Partial<PracticeWord> = {}): PracticeWord {
  return {
    id,
    listId: 'test_missing_preferred',
    englishPrompt: id,
    welshAnswer: id,
    acceptedAlternatives: [],
    audioUrl: '',
    audioStatus: 'missing',
    notes: '',
    order,
    difficulty: 1,
    dialect: 'Both',
    dialectNote: '',
    usageNote: '',
    variantGroupId: '',
    ...overrides
  };
}

function missingPreferredVariantList(): WordList {
  return {
    id: 'test_missing_preferred',
    name: 'Missing preferred variant',
    description: '',
    language: 'Welsh',
    dialect: 'Mixed',
    stage: 'Test',
    difficulty: 1,
    order: 1,
    nextListId: null,
    isActive: true,
    words: [
      ...Array.from({ length: 9 }, (_, index) => makeTestWord(`shared_${index + 1}`, index + 1)),
      makeTestWord('south_only', 10, {
        dialect: 'South Wales / Standard',
        variantGroupId: 'soft_preference'
      })
    ]
  };
}

function completeWeatherAndWorkCleanly(storage: SpelioStorage) {
  const selectedLists = wordLists.filter(list => storage.selectedListIds.includes(list.id));

  for (const list of selectedLists) {
    for (const word of list.words) {
      storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-05T00:00:00.000Z');
    }
  }

  return storage;
}

function numbersResult(overrides: Partial<SessionResult> = {}): SessionResult {
  return {
    totalWords: 10,
    correctWords: 10,
    incorrectWords: 0,
    revealedWords: 0,
    incorrectAttempts: 0,
    revealedLetters: 0,
    durationSeconds: 30,
    listIds: ['foundations_numbers'],
    state: 'strong',
    ...overrides
  };
}

function completeNumbersCleanly(storage: SpelioStorage) {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  for (const word of numbers.words) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-05T00:00:00.000Z');
  }

  const result = numbersResult();
  return updateListCompletion(
    {
      ...storage,
      lastSessionDate: '2026-05-05T00:00:30.000Z',
      lastSessionResult: result
    },
    wordLists,
    result
  );
}

function finishNumbersSession(storage: SpelioStorage, result: SessionResult) {
  return updateListCompletion(
    {
      ...storage,
      lastSessionDate: '2026-05-05T00:00:30.000Z',
      lastSessionResult: result
    },
    wordLists,
    result
  );
}

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test('completing foundations_numbers cleanly recommends foundations_mixed_01', () => {
  const storage = completeNumbersCleanly(numbersStorage());
  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(storage.listProgress.foundations_numbers?.completed, true, 'Numbers list should be marked complete');
  assertEqual(recommendation.title, 'Continue learning', 'Primary action title should stay as continue');
  assertEqual(recommendation.listId, 'foundations_mixed_01', 'Completed numbers list should advance to nextListId');
  assertEqual(recommendation.subtitle, 'Mixed Practice — Foundations', 'Primary action should show the next list name');
});

test('completing all difficult words cleanly removes them from review', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  const reviewWords = numbers.words.slice(0, 2);

  for (const word of reviewWords) {
    storage = applyWordProgressPatch(storage, word, { incorrect: true }, '2026-05-05T00:00:00.000Z');
  }

  assertEqual(hasDifficultWords(storage), true, 'Setup should create difficult words');

  for (const word of reviewWords) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-05T00:01:00.000Z');
  }

  assertEqual(hasDifficultWords(storage), false, 'Clean completion should clear difficult flags');
  assertEqual(createPracticeSession(wordLists, storage, true).words.length, 0, 'Empty review should have no words');
});

test('wrong letter then correct completion keeps word difficult and prioritises review', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  const difficultWord = numbers.words[0];

  storage = applyWordProgressPatch(storage, difficultWord, { incorrect: true }, '2026-05-05T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, difficultWord, { completed: true, cleanCompleted: false }, '2026-05-05T00:00:05.000Z');

  for (const word of numbers.words.slice(1)) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-05T00:00:10.000Z');
  }

  const base = {
    totalWords: 10,
    correctWords: 9,
    incorrectWords: 1,
    revealedWords: 0,
    incorrectAttempts: 1,
    revealedLetters: 0,
    durationSeconds: 30,
    listIds: ['foundations_numbers']
  };
  storage = finishNumbersSession(storage, { ...base, state: classifySession(base) });

  const recommendation = getRecommendation(storage, wordLists);
  assertEqual(storage.lastSessionResult?.incorrectWords, 1, 'Session should count one incorrect word');
  assertEqual(storage.lastSessionResult?.state, 'struggled', 'Any incorrect attempt should make the session struggled');
  assertEqual(storage.wordProgress[difficultWord.id]?.difficult, true, 'Word should remain difficult after same-session correction');
  assertEqual(recommendation.kind, 'review', 'Difficult word after a struggled session should be primary');
  assertEqual(recommendation.title, 'Review difficult words', 'Primary action should review difficult words');
});

test('reveal then correct completion keeps word difficult and prioritises review', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  const difficultWord = numbers.words[0];

  storage = applyWordProgressPatch(storage, difficultWord, { revealed: true }, '2026-05-05T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, difficultWord, { completed: true, cleanCompleted: false }, '2026-05-05T00:00:05.000Z');

  for (const word of numbers.words.slice(1)) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-05T00:00:10.000Z');
  }

  const base = {
    totalWords: 10,
    correctWords: 9,
    incorrectWords: 0,
    revealedWords: 1,
    incorrectAttempts: 0,
    revealedLetters: 1,
    durationSeconds: 30,
    listIds: ['foundations_numbers']
  };
  storage = finishNumbersSession(storage, { ...base, state: classifySession(base) });

  const recommendation = getRecommendation(storage, wordLists);
  assertEqual(storage.lastSessionResult?.revealedWords, 1, 'Session should count one revealed word');
  assertEqual(storage.lastSessionResult?.state, 'struggled', 'Any revealed letter should make the session struggled');
  assertEqual(storage.wordProgress[difficultWord.id]?.difficult, true, 'Word should remain difficult after same-session reveal');
  assertEqual(recommendation.kind, 'review', 'Difficult word after a struggled session should be primary');
  assertEqual(recommendation.title, 'Review difficult words', 'Primary action should review difficult words');
});

test('clean completion of a previously difficult word in a later session clears review', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  const difficultWord = numbers.words[0];

  storage = applyWordProgressPatch(storage, difficultWord, { incorrect: true }, '2026-05-05T00:00:00.000Z');
  assertEqual(storage.wordProgress[difficultWord.id]?.difficult, true, 'Setup should mark the word difficult');

  storage = applyWordProgressPatch(storage, difficultWord, { completed: true, cleanCompleted: true }, '2026-05-05T00:01:00.000Z');
  assertEqual(storage.wordProgress[difficultWord.id]?.difficult, false, 'Later clean completion should clear difficult');
  assertEqual(hasDifficultWords(storage), false, 'No current difficult words should remain');
});

test('Review difficult words is hidden when no difficult words remain', () => {
  const storage = completeNumbersCleanly(numbersStorage());
  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(hasDifficultWords(storage), false, 'No difficult words should remain after clean completion');
  assertEqual(recommendation.kind, 'list', 'Recommendation should not be review');
  assertEqual(recommendation.title.includes('difficult'), false, 'Primary recommendation should not mention difficult words');
});

test('primary action does not repeat a completed list when nextListId exists', () => {
  const storage = completeNumbersCleanly(numbersStorage());
  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(recommendation.listId === 'foundations_numbers', false, 'Completed numbers list should not repeat');
  assertEqual(recommendation.listId, 'foundations_mixed_01', 'Completed list should advance to next valid list');
});

test('recommendation uses updated progress rather than stale pre-session state', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let staleStorage = numbersStorage();
  for (const word of numbers.words) {
    staleStorage = applyWordProgressPatch(staleStorage, word, { completed: true, cleanCompleted: true }, '2026-05-05T00:00:00.000Z');
  }

  const result = numbersResult();
  staleStorage = {
    ...staleStorage,
    lastSessionDate: '2026-05-05T00:00:30.000Z',
    lastSessionResult: result
  };

  assertEqual(getRecommendation(staleStorage, wordLists).listId, 'foundations_numbers', 'Pre-commit progress should still look incomplete');

  const updatedStorage = updateListCompletion(staleStorage, wordLists, result);
  assertEqual(getRecommendation(updatedStorage, wordLists).listId, 'foundations_mixed_01', 'Post-commit progress should recommend next list');
});

test('multi-list selection keeps a mixed homepage label', () => {
  const storage = weatherAndWorkStorage();
  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(storage.selectedListIds.length, 2, 'Setup should persist both selected list IDs');
  assertEqual(storage.selectedListIds.includes('stage2_weather'), true, 'Weather should remain selected');
  assertEqual(storage.selectedListIds.includes('stage2_work'), true, 'Work should remain selected');
  assertEqual(recommendation.title, 'Continue mixed practice', 'Primary action should continue the mixed selection');
  assertEqual(recommendation.subtitle, 'Custom mixed word list', 'Homepage subtitle should not collapse to Weather only');
  assertEqual(recommendation.listId, undefined, 'Mixed recommendation should not provide a single list ID that can overwrite selection');
  assertEqual(getSelectedListLabel(storage.selectedListIds, wordLists), 'Custom mixed word list', 'Selection helper should label multi-list practice as mixed');
});

test('practice session draws Weather and Work words from the combined selection', () => {
  const session = createPracticeSession(wordLists, weatherAndWorkStorage());
  const listIds = new Set(session.words.map(word => word.listId));
  const firstTenListIds = session.words.slice(0, 10).map(word => word.listId);

  assertEqual(session.words.length, 10, 'Session should use the normal ten-word target');
  assert(listIds.has('stage2_weather'), 'Session should include Weather words');
  assert(listIds.has('stage2_work'), 'Session should include Work words');
  assertEqual(firstTenListIds.every(id => id === 'stage2_weather'), false, 'First 10 questions should not be Weather only');
  assertEqual(firstTenListIds.every(id => id === 'stage2_work'), false, 'First 10 questions should not be Work only');
});

test('mixed list partially complete recommends continuing mixed practice', () => {
  let storage = weatherAndWorkStorage();
  const weather = wordLists.find(list => list.id === 'stage2_weather');
  assert(weather, 'Expected stage2_weather to exist');

  for (const word of weather.words.slice(0, 2)) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-05T00:00:00.000Z');
  }

  const recommendation = getRecommendation(storage, wordLists);
  assertEqual(recommendation.kind, 'list', 'Partial mixed selection should remain normal practice');
  assertEqual(recommendation.title, 'Continue mixed practice', 'Partial mixed selection should continue mixed practice');
  assertEqual(recommendation.subtitle, 'Custom mixed word list', 'Subtitle should reference the mixed selection');
  assertEqual(recommendation.listId, undefined, 'Partial mixed recommendation should not carry a single list ID');
});

test('mixed list fully complete without difficult words recommends practising again', () => {
  const storage = completeWeatherAndWorkCleanly(weatherAndWorkStorage());
  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(hasDifficultWords(storage), false, 'Clean completion should leave no difficult words');
  assertEqual(recommendation.kind, 'list', 'Complete mixed selection should remain repeatable practice');
  assertEqual(recommendation.title, 'Practise again', 'Complete mixed selection should be labelled as repeat practice');
  assertEqual(recommendation.subtitle, 'You’ve completed this mixed selection', 'Subtitle should explain the mixed selection is complete');
  assertEqual(recommendation.listId, undefined, 'Complete mixed recommendation should not carry a nextListId');
});

test('mixed list fully complete with difficult words prioritises review', () => {
  let storage = completeWeatherAndWorkCleanly(weatherAndWorkStorage());
  const weather = wordLists.find(list => list.id === 'stage2_weather');
  assert(weather, 'Expected stage2_weather to exist');
  storage = applyWordProgressPatch(storage, weather.words[0], { incorrect: true }, '2026-05-05T00:01:00.000Z');

  const recommendation = getRecommendation(storage, wordLists);
  assertEqual(hasDifficultWords(storage), true, 'Setup should create a difficult word');
  assertEqual(recommendation.kind, 'review', 'Difficult words should become the mixed primary action');
  assertEqual(recommendation.title, 'Review difficult words', 'Mixed selection with difficult words should prioritise review');
  assertEqual(recommendation.listId, undefined, 'Mixed review should not carry a single selected list ID');
});

test('mixed selection never follows nextListId after completion', () => {
  const storage = {
    ...completeWeatherAndWorkCleanly(weatherAndWorkStorage()),
    lastSessionDate: '2026-05-05T00:00:30.000Z',
    lastSessionResult: {
      totalWords: 10,
      correctWords: 10,
      incorrectWords: 0,
      revealedWords: 0,
      incorrectAttempts: 0,
      revealedLetters: 0,
      durationSeconds: 30,
      listIds: ['stage2_weather', 'stage2_work'],
      state: 'strong'
    } satisfies SessionResult
  };
  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(recommendation.listId, undefined, 'Mixed completion should not recommend any nextListId');
  assertEqual(recommendation.title, 'Practise again', 'Mixed completion should repeat rather than progress forward');
});

test('mixed primary action leaves selectedListIds unchanged', () => {
  const storage = weatherAndWorkStorage();
  const recommendation = getRecommendation(storage, wordLists);
  const nextStorage = applyPracticeStartListSelection(storage, recommendation.listId);

  assertEqual(recommendation.listId, undefined, 'Mixed primary recommendation should start without a single list ID');
  assertEqual(nextStorage.selectedListIds.join('|'), storage.selectedListIds.join('|'), 'Primary action should preserve mixed selectedListIds');
  assertEqual(nextStorage.currentPathPosition, storage.currentPathPosition, 'Primary action should not mutate mixed path position');
});

test('older storage without dialectPreference defaults to Mixed Welsh', () => {
  const storage = normaliseStorage({
    selectedListIds: ['foundations_first_words'],
    currentPathPosition: 'foundations_first_words',
    settings: {
      englishVisible: true,
      audioPrompts: true,
      soundEffects: true,
      welshSpelling: 'flexible'
    }
  });

  assertEqual(storage.settings.dialectPreference, 'mixed', 'Missing dialectPreference should normalize to mixed');
});

test('North Wales preference selects the North Wales variant where available', () => {
  const session = createPracticeSession(wordLists, firstWordsStorage('north'));
  const nowVariant = session.words.find(word => word.variantGroupId === 'now');

  assert(nowVariant, 'Expected first words session to include the now variant group');
  assertEqual(nowVariant.dialect, 'North Wales', 'North preference should choose the North Wales variant');
  assertEqual(nowVariant.welshAnswer, 'rwan', 'North preference should choose rwan for now');
});

test('South Wales / Standard preference selects the South/Standard variant where available', () => {
  const session = createPracticeSession(wordLists, firstWordsStorage('south_standard'));
  const nowVariant = session.words.find(word => word.variantGroupId === 'now');

  assert(nowVariant, 'Expected first words session to include the now variant group');
  assertEqual(nowVariant.dialect, 'South Wales / Standard', 'South/Standard preference should choose the South/Standard variant');
  assertEqual(nowVariant.welshAnswer, 'nawr', 'South/Standard preference should choose nawr for now');
});

test('missing preferred variants do not shrink a normal session', () => {
  const storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: ['test_missing_preferred'],
    currentPathPosition: 'test_missing_preferred',
    settings: {
      ...createDefaultStorage().settings,
      dialectPreference: 'north'
    }
  };
  const session = createPracticeSession([missingPreferredVariantList()], storage);

  assertEqual(session.words.length, 10, 'Soft dialect preference should keep the ten prompt slots when enough items exist');
  assert(session.words.some(word => word.id === 'south_only'), 'Best available single variant should remain eligible');
});

test('Mixed Welsh does not show both variants from one variantGroupId in an ordinary session', () => {
  const session = createPracticeSession(wordLists, firstWordsStorage('mixed'));
  const nowVariants = session.words.filter(word => word.variantGroupId === 'now');

  assertEqual(nowVariants.length, 1, 'Mixed Welsh should choose one now variant in a normal session');
});
