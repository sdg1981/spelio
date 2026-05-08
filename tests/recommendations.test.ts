import { wordLists } from '../src/data/wordLists';
import type { PracticeWord, WordList } from '../src/data/wordLists';
import { classifySession, createPracticeSession, formatRecapWordCount, getDifficultWordCount, getRecapWordCount, hasDifficultWords, selectPreSessionRecapWord } from '../src/lib/practice/sessionEngine';
import { getSelectedListLabel } from '../src/lib/practice/wordListSelection';
import {
  addLearningStats,
  applyManualWordListSelection,
  applyWordProgressPatch,
  applyPracticeStartListSelection,
  createDefaultStorage,
  normaliseStorage,
  updateListCompletion,
  type SessionResult,
  type SpelioStorage
} from '../src/lib/practice/storage';
import { getNormalContinuationRecommendation, getRecommendation, isListProgressionReady } from '../src/lib/practice/recommendations';
import { createNormalContinuationPracticeStart, createPrimaryRecommendationPracticeStart, createRecapPracticeStart, createReviewPracticeStart } from '../src/lib/practice/sessionStart';
import { addActiveInteractionTime, countLearnedSpellings, formatCumulativeProgress } from '../src/lib/practice/progress';

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
  const englishPrompt = overrides.englishPrompt ?? id;
  const welshAnswer = overrides.welshAnswer ?? id;

  return {
    id,
    listId: overrides.listId ?? 'test_missing_preferred',
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
    ...overrides,
    englishPrompt,
    welshAnswer,
    prompt: overrides.prompt ?? englishPrompt,
    answer: overrides.answer ?? welshAnswer,
    sourceLanguage: overrides.sourceLanguage ?? 'en',
    targetLanguage: overrides.targetLanguage ?? 'cy'
  };
}

