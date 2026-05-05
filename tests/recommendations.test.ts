import { wordLists } from '../src/data/wordLists';
import { createPracticeSession, hasDifficultWords } from '../src/lib/practice/sessionEngine';
import { getSelectedListLabel } from '../src/lib/practice/wordListSelection';
import {
  applyWordProgressPatch,
  applyPracticeStartListSelection,
  createDefaultStorage,
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
