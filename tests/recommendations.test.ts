import { wordLists } from '../src/data/wordLists';
import type { PracticeWord, WordList } from '../src/data/wordLists';
import { classifySession, createPracticeSession, hasDifficultWords, selectPreSessionRecapWord } from '../src/lib/practice/sessionEngine';
import { getSelectedListLabel } from '../src/lib/practice/wordListSelection';
import {
  applyManualWordListSelection,
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

function wantingStorage(dialectPreference: SpelioStorage['settings']['dialectPreference']): SpelioStorage {
  return {
    ...createDefaultStorage(),
    selectedListIds: ['stage2_phrases_wanting'],
    currentPathPosition: 'stage2_phrases_wanting',
    settings: {
      ...createDefaultStorage().settings,
      dialectPreference
    }
  };
}

function wantingVariantWords(storage: SpelioStorage) {
  const targetGroups = new Set(['want coffee', 'want food', 'want help', 'want to go', 'want to learn']);
  return createPracticeSession(wordLists, storage).words.filter(word => targetGroups.has(word.variantGroupId ?? ''));
}

function difficultWantingStorage(
  dialectPreference: SpelioStorage['settings']['dialectPreference'],
  variantDialect: PracticeWord['dialect'] = 'South Wales / Standard',
  variantGroupId = 'want coffee'
) {
  const wanting = wordLists.find(list => list.id === 'stage2_phrases_wanting');
  assert(wanting, 'Expected stage2_phrases_wanting to exist');
  const difficultWord = wanting.words.find(word => word.variantGroupId === variantGroupId && word.dialect === variantDialect);
  assert(difficultWord, `Expected a ${variantDialect} ${variantGroupId} variant`);

  return applyWordProgressPatch(
    {
      ...wantingStorage(dialectPreference),
      lastSessionResult: {
        totalWords: 10,
        correctWords: 9,
        incorrectWords: 1,
        revealedWords: 0,
        incorrectAttempts: 1,
        revealedLetters: 0,
        durationSeconds: 30,
        listIds: ['stage2_phrases_wanting'],
        state: 'struggled'
      }
    },
    difficultWord,
    { incorrect: true },
    '2026-05-05T00:00:00.000Z'
  );
}

function markWantingWordDifficult(storage: SpelioStorage, predicate: (word: PracticeWord) => boolean) {
  const wanting = wordLists.find(list => list.id === 'stage2_phrases_wanting');
  assert(wanting, 'Expected stage2_phrases_wanting to exist');
  const word = wanting.words.find(predicate);
  assert(word, 'Expected matching wanting word');
  return applyWordProgressPatch(storage, word, { incorrect: true }, '2026-05-05T00:00:00.000Z');
}

function makeTestWord(id: string, order: number, overrides: Partial<PracticeWord> = {}): PracticeWord {
  return {
    id,
    listId: overrides.listId ?? 'test_missing_preferred',
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

function makeLargeList(id: string, startOrder: number, wordCount: number): WordList {
  return {
    id,
    name: id,
    description: '',
    language: 'Welsh',
    dialect: 'Both',
    stage: 'Test',
    difficulty: 1,
    order: startOrder,
    nextListId: null,
    isActive: true,
    words: Array.from({ length: wordCount }, (_, index) => makeTestWord(`${id}_${index + 1}`, index + 1, {
      listId: id,
      englishPrompt: `${id} ${index + 1}`,
      welshAnswer: `${id}${index + 1}`
    }))
  };
}

function makeLargeVariantList(): WordList {
  const id = 'test_large_variant_single';
  return {
    id,
    name: 'Large variant single',
    description: '',
    language: 'Welsh',
    dialect: 'Mixed',
    stage: 'Test',
    difficulty: 1,
    order: 1,
    nextListId: null,
    isActive: true,
    words: [
      ...Array.from({ length: 12 }, (_, index) => [
        makeTestWord(`${id}_south_${index + 1}`, index + 1, {
          listId: id,
          englishPrompt: `variant item ${index + 1}`,
          welshAnswer: `south${index + 1}`,
          dialect: 'South Wales / Standard',
          variantGroupId: `variant_item_${index + 1}`
        }),
        makeTestWord(`${id}_north_${index + 1}`, index + 1, {
          listId: id,
          englishPrompt: `variant item ${index + 1}`,
          welshAnswer: `north${index + 1}`,
          dialect: 'North Wales',
          variantGroupId: `variant_item_${index + 1}`
        })
      ]).flat(),
      ...Array.from({ length: 12 }, (_, index) => makeTestWord(`${id}_plain_${index + 1}`, index + 13, {
        listId: id,
        englishPrompt: `plain item ${index + 1}`,
        welshAnswer: `plain${index + 1}`
      }))
    ].flat()
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

function recapSelectionList(): WordList {
  return {
    id: 'test_recap_selection',
    name: 'Recap selection',
    description: '',
    language: 'Welsh',
    dialect: 'Both',
    stage: 'Test',
    difficulty: 3,
    order: 1,
    isActive: true,
    words: [
      {
        id: 'active_hard_recent',
        listId: 'test_recap_selection',
        englishPrompt: 'active hard',
        welshAnswer: 'caled',
        order: 1,
        difficulty: 5,
        dialect: 'Both'
      },
      {
        id: 'resolved_hard_recent',
        listId: 'test_recap_selection',
        englishPrompt: 'resolved hard',
        welshAnswer: 'anodd',
        order: 2,
        difficulty: 5,
        dialect: 'Both'
      },
      {
        id: 'resolved_easy_older',
        listId: 'test_recap_selection',
        englishPrompt: 'resolved easy',
        welshAnswer: 'hawdd',
        order: 3,
        difficulty: 2,
        dialect: 'Both'
      },
      {
        id: 'resolved_easy_seen_once',
        listId: 'test_recap_selection',
        englishPrompt: 'resolved easy once',
        welshAnswer: 'eto',
        order: 4,
        difficulty: 1,
        dialect: 'Both'
      }
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

function completeListCleanly(storage: SpelioStorage, listId: string) {
  const list = wordLists.find(item => item.id === listId);
  assert(list, `Expected ${listId} to exist`);

  for (const word of list.words) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-05T00:00:00.000Z');
  }

  const result: SessionResult = {
    totalWords: 10,
    correctWords: 10,
    incorrectWords: 0,
    revealedWords: 0,
    incorrectAttempts: 0,
    revealedLetters: 0,
    durationSeconds: 30,
    listIds: [listId],
    state: 'strong'
  };

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

function completeSessionWordsCleanly(storage: SpelioStorage, words: PracticeWord[], listIds: string[]) {
  for (const word of words) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-05T00:00:00.000Z');
  }

  const result: SessionResult = {
    totalWords: words.length,
    correctWords: words.length,
    incorrectWords: 0,
    revealedWords: 0,
    incorrectAttempts: 0,
    revealedLetters: 0,
    durationSeconds: 30,
    listIds,
    state: 'strong'
  };

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

function testLearningItemKey(word: PracticeWord) {
  const groupId = word.variantGroupId?.trim();
  return groupId ? `${word.listId}:${groupId}` : `${word.listId}:${word.id}`;
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

test('single-list progression starts the next recommended list with a fresh normal pool', () => {
  let storage = firstWordsStorage('mixed');
  const firstSession = createPracticeSession(wordLists, storage);

  assert(firstSession.words.some(word => word.englishPrompt === 'please'), 'Setup should include please in the first words session');

  storage = completeSessionWordsCleanly(storage, firstSession.words, ['foundations_first_words']);
  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(recommendation.listId, 'foundations_verbs', 'Completed first words should recommend first verbs');

  storage = applyPracticeStartListSelection(storage, recommendation.listId);
  const nextSession = createPracticeSession(wordLists, storage);

  assertEqual(nextSession.words.length, 10, 'Next normal session should keep the ten-word target');
  assertEqual(nextSession.words.every(word => word.listId === 'foundations_verbs'), true, 'Next normal session should use only First Verbs words');
  assertEqual(nextSession.words.some(word => word.englishPrompt === 'please'), false, 'Please must not leak into the First Verbs normal pool');
});

test('starting a later session with the same mixed selection prioritises unseen words', () => {
  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: ['stage2_food', 'stage2_people', 'stage2_work'],
    currentPathPosition: 'stage2_food'
  };
  const firstSession = createPracticeSession(wordLists, storage);

  storage = completeSessionWordsCleanly(storage, firstSession.words, firstSession.listIds);
  const secondSession = createPracticeSession(wordLists, storage);
  const firstSessionIds = new Set(firstSession.words.map(word => word.id));
  const repeatedWords = secondSession.words.filter(word => firstSessionIds.has(word.id));

  assertEqual(firstSession.words.length, 10, 'Setup first mixed session should use ten words');
  assertEqual(secondSession.words.length, 10, 'Second mixed session should use ten words');
  assertEqual(repeatedWords.length, 0, 'Second mixed session should draw unseen words before repeating session one');
});

test('single selected 20+ word pool excludes cleanly completed words while unseen words remain', () => {
  const largeList = makeLargeList('test_large_single', 1, 24);
  const lists = [largeList];
  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: [largeList.id],
    currentPathPosition: largeList.id
  };
  const firstSession = createPracticeSession(lists, storage);

  storage = completeSessionWordsCleanly(storage, firstSession.words, firstSession.listIds);
  const secondSession = createPracticeSession(lists, storage);
  const firstSessionIds = new Set(firstSession.words.map(word => word.id));

  assertEqual(firstSession.words.length, 10, 'First large-list session should use ten words');
  assertEqual(secondSession.words.length, 10, 'Second large-list session should use ten words');
  assertEqual(secondSession.words.some(word => firstSessionIds.has(word.id)), false, 'Second large-list session should exclude cleanly completed words while unseen words remain');
});

test('single selected variant pool excludes completed learning items while unseen items remain', () => {
  const largeList = makeLargeVariantList();
  const lists = [largeList];
  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: [largeList.id],
    currentPathPosition: largeList.id,
    settings: {
      ...createDefaultStorage().settings,
      dialectPreference: 'mixed'
    }
  };
  const firstSession = createPracticeSession(lists, storage);

  storage = completeSessionWordsCleanly(storage, firstSession.words, firstSession.listIds);
  const secondSession = createPracticeSession(lists, storage);
  const firstSessionItems = new Set(firstSession.words.map(testLearningItemKey));
  const repeatedItems = secondSession.words.filter(word => firstSessionItems.has(testLearningItemKey(word)));

  assertEqual(firstSession.words.length, 10, 'First variant-list session should use ten words');
  assertEqual(secondSession.words.length, 10, 'Second variant-list session should use ten words');
  assertEqual(repeatedItems.length, 0, 'Second variant-list session should not use sibling variants from completed learning items while unseen items remain');
});

test('three selected 20+ word pools exclude cleanly completed words while unseen words remain', () => {
  const lists = [
    makeLargeList('test_large_multi_a', 1, 12),
    makeLargeList('test_large_multi_b', 2, 12),
    makeLargeList('test_large_multi_c', 3, 12)
  ];
  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: lists.map(list => list.id),
    currentPathPosition: lists[0].id
  };
  const firstSession = createPracticeSession(lists, storage);

  storage = completeSessionWordsCleanly(storage, firstSession.words, firstSession.listIds);
  const secondSession = createPracticeSession(lists, storage);
  const firstSessionIds = new Set(firstSession.words.map(word => word.id));

  assertEqual(firstSession.words.length, 10, 'First three-list session should use ten words');
  assertEqual(secondSession.words.length, 10, 'Second three-list session should use ten words');
  assertEqual(secondSession.words.some(word => firstSessionIds.has(word.id)), false, 'Second three-list session should exclude cleanly completed words while unseen words remain');
});

test('pre-session recap is separate from the next normal session pool', () => {
  const firstWords = wordLists.find(list => list.id === 'foundations_first_words');
  assert(firstWords, 'Expected foundations_first_words to exist');
  const please = firstWords.words.find(word => word.englishPrompt === 'please');
  assert(please, 'Expected please to exist in first words');

  let storage = firstWordsStorage('mixed');
  storage = applyWordProgressPatch(storage, please, { incorrect: true }, '2026-05-05T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, please, { completed: true, cleanCompleted: true }, '2026-05-05T00:01:00.000Z');
  storage = {
    ...storage,
    selectedListIds: ['foundations_verbs'],
    currentPathPosition: 'foundations_verbs',
    completedNormalSessionCount: 2
  };

  const normalSession = createPracticeSession(wordLists, storage);
  const recapWord = selectPreSessionRecapWord(storage, wordLists, normalSession.words);

  assertEqual(recapWord?.id, please.id, 'Please may appear only as the labelled Quick recap word');
  assertEqual(normalSession.words.some(word => word.id === please.id), false, 'Quick recap word must not be inserted into the normal ten-word pool');
  assertEqual(normalSession.words.every(word => word.listId === 'foundations_verbs'), true, 'Normal session should still use the intended current list');
});

test('ordinary continue learning does not use difficult review words from another list', () => {
  const firstWords = wordLists.find(list => list.id === 'foundations_first_words');
  assert(firstWords, 'Expected foundations_first_words to exist');
  const please = firstWords.words.find(word => word.englishPrompt === 'please');
  assert(please, 'Expected please to exist in first words');

  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: ['foundations_verbs'],
    currentPathPosition: 'foundations_verbs'
  };
  storage = applyWordProgressPatch(storage, please, { incorrect: true }, '2026-05-05T00:00:00.000Z');

  const normalSession = createPracticeSession(wordLists, storage);
  const reviewSession = createPracticeSession(wordLists, storage, true);

  assertEqual(normalSession.words.some(word => word.id === please.id), false, 'Normal continue learning should not pull difficult words from another list');
  assertEqual(reviewSession.words.some(word => word.id === please.id), true, 'Difficult word should remain available only in explicit review mode');
});

test('manual list selection invalidates stale next-list recommendation', () => {
  const wantingListId = 'stage2_phrases_wanting';
  const nextListId = 'stage3_f_vs_ff';
  const completedWantingStorage = completeListCleanly(
    {
      ...createDefaultStorage(),
      selectedListIds: [wantingListId],
      currentPathPosition: wantingListId
    },
    wantingListId
  );

  assertEqual(getRecommendation(completedWantingStorage, wordLists).listId, nextListId, 'Setup should advance from the just-practised completed list');

  const manuallySelectedStorage = applyManualWordListSelection(completedWantingStorage, [wantingListId]);
  const recommendation = getRecommendation(manuallySelectedStorage, wordLists);

  assertEqual(manuallySelectedStorage.selectedListIds[0], wantingListId, 'Manual selection should persist the selected list');
  assertEqual(manuallySelectedStorage.currentPathPosition, wantingListId, 'Manual selection should reset path position to the first selected list');
  assertEqual(manuallySelectedStorage.lastSessionResult, null, 'Manual selection should invalidate stale session-derived recommendation state');
  assertEqual(recommendation.listId, wantingListId, 'Manual selection should recommend the selected list, not the previous next list');
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

test('Mixed Welsh balances North and South variants across paired wanting groups', () => {
  const session = createPracticeSession(wordLists, wantingStorage('mixed'));
  const variants = wantingVariantWords(wantingStorage('mixed'));

  assertEqual(session.words.length, 10, 'Dialect balancing should not reduce the normal session size');
  assert(variants.some(word => word.dialect === 'North Wales'), 'Mixed Welsh should include at least one North Wales wanting variant');
  assert(variants.some(word => word.dialect === 'South Wales / Standard' || word.dialect === 'Standard'), 'Mixed Welsh should include at least one South/Standard wanting variant');
});

test('North Wales mode still prefers North variants across paired wanting groups', () => {
  const variants = wantingVariantWords(wantingStorage('north'));

  assert(variants.length > 1, 'Setup should include multiple wanting variant groups');
  assertEqual(variants.every(word => word.dialect === 'North Wales'), true, 'North Wales preference should keep choosing North variants');
});

test('South Wales / Standard mode still prefers South/Standard variants across paired wanting groups', () => {
  const variants = wantingVariantWords(wantingStorage('south_standard'));

  assert(variants.length > 1, 'Setup should include multiple wanting variant groups');
  assertEqual(variants.every(word => word.dialect === 'South Wales / Standard' || word.dialect === 'Standard'), true, 'South/Standard preference should keep choosing South/Standard variants');
});

test('Review difficult words does not substitute a difficult North Wales variant after switching to South/Standard', () => {
  const storage = difficultWantingStorage('south_standard', 'North Wales');
  const session = createPracticeSession(wordLists, storage, true);
  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(hasDifficultWords(storage, wordLists), false, 'North-only difficult variant should not be review-relevant in South/Standard mode');
  assertEqual(recommendation.kind, 'list', 'Irrelevant old North variant should not drive review recommendation');
  assertEqual(session.words.length, 0, 'Review should not substitute the South/Standard sibling variant');
});

test('Review difficult words does not substitute a difficult South/Standard variant after switching to North Wales', () => {
  const storage = difficultWantingStorage('north', 'South Wales / Standard');
  const session = createPracticeSession(wordLists, storage, true);
  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(hasDifficultWords(storage, wordLists), false, 'South/Standard-only difficult variant should not be review-relevant in North Wales mode');
  assertEqual(recommendation.kind, 'list', 'Irrelevant old South/Standard variant should not drive review recommendation');
  assertEqual(session.words.length, 0, 'Review should not substitute the North Wales sibling variant');
});

test('Both difficult words remain reviewable under North and South/Standard preferences', () => {
  const northStorage = markWantingWordDifficult(wantingStorage('north'), word => word.englishPrompt === 'need help');
  const southStorage = markWantingWordDifficult(wantingStorage('south_standard'), word => word.englishPrompt === 'need help');
  const northSession = createPracticeSession(wordLists, northStorage, true);
  const southSession = createPracticeSession(wordLists, southStorage, true);

  assertEqual(hasDifficultWords(northStorage, wordLists), true, 'Both difficult word should be reviewable in North Wales mode');
  assertEqual(hasDifficultWords(southStorage, wordLists), true, 'Both difficult word should be reviewable in South/Standard mode');
  assertEqual(northSession.words[0]?.welshAnswer, 'angen help', 'North review should include the exact Both difficult word');
  assertEqual(southSession.words[0]?.welshAnswer, 'angen help', 'South/Standard review should include the exact Both difficult word');
});

test('Mixed Welsh reviews eligible North, South, and Both difficult words without duplicate variant groups', () => {
  let storage = wantingStorage('mixed');
  storage = markWantingWordDifficult(storage, word => word.variantGroupId === 'want coffee' && word.dialect === 'North Wales');
  storage = markWantingWordDifficult(storage, word => word.variantGroupId === 'want food' && word.dialect === 'South Wales / Standard');
  storage = markWantingWordDifficult(storage, word => word.variantGroupId === 'want food' && word.dialect === 'North Wales');
  storage = markWantingWordDifficult(storage, word => word.englishPrompt === 'need help');

  const session = createPracticeSession(wordLists, storage, true);
  const groups = session.words
    .map(word => word.variantGroupId?.trim())
    .filter((groupId): groupId is string => Boolean(groupId));

  assert(session.words.some(word => word.dialect === 'North Wales'), 'Mixed review should include an exact North difficult variant');
  assert(session.words.some(word => word.dialect === 'South Wales / Standard'), 'Mixed review should include an exact South/Standard difficult variant');
  assert(session.words.some(word => word.dialect === 'Both'), 'Mixed review should include an exact Both difficult word');
  assertEqual(groups.length, new Set(groups).size, 'Mixed review should avoid duplicate variantGroupId entries');
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
  const session = createPracticeSession(wordLists, wantingStorage('mixed'));
  const groups = session.words
    .map(word => word.variantGroupId?.trim())
    .filter((groupId): groupId is string => Boolean(groupId));

  assertEqual(groups.length, new Set(groups).size, 'Mixed Welsh should choose at most one variant per variantGroupId in a normal session');
});

test('pre-session recap prefers resolved confidence-building words without repeating one already recapped', () => {
  const list = recapSelectionList();
  const storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: [list.id],
    currentPathPosition: list.id,
    completedNormalSessionCount: 2,
    wordProgress: {
      active_hard_recent: {
        seen: true,
        completedCount: 1,
        incorrectAttempts: 1,
        revealedCount: 0,
        difficult: true,
        recapDue: true,
        cleanRecapCount: 0,
        lastPractisedAt: '2026-05-04T10:00:00.000Z'
      },
      resolved_hard_recent: {
        seen: true,
        completedCount: 2,
        incorrectAttempts: 1,
        revealedCount: 0,
        difficult: false,
        recapDue: true,
        cleanRecapCount: 0,
        lastPractisedAt: '2026-05-05T10:00:00.000Z'
      },
      resolved_easy_older: {
        seen: true,
        completedCount: 2,
        incorrectAttempts: 1,
        revealedCount: 0,
        difficult: false,
        recapDue: true,
        cleanRecapCount: 0,
        lastPractisedAt: '2026-05-03T10:00:00.000Z'
      },
      resolved_easy_seen_once: {
        seen: true,
        completedCount: 3,
        incorrectAttempts: 1,
        revealedCount: 0,
        difficult: false,
        recapDue: true,
        cleanRecapCount: 1,
        lastPractisedAt: '2026-05-06T10:00:00.000Z'
      }
    }
  };

  const selected = selectPreSessionRecapWord(storage, [list], []);

  assertEqual(selected?.id, 'resolved_easy_older', 'Quick recap should prefer resolved, lower/moderate words that have not already had a clean recap pass');
});