function makeLargeList(id: string, startOrder: number, wordCount: number): WordList {
  return {
    id,
    collectionId: 'test',
    name: id,
    description: '',
    language: 'Welsh',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
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
    collectionId: 'test',
    name: 'Large variant single',
    description: '',
    language: 'Welsh',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
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
    collectionId: 'test',
    name: 'Missing preferred variant',
    description: '',
    language: 'Welsh',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
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
    collectionId: 'test',
    name: 'Recap selection',
    description: '',
    language: 'Welsh',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    dialect: 'Both',
    stage: 'Test',
    difficulty: 3,
    order: 1,
    isActive: true,
    words: [
      makeTestWord('active_hard_recent', 1, { listId: 'test_recap_selection', englishPrompt: 'active hard', welshAnswer: 'caled', difficulty: 5 }),
      makeTestWord('resolved_hard_recent', 2, { listId: 'test_recap_selection', englishPrompt: 'resolved hard', welshAnswer: 'anodd', difficulty: 5 }),
      makeTestWord('resolved_easy_older', 3, { listId: 'test_recap_selection', englishPrompt: 'resolved easy', welshAnswer: 'hawdd', difficulty: 2 }),
      makeTestWord('resolved_easy_seen_once', 4, { listId: 'test_recap_selection', englishPrompt: 'resolved easy once', welshAnswer: 'eto', difficulty: 1 })
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

test('incorrect and revealed words become difficult recap-due items with reset recap count', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  storage = applyWordProgressPatch(storage, numbers.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, numbers.words[1], { revealed: true }, '2026-05-05T00:00:05.000Z');

  for (const word of numbers.words.slice(0, 2)) {
    const progress = storage.wordProgress[word.id];
    assertEqual(progress?.difficult, true, 'Incorrect or revealed word should be marked difficult');
    assertEqual(progress?.recapDue, true, 'Incorrect or revealed word should become recap due');
    assertEqual(progress?.cleanRecapCount, 0, 'Incorrect or revealed word should reset clean recap count');
  }
});

test('resolved recap-due words do not keep homepage revisit or review visible', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  const difficultWord = numbers.words[0];

  storage = applyWordProgressPatch(storage, difficultWord, { incorrect: true }, '2026-05-05T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, difficultWord, { completed: true, cleanCompleted: true }, '2026-05-05T00:01:00.000Z');

  const recommendation = getRecommendation(storage, wordLists);
  const reviewSession = createPracticeSession(wordLists, storage, true, true);

  assertEqual(storage.wordProgress[difficultWord.id]?.difficult, false, 'One clean completion should resolve current difficulty');
  assertEqual(storage.wordProgress[difficultWord.id]?.recapDue, true, 'Resolved words may still be eligible for lightweight recap');
  assertEqual(getDifficultWordCount(storage, wordLists), 0, 'Homepage revisit count should use only current difficult words');
  assertEqual(hasDifficultWords(storage, wordLists), false, 'Homepage review visibility should use only current difficult words');
  assertEqual(recommendation.kind, 'list', 'Resolved recap-only words should not keep review as the primary recommendation');
  assertEqual(reviewSession.words.length, 0, 'Dedicated review should not include recap-only words');
});

test('dedicated review clears difficult after one clean completion but leaves recap due', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  storage = applyWordProgressPatch(storage, numbers.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');

  const reviewSession = createPracticeSession(wordLists, storage, true);
  assertEqual(reviewSession.words.length, 1, 'Dedicated review should use the current difficult pool only');
  assertEqual(reviewSession.words[0]?.id, numbers.words[0].id, 'Dedicated review should include the difficult word');

  storage = applyWordProgressPatch(storage, numbers.words[0], { completed: true, cleanCompleted: true }, '2026-05-05T00:01:00.000Z');

  assertEqual(storage.wordProgress[numbers.words[0].id]?.difficult, false, 'One clean review completion should clear difficult');
  assertEqual(storage.wordProgress[numbers.words[0].id]?.recapDue, true, 'Clean review completion should leave recap due for reinforcement');
});

test('From earlier uses recapDue words and starts recap mode', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  const storage: SpelioStorage = {
    ...numbersStorage(),
    wordProgress: {
      [numbers.words[0].id]: {
        seen: true,
        completedCount: 1,
        incorrectAttempts: 1,
        revealedCount: 0,
        difficult: false,
        recapDue: true,
        cleanRecapCount: 0
      },
      [numbers.words[1].id]: {
        seen: true,
        completedCount: 1,
        incorrectAttempts: 1,
        revealedCount: 0,
        difficult: true,
        recapDue: false,
        cleanRecapCount: 0
      }
    }
  };

  const recapStart = createRecapPracticeStart(storage);
  const recapSession = createPracticeSession(wordLists, recapStart.storage, recapStart.review, recapStart.recap);
  const reviewSession = createPracticeSession(wordLists, storage, true);

  assertEqual(getRecapWordCount(storage, wordLists), 1, 'From earlier count should use recapDue words');
  assertEqual(recapStart.mode, 'recap', 'From earlier should start a dedicated recap session');
  assertEqual(recapStart.review, false, 'From earlier must not start review mode');
  assertEqual(recapStart.recap, true, 'From earlier should pass recap mode');
  assertEqual(recapSession.words.length, 1, 'Dedicated recap should use the recapDue pool');
  assertEqual(recapSession.words[0]?.id, numbers.words[0].id, 'Dedicated recap should not use difficult-only words');
  assertEqual(reviewSession.words[0]?.id, numbers.words[1].id, 'Dedicated review should remain based on difficult words');
});

test('From earlier count is hidden at zero and capped above five', () => {
  assertEqual(formatRecapWordCount(0), null, 'Zero recap count should be hidden');
  assertEqual(formatRecapWordCount(1), '1', 'Single recap count should be exact');
  assertEqual(formatRecapWordCount(5), '5', 'Five recap words should remain exact');
  assertEqual(formatRecapWordCount(6), '5+', 'More than five recap words should be capped');
});

test('homepage pools keep review and From earlier visibility separate', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let emptyStorage = numbersStorage();
  assertEqual(hasDifficultWords(emptyStorage, wordLists), false, 'Empty review pool should hide Review difficult words');
  assertEqual(getRecapWordCount(emptyStorage, wordLists), 0, 'Empty recap pool should hide From earlier');

  let difficultStorage = applyWordProgressPatch(emptyStorage, numbers.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');
  difficultStorage = {
    ...difficultStorage,
    lastSessionResult: numbersResult({ correctWords: 9, incorrectWords: 1, incorrectAttempts: 1, state: 'struggled' })
  };
  assertEqual(hasDifficultWords(difficultStorage, wordLists), true, 'Difficult words should make Review difficult words visible');
  assertEqual(getRecommendation(difficultStorage, wordLists).kind, 'review', 'Difficult words after a struggled session should drive review');

  let recapOnlyStorage = applyWordProgressPatch(emptyStorage, numbers.words[1], { incorrect: true }, '2026-05-05T00:00:00.000Z');
  recapOnlyStorage = applyWordProgressPatch(recapOnlyStorage, numbers.words[1], { completed: true, cleanCompleted: true }, '2026-05-05T00:01:00.000Z');
  assertEqual(hasDifficultWords(recapOnlyStorage, wordLists), false, 'Recap-only words should not make Review difficult words visible');
  assertEqual(getRecapWordCount(recapOnlyStorage, wordLists), 1, 'Recap due words should make From earlier visible');
});

test('learned spelling count excludes currently difficult and revealed-only words', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  storage = applyWordProgressPatch(storage, numbers.words[0], { completed: true, cleanCompleted: true }, '2026-05-05T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, numbers.words[1], { incorrect: true }, '2026-05-05T00:00:05.000Z');
  storage = applyWordProgressPatch(storage, numbers.words[1], { completed: true, cleanCompleted: false }, '2026-05-05T00:00:10.000Z');
  storage = applyWordProgressPatch(storage, numbers.words[2], { revealed: true }, '2026-05-05T00:00:15.000Z');

  assertEqual(countLearnedSpellings(storage, wordLists), 1, 'Only the cleanly completed spelling should count as learned');
});

test('learned spelling count includes a previously difficult word after clean completion', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  storage = applyWordProgressPatch(storage, numbers.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, numbers.words[0], { completed: true, cleanCompleted: true }, '2026-05-05T00:01:00.000Z');

  assertEqual(countLearnedSpellings(storage, wordLists), 1, 'A resolved difficult spelling should count once it is cleanly completed');
});

test('learned spelling count does not double-count dialect variants', () => {
  const wanting = wordLists.find(list => list.id === 'stage2_phrases_wanting');
  assert(wanting, 'Expected stage2_phrases_wanting to exist');
  const variants = wanting.words.filter(word => word.variantGroupId === 'want coffee').slice(0, 2);
  assertEqual(variants.length, 2, 'Expected two variants for the setup item');

  let storage = wantingStorage('mixed');
  for (const word of variants) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-05T00:00:00.000Z');
  }

  assertEqual(countLearnedSpellings(storage, wordLists), 1, 'Sibling variants should count as one learned spelling item');
});

test('cumulative progress line hides for zero meaningful progress', () => {
  assertEqual(formatCumulativeProgress(createDefaultStorage(), wordLists), null, 'Brand new storage should not show cumulative progress');
});

test('reset progress creates storage with empty cumulative stats', () => {
  const storage = createDefaultStorage();

  assertEqual(storage.learningStats?.totalActiveMs, 0, 'Fresh storage should not retain active practice time');
  assertEqual(formatCumulativeProgress(storage, wordLists), null, 'Fresh storage should not show cumulative progress');
});

test('active practice time caps long idle gaps', () => {
  const started = 1_000;
  const afterFirstInput = addActiveInteractionTime({ wordStartedAt: started, lastInteractionAt: null, activeMs: 0 }, 6_000);
  const afterIdle = addActiveInteractionTime(afterFirstInput, 126_000);

  assertEqual(afterFirstInput.activeMs, 5_000, 'First interaction should count the initial active gap');
  assertEqual(afterIdle.activeMs, 30_000, 'Long idle gaps should only count up to the idle threshold');
});

test('learning stats store compact cumulative active time', () => {
  const storage = addLearningStats(createDefaultStorage(), 90_000, '2026-05-05T00:00:00.000Z');

  assertEqual(storage.learningStats?.totalActiveMs, 90_000, 'Active time should be stored as an aggregate');
  assertEqual(formatCumulativeProgress(storage, wordLists), '1 minute practised', 'Progress text should round down to whole practised minutes');
});

test('Review difficult words is hidden when no difficult words remain', () => {
  const storage = completeNumbersCleanly(numbersStorage());
  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(hasDifficultWords(storage), false, 'No difficult words should remain after clean completion');
  assertEqual(recommendation.kind, 'list', 'Recommendation should not be review');
  assertEqual(recommendation.title.includes('difficult'), false, 'Primary recommendation should not mention difficult words');
});

test('struggled primary action routes to difficult review only', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = completeNumbersCleanly(numbersStorage());
  storage = applyWordProgressPatch(storage, numbers.words[0], { incorrect: true }, '2026-05-05T00:01:00.000Z');
  storage = {
    ...storage,
    lastSessionResult: numbersResult({
      correctWords: 9,
      incorrectWords: 1,
      incorrectAttempts: 1,
      state: 'struggled'
    })
  };

  const recommendation = getRecommendation(storage, wordLists);
  const reviewSession = createPracticeSession(wordLists, storage, true);

  assertEqual(hasDifficultWords(storage, wordLists), true, 'Setup should leave an eligible difficult word');
  assertEqual(recommendation.kind, 'review', 'Struggled state should make review the primary recommendation');
  assertEqual(reviewSession.words.length, 1, 'Dedicated review should use only the difficult pool');
  assertEqual(reviewSession.words[0]?.id, numbers.words[0].id, 'Dedicated review should use the exact difficult word');
});

test('struggled secondary continue bypasses review and advances from a completed current list', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = completeNumbersCleanly(numbersStorage());
  storage = applyWordProgressPatch(storage, numbers.words[0], { incorrect: true }, '2026-05-05T00:01:00.000Z');
  storage = {
    ...storage,
    lastSessionResult: numbersResult({
      correctWords: 9,
      incorrectWords: 1,
      incorrectAttempts: 1,
      state: 'struggled'
    })
  };

  const primaryRecommendation = getRecommendation(storage, wordLists);
  const normalRecommendation = getNormalContinuationRecommendation(storage, wordLists);
  const normalStartStorage = applyPracticeStartListSelection(storage, normalRecommendation.listId);
  const normalSession = createPracticeSession(wordLists, normalStartStorage);

  assertEqual(primaryRecommendation.kind, 'review', 'Setup should make review the primary recommendation');
  assertEqual(normalRecommendation.kind, 'list', 'Secondary continue should use a normal recommendation');
  assertEqual(normalRecommendation.listId, 'foundations_mixed_01', 'Secondary continue should advance to the next list');
  assertEqual(normalSession.words.every(word => word.listId === 'foundations_mixed_01'), true, 'Normal continue should not start the review pool');
  assertEqual(storage.wordProgress[numbers.words[0].id]?.difficult, true, 'Normal continue routing should not clear difficult status');
});

test('homepage secondary Continue learning creates a normal start, not review', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = completeNumbersCleanly(numbersStorage());
  storage = applyWordProgressPatch(storage, numbers.words[0], { incorrect: true }, '2026-05-05T00:01:00.000Z');
  storage = {
    ...storage,
    lastSessionResult: numbersResult({
      correctWords: 9,
      incorrectWords: 1,
      incorrectAttempts: 1,
      state: 'struggled'
    })
  };

  const primaryStart = createPrimaryRecommendationPracticeStart(storage, wordLists);
  const secondaryStart = createNormalContinuationPracticeStart(storage, wordLists);
  const secondarySession = createPracticeSession(wordLists, secondaryStart.storage, secondaryStart.review);
  const reviewSession = createPracticeSession(wordLists, storage, true);

  assertEqual(primaryStart.mode, 'review', 'Primary start should be dedicated review');
  assertEqual(primaryStart.review, true, 'Primary start should pass review mode');
  assertEqual(secondaryStart.mode, 'normal', 'Homepage secondary start should be normal');
  assertEqual(secondaryStart.review, false, 'Homepage secondary start should not pass review mode');
  assertEqual(secondaryStart.recommendation?.listId, 'foundations_mixed_01', 'Homepage secondary start should use normal continuation listId');
  assertEqual(secondaryStart.storage.selectedListIds[0], 'foundations_mixed_01', 'Homepage secondary start should move to nextListId');
  assertEqual(secondarySession.words.every(word => word.listId === 'foundations_mixed_01'), true, 'Homepage secondary session pool should come from normal continuation');
  assertEqual(secondarySession.words.map(word => word.id).join('|') === reviewSession.words.map(word => word.id).join('|'), false, 'Homepage secondary session should not reuse the review-only pool');
  assertEqual(storage.wordProgress[numbers.words[0].id]?.difficult, true, 'Bypassing review should leave difficult status intact');
});

test('end-screen secondary Continue learning creates a normal start, not review', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = completeNumbersCleanly(numbersStorage());
  storage = applyWordProgressPatch(storage, numbers.words[0], { incorrect: true }, '2026-05-05T00:01:00.000Z');
  storage = {
    ...storage,
    lastSessionDate: '2026-05-05T00:01:30.000Z',
    lastSessionResult: numbersResult({
      correctWords: 9,
      incorrectWords: 1,
      incorrectAttempts: 1,
      state: 'struggled'
    })
  };

  const reviewStart = createReviewPracticeStart(storage);
  const secondaryStart = createNormalContinuationPracticeStart(storage, wordLists);
  const secondarySession = createPracticeSession(wordLists, secondaryStart.storage, secondaryStart.review);
  const reviewSession = createPracticeSession(wordLists, reviewStart.storage, reviewStart.review);

  assertEqual(reviewStart.mode, 'review', 'End primary review start should be dedicated review');
  assertEqual(reviewStart.review, true, 'End primary review start should pass review mode');
  assertEqual(secondaryStart.mode, 'normal', 'End secondary start should be normal');
  assertEqual(secondaryStart.review, false, 'End secondary start should not pass review mode');
  assertEqual(secondaryStart.storage.selectedListIds[0], 'foundations_mixed_01', 'End secondary start should move to nextListId');
  assertEqual(secondarySession.words.every(word => word.listId === 'foundations_mixed_01'), true, 'End secondary session pool should come from normal continuation');
  assertEqual(secondarySession.words.map(word => word.id).join('|') === reviewSession.words.map(word => word.id).join('|'), false, 'End secondary session should not reuse the review-only pool');
  assertEqual(storage.wordProgress[numbers.words[0].id]?.difficult, true, 'Bypassing review should leave difficult status intact');
});

test('struggled secondary continue stays on an incomplete current list', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  storage = applyWordProgressPatch(storage, numbers.words[0], { incorrect: true }, '2026-05-05T00:01:00.000Z');
  storage = {
    ...storage,
    lastSessionDate: '2026-05-05T00:01:30.000Z',
    lastSessionResult: numbersResult({
      correctWords: 9,
      incorrectWords: 1,
      incorrectAttempts: 1,
      state: 'struggled'
    })
  };

  const primaryRecommendation = getRecommendation(storage, wordLists);
  const normalRecommendation = getNormalContinuationRecommendation(storage, wordLists);

  assertEqual(primaryRecommendation.kind, 'review', 'Setup should make review the primary recommendation');
  assertEqual(normalRecommendation.kind, 'list', 'Secondary continue should remain a normal recommendation');
  assertEqual(normalRecommendation.listId, 'foundations_numbers', 'Incomplete current list should be continued before advancing');
});

test('normal continuation ignores ineligible difficult variants', () => {
  const storage = difficultWantingStorage('south_standard', 'North Wales');
  const recommendation = getRecommendation(storage, wordLists);
  const normalRecommendation = getNormalContinuationRecommendation(storage, wordLists);

  assertEqual(hasDifficultWords(storage, wordLists), false, 'North-only difficult variant should not be review-relevant in South/Standard mode');
  assertEqual(recommendation.kind, 'list', 'Primary recommendation should not expose review with no eligible difficult words');
  assertEqual(normalRecommendation.kind, 'list', 'Normal continue should still be available');
  assertEqual(normalRecommendation.listId, 'stage2_phrases_wanting', 'Normal continue should stay on the selected incomplete list');
});

test('primary action does not repeat a completed list when nextListId exists', () => {
  const storage = completeNumbersCleanly(numbersStorage());
  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(recommendation.listId === 'foundations_numbers', false, 'Completed numbers list should not repeat');
  assertEqual(recommendation.listId, 'foundations_mixed_01', 'Completed list should advance to next valid list');
});

test('continue learning advances when all eligible current-list items are seen without granting completion tick', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  for (const word of numbers.words) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-05T00:00:00.000Z');
  }

  const weakResult = numbersResult({
    correctWords: 8,
    incorrectWords: 2,
    incorrectAttempts: 2,
    state: 'struggled'
  });
  storage = updateListCompletion(
    {
      ...storage,
      lastSessionDate: '2026-05-05T00:00:30.000Z',
      lastSessionResult: weakResult
    },
    wordLists,
    weakResult
  );

  const recommendation = getNormalContinuationRecommendation(storage, wordLists);

  assertEqual(isListProgressionReady(storage, numbers), true, 'All eligible numbers items should be progression-ready once seen');
  assertEqual(storage.listProgress.foundations_numbers?.completed, false, 'Weak all-seen pass should not grant the strict completion tick');
  assertEqual(recommendation.listId, 'foundations_mixed_01', 'Continue learning should move to nextListId when all current items have been seen');
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

test('automatic recap injection selects at most one recapDue word for normal sessions only', () => {
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
  const injected = selectPreSessionRecapWord(storage, wordLists, normalSession.words);
  const reviewInjected = selectPreSessionRecapWord(storage, wordLists, normalSession.words, true);

  assertEqual(injected?.id, please.id, 'Normal sessions may receive one automatic recap word');
  assertEqual(reviewInjected, undefined, 'Dedicated review sessions should not receive automatic recap injection');
});

test('automatic recap injection avoids duplicate variantGroupId entries', () => {
  const wanting = wordLists.find(list => list.id === 'stage2_phrases_wanting');
  assert(wanting, 'Expected stage2_phrases_wanting to exist');
  const southCoffee = wanting.words.find(word => word.variantGroupId === 'want coffee' && word.dialect === 'South Wales / Standard');
  const northCoffee = wanting.words.find(word => word.variantGroupId === 'want coffee' && word.dialect === 'North Wales');
  assert(southCoffee && northCoffee, 'Expected paired want coffee variants');

  const storage: SpelioStorage = {
    ...wantingStorage('mixed'),
    completedNormalSessionCount: 2,
    wordProgress: {
      [northCoffee.id]: {
        seen: true,
        completedCount: 1,
        incorrectAttempts: 1,
        revealedCount: 0,
        difficult: false,
        recapDue: true,
        cleanRecapCount: 0
      }
    }
  };

  const injected = selectPreSessionRecapWord(storage, wordLists, [southCoffee]);

  assertEqual(injected, undefined, 'Automatic recap should not duplicate a variant group already in the session');
});

test('clean recap completions increment cleanRecapCount and clear after two passes', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  storage = applyWordProgressPatch(storage, numbers.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, numbers.words[0], { completed: true, cleanCompleted: true, recapCompletedClean: true }, '2026-05-05T00:01:00.000Z');

  assertEqual(storage.wordProgress[numbers.words[0].id]?.cleanRecapCount, 1, 'First clean recap should increment cleanRecapCount');
  assertEqual(storage.wordProgress[numbers.words[0].id]?.recapDue, true, 'First clean recap should keep recap due');

  storage = applyWordProgressPatch(storage, numbers.words[0], { completed: true, cleanCompleted: true, recapCompletedClean: true }, '2026-05-05T00:02:00.000Z');

  assertEqual(storage.wordProgress[numbers.words[0].id]?.cleanRecapCount, 2, 'Second clean recap should increment cleanRecapCount again');
  assertEqual(storage.wordProgress[numbers.words[0].id]?.recapDue, false, 'Second clean recap should clear recap due');
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

test('recommendation can advance from word progress before strict list completion is committed', () => {
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

  assertEqual(getRecommendation(staleStorage, wordLists).listId, 'foundations_mixed_01', 'All-seen word progress should be enough to recommend the next list');

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

test('mixed list fully complete without difficult words recommends choosing another list', () => {
  const storage = completeWeatherAndWorkCleanly(weatherAndWorkStorage());
  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(hasDifficultWords(storage), false, 'Clean completion should leave no difficult words');
  assertEqual(recommendation.kind, 'choose_list', 'Complete mixed selection should make choosing another list primary');
  assertEqual(recommendation.title, 'Choose another word list', 'Complete mixed selection should not use vague continue/repeat wording as primary');
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
  assertEqual(recommendation.kind, 'choose_list', 'Mixed completion should choose another list rather than progress forward');
  assertEqual(recommendation.title, 'Choose another word list', 'Mixed completion should not label repeat practice as continue');
});

test('practise this mix again action leaves selectedListIds unchanged', () => {
  const storage = completeWeatherAndWorkCleanly(weatherAndWorkStorage());
  const recommendation = getRecommendation(storage, wordLists);
  const nextStorage = applyPracticeStartListSelection(storage, recommendation.listId);

  assertEqual(recommendation.kind, 'choose_list', 'Complete mixed selection should make choose-list the primary action');
  assertEqual(recommendation.listId, undefined, 'Repeat-mix action should start without a single list ID');
  assertEqual(nextStorage.selectedListIds.join('|'), storage.selectedListIds.join('|'), 'Repeat-mix action should preserve mixed selectedListIds');
  assertEqual(nextStorage.currentPathPosition, storage.currentPathPosition, 'Repeat-mix action should not mutate mixed path position');
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
