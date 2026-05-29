import { wordLists } from '../src/data/wordLists';
import type { PracticeWord, WordList } from '../src/data/wordLists';
import { createSupportWordLists, findSupportWordList, isSupportWordList, mainWordLists, withSupportWordLists } from '../src/data/supportWordLists';
import { classifySession, createPracticeSession, formatRecapWordCount, getDifficultWordCount, getDifficultWordCountInList, getRecapWordCount, hasDifficultWords, selectPreSessionRecapWord } from '../src/lib/practice/sessionEngine';
import { getSelectedListLabel, normalizeSingleSelectedListIds, normalizeStorageWordListSelection, selectSingleWordList } from '../src/lib/practice/wordListSelection';
import {
  addLearningStats,
  addMixedWelshExposure,
  applyManualWordListSelection,
  applyWordProgressPatch,
  applyPracticeStartListSelection,
  createDefaultStorage,
  getFullyCompletedListIds,
  getInProgressListIds,
  isListFullyComplete,
  normaliseStorage,
  updateListCompletion,
  updateReviewCompletion,
  type SessionResult,
  type SpelioStorage
} from '../src/lib/practice/storage';
import { getNormalContinuationRecommendation, getRecommendation, isListProgressionReady } from '../src/lib/practice/recommendations';
import { createDetachedSupportPracticeStart, createDetachedSupportReviewPracticeStart, createNormalContinuationPracticeStart, createPrimaryRecommendationPracticeStart, createRecapPracticeStart, createReviewPracticeStart } from '../src/lib/practice/sessionStart';
import { addActiveInteractionTime, countLearnedSpellings, formatCumulativeProgress } from '../src/lib/practice/progress';
import { validateImportPayload } from '../src/admin/repositories/importValidation';

declare function require(name: string): { readFileSync(path: string, encoding: string): string };

const { readFileSync } = require('fs');

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

test('brand-new storage defaults to the Welsh Foundations D / DD list', () => {
  const storage = createDefaultStorage();

  assertEqual(storage.selectedListIds.length, 1, 'Brand-new storage should select one list.');
  assertEqual(storage.selectedListIds[0], 'foundation_patterns_d_dd', 'Brand-new storage should start at D / DD.');
  assertEqual(storage.currentPathPosition, 'foundation_patterns_d_dd', 'Brand-new path position should start at D / DD.');
});

test('stored selected list and current path are preserved for existing learners', () => {
  const storage = normaliseStorage({
    selectedListIds: ['foundations_numbers'],
    currentPathPosition: 'foundations_numbers',
    hasStartedPracticeSession: true
  });

  assertEqual(storage.selectedListIds[0], 'foundations_numbers', 'Existing stored selection should not be overwritten by the new default.');
  assertEqual(storage.currentPathPosition, 'foundations_numbers', 'Existing stored path position should not be overwritten by the new default.');
});

test('new default falls back safely if D / DD is missing or inactive', () => {
  const storage = createDefaultStorage();
  const listsWithoutDefault = wordLists.filter(list => list.id !== 'foundation_patterns_d_dd');
  const inactiveDefaultList: WordList = {
    ...wordLists[0],
    id: 'foundation_patterns_d_dd',
    name: 'D / DD',
    isActive: false
  };
  const normalized = normalizeStorageWordListSelection(storage, listsWithoutDefault);
  const normalizedWithInactiveDefault = normalizeStorageWordListSelection(storage, [inactiveDefaultList, ...listsWithoutDefault]);

  assertEqual(normalized.selectedListIds[0], 'foundations_first_words', 'Missing or inactive D / DD should fall back to the first usable main list.');
  assertEqual(normalized.currentPathPosition, 'foundations_first_words', 'Current path should follow the safe fallback list.');
  assertEqual(normalizedWithInactiveDefault.selectedListIds[0], 'foundations_first_words', 'Inactive D / DD should fall back to the first usable main list.');
  assertEqual(normalizedWithInactiveDefault.currentPathPosition, 'foundations_first_words', 'Inactive D / DD path should follow the safe fallback list.');
});

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

function singleVariantGroupList(id: string, order: number): WordList {
  return {
    id,
    collectionId: 'test',
    name: id,
    description: '',
    language: 'Welsh',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    dialect: 'Mixed',
    stage: 'Test',
    difficulty: 1,
    order,
    nextListId: null,
    isActive: true,
    words: [
      makeTestWord(`${id}_south`, 1, {
        listId: id,
        englishPrompt: `${id} shared`,
        welshAnswer: `${id} south`,
        dialect: 'South Wales / Standard',
        variantGroupId: 'shared'
      }),
      makeTestWord(`${id}_north`, 2, {
        listId: id,
        englishPrompt: `${id} shared`,
        welshAnswer: `${id} north`,
        dialect: 'North Wales',
        variantGroupId: 'shared'
      }),
      ...Array.from({ length: 9 }, (_, index) => makeTestWord(`${id}_plain_${index + 1}`, index + 3, {
        listId: id,
        englishPrompt: `${id} plain ${index + 1}`,
        welshAnswer: `${id}plain${index + 1}`
      }))
    ]
  };
}

function unavoidableBeforeChoicefulList(): WordList {
  const id = 'test_unavoidable_before_choiceful';

  return {
    id,
    collectionId: 'test',
    name: id,
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
      makeTestWord(`${id}_south_only`, 1, {
        listId: id,
        englishPrompt: 'south only',
        welshAnswer: 'south only',
        dialect: 'South Wales / Standard',
        variantGroupId: 'south_only'
      }),
      makeTestWord(`${id}_choice_south`, 2, {
        listId: id,
        englishPrompt: 'choiceful',
        welshAnswer: 'choice south',
        dialect: 'South Wales / Standard',
        variantGroupId: 'choiceful'
      }),
      makeTestWord(`${id}_choice_north`, 3, {
        listId: id,
        englishPrompt: 'choiceful',
        welshAnswer: 'choice north',
        dialect: 'North Wales',
        variantGroupId: 'choiceful'
      }),
      makeTestWord(`${id}_north_ungrouped`, 4, {
        listId: id,
        englishPrompt: 'ungrouped north',
        welshAnswer: 'ungrouped north',
        dialect: 'North Wales'
      })
    ]
  };
}

function dialectCompletionList(): WordList {
  const id = 'test_dialect_completion';

  return {
    id,
    collectionId: 'test',
    name: 'Dialect completion',
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
      ...Array.from({ length: 9 }, (_, index) => makeTestWord(`${id}_plain_${index + 1}`, index + 1, {
        listId: id,
        englishPrompt: `plain ${index + 1}`,
        welshAnswer: `plain${index + 1}`
      })),
      makeTestWord(`${id}_south_now`, 10, {
        listId: id,
        englishPrompt: 'now',
        welshAnswer: 'nawr',
        dialect: 'South Wales / Standard',
        variantGroupId: 'now'
      }),
      makeTestWord(`${id}_north_now`, 10, {
        listId: id,
        englishPrompt: 'now',
        welshAnswer: 'rwan',
        dialect: 'North Wales',
        variantGroupId: 'now'
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

function completeListCleanlyInLists(storage: SpelioStorage, lists: WordList[], listId: string) {
  const list = lists.find(item => item.id === listId);
  assert(list, `Expected ${listId} to exist`);

  for (const word of list.words) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-05T00:00:00.000Z');
  }

  const result: SessionResult = {
    totalWords: list.words.length,
    correctWords: list.words.length,
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
    lists,
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

function completeMixedNormalSessionCleanly(storage: SpelioStorage, lists: WordList[], words: PracticeWord[], listIds: string[]) {
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
    addMixedWelshExposure(
      {
        ...storage,
        completedNormalSessionCount: (storage.completedNormalSessionCount ?? 0) + 1,
        lastSessionDate: '2026-05-05T00:00:30.000Z',
        lastSessionResult: result
      },
      words,
      lists
    ),
    lists,
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
  assertEqual(getFullyCompletedListIds(storage, wordLists).includes('foundations_numbers'), true, 'Clean strong completion should show the modal tick');
  assertEqual(recommendation.title, 'Continue learning', 'Primary action title should stay as continue');
  assertEqual(recommendation.listId, 'foundations_mixed_01', 'Completed numbers list should advance to nextListId');
  assertEqual(recommendation.subtitle, 'Mixed Practice — Foundations', 'Primary action should show the next list name');
});

test('import validation accepts live export database field names for order and progression', () => {
  const preview = validateImportPayload({
    collections: [{
      id: 'spelio_core_welsh',
      slug: 'spelio-core-welsh',
      name: 'Spelio Core Welsh',
      type: 'spelio_core',
      source_language: 'en',
      target_language: 'cy',
      owner_type: 'spelio',
      order_index: 1,
      is_active: true
    }],
    lists: [{
      id: 'import_first',
      slug: 'import-first',
      collection_id: 'spelio_core_welsh',
      name: 'Import First',
      name_cy: 'Mewnforio Cyntaf',
      description: 'First imported list',
      description_cy: 'Rhestr gyntaf',
      language: 'cy',
      source_language: 'en',
      target_language: 'cy',
      dialect: 'Both',
      stage_id: 'foundations',
      focus_category_id: 'core-vocabulary',
      difficulty: 1,
      order_index: 7,
      next_list_id: 'import_second',
      is_active: true,
      list_type: 'main',
      hidden_from_main_catalogue: false,
      words: [{
        id: 'import_first_001',
        list_id: 'import_first',
        english_prompt: 'yes',
        welsh_answer: 'ie',
        accepted_alternatives: [],
        audio_url: 'https://example.com/ie.mp3',
        audio_status: 'ready',
        dialect: 'Both',
        order_index: 3,
        difficulty: 1,
        usage_note: 'General yes.',
        dialect_note: '',
        variant_group_id: '',
        spelling_hint_id: 'ie',
        disable_pattern_hints: true
      }]
    }, {
      id: 'import_second',
      slug: 'import-second',
      collection_id: 'spelio_core_welsh',
      name: 'Import Second',
      language: 'cy',
      source_language: 'en',
      target_language: 'cy',
      dialect: 'Both',
      stage_id: 'foundations',
      focus_category_id: 'core-vocabulary',
      difficulty: 1,
      order_index: 8,
      next_list_id: null,
      is_active: true,
      words: [{
        id: 'import_second_001',
        list_id: 'import_second',
        english_prompt: 'no',
        welsh_answer: 'na',
        accepted_alternatives: [],
        audio_url: 'https://example.com/na.mp3',
        audio_status: 'ready',
        dialect: 'Both',
        order_index: 4,
        difficulty: 1
      }]
    }]
  });

  assertEqual(preview.errors.length, 0, 'Snake-case live export shape should import without blocking errors');
  assertEqual(preview.content.collections[0]?.order, 1, 'Collection order_index should become order');
  assertEqual(preview.content.lists[0]?.order, 7, 'List order_index should become order');
  assertEqual(preview.content.lists[0]?.nextListId, 'import_second', 'next_list_id should become nextListId');
  assertEqual(preview.content.lists[0]?.stageId, 'foundations', 'stage_id should become stageId');
  assertEqual(preview.content.lists[0]?.focusCategoryId, 'core-vocabulary', 'focus_category_id should become focusCategoryId');
  assertEqual(preview.content.words[0]?.order, 3, 'Word order_index should become order');
  assertEqual(preview.content.words[0]?.spellingHintId, 'ie', 'spelling_hint_id should become spellingHintId');
  assertEqual(preview.content.words[0]?.disablePatternHints, true, 'disable_pattern_hints should become disablePatternHints');
});

test('support-only lists are present but hidden from the main word-list catalogue', () => {
  const support = findSupportWordList(wordLists, 'support_dd');
  const supportW = findSupportWordList(wordLists, 'support_w');
  const supportY = findSupportWordList(wordLists, 'support_y');

  assert(support, 'Expected support_dd to exist');
  assert(supportW, 'Expected support_w to exist');
  assert(supportY, 'Expected support_y to exist');
  assertEqual(isSupportWordList(support), true, 'Support list should carry explicit support metadata');
  assertEqual(mainWordLists(wordLists).some(list => list.id === 'support_dd'), false, 'Main catalogue filter should exclude support lists');
  assertEqual(mainWordLists(wordLists).some(list => list.id === 'support_w' || list.id === 'support_y'), false, 'Split W/Y support lists should be excluded from the main catalogue');
  assertEqual(normalizeSingleSelectedListIds(['support_dd'], wordLists)[0], 'foundations_first_words', 'Normal list selection should not select a support list');
});

test('stored selected list falls back when the list has no usable imported words', () => {
  const emptyImportedList: WordList = {
    id: 'empty_imported',
    collectionId: 'test',
    name: 'Empty imported',
    description: '',
    language: 'Welsh',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    dialect: 'Both',
    stage: 'Test',
    difficulty: 1,
    order: 1,
    nextListId: 'usable_imported',
    isActive: true,
    words: []
  };
  const usableImportedList = makeLargeList('usable_imported', 2, 3);
  const normalized = normalizeStorageWordListSelection({
    ...createDefaultStorage(),
    selectedListIds: ['empty_imported'],
    currentPathPosition: 'empty_imported'
  }, [emptyImportedList, usableImportedList]);
  const session = createPracticeSession([emptyImportedList, usableImportedList], normalized);

  assertEqual(normalized.selectedListIds[0], 'usable_imported', 'Empty imported list should not remain selected for practice');
  assertEqual(normalized.currentPathPosition, 'usable_imported', 'Current path should move to the usable fallback list');
  assertEqual(session.words.length > 0, true, 'Fallback selection should produce practice words');
});

test('support-only lists are excluded from normal recommendations', () => {
  const storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: ['support_dd'],
    currentPathPosition: 'support_dd'
  };
  const recommendation = getNormalContinuationRecommendation(storage, wordLists);
  const splitWStorage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: ['support_w', 'support_y'],
    currentPathPosition: 'support_w'
  };
  const splitWRecommendation = getNormalContinuationRecommendation(splitWStorage, wordLists);

  assertEqual(recommendation.listId, 'foundations_first_words', 'Normal continuation should fall back to a main list');
  assertEqual(recommendation.listId?.startsWith('support_'), false, 'Normal recommendations should not point to support lists');
  assertEqual(splitWRecommendation.listId, 'foundations_first_words', 'Normal continuation should ignore split W/Y support lists');
  assertEqual(splitWRecommendation.listId?.startsWith('support_'), false, 'Normal recommendations should not point to split W/Y support lists');
});

test('detached support practice starts from a support list without changing the original path storage', () => {
  const original = numbersStorage();
  const support = findSupportWordList(wordLists, 'support_dd');
  assert(support, 'Expected support_dd to exist');

  const start = createDetachedSupportPracticeStart(original, support);
  const session = createPracticeSession(wordLists, start.storage, start.review, start.recap);

  assertEqual(original.selectedListIds[0], 'foundations_numbers', 'Original selected list should remain unchanged');
  assertEqual(original.currentPathPosition, 'foundations_numbers', 'Original path position should remain unchanged');
  assertEqual(start.storage.selectedListIds[0], 'support_dd', 'Detached start should select the support list only in session storage');
  assertEqual(start.storage.currentPathPosition, 'support_dd', 'Detached start should point session storage at the support list');
  assertEqual(session.words.length, support.words.length, 'Detached support session should use the focused support words');
  assertEqual(session.words.every(word => word.listId === 'support_dd'), true, 'Detached support session should only use support_dd words');
});

test('support_ff session queue is stable and ordered for contextual practice', () => {
  const original = numbersStorage();
  const support = findSupportWordList(wordLists, 'support_ff');
  assert(support, 'Expected support_ff to exist');

  const start = createDetachedSupportPracticeStart(original, support);
  const session = createPracticeSession(wordLists, start.storage, start.review, start.recap);
  const wordIds = session.words.map(word => word.id);

  assertEqual(new Set(wordIds).size, wordIds.length, 'Support session words should have unique IDs');
  assertEqual(session.words.slice(0, 5).map(word => word.welshAnswer).join('|'), 'ffordd|coffi|ffrind|ffôn|fferm', 'support_ff should queue focused words in seed order');
  assertEqual(session.words.slice(0, 5).map(word => word.englishPrompt).join('|'), 'road|coffee|friend|phone|farm', 'support_ff prompts should match the focused words');
});

test('support words are standalone hidden-list data with stable IDs and missing audio until generated', () => {
  const supportLists = createSupportWordLists();
  const supportFf = findSupportWordList(supportLists, 'support_ff');
  const supportRh = findSupportWordList(supportLists, 'support_rh');
  const supportW = findSupportWordList(supportLists, 'support_w');
  const supportY = findSupportWordList(supportLists, 'support_y');
  assert(supportFf, 'Expected support_ff to exist');
  assert(supportRh, 'Expected support_rh to exist');
  assert(supportW, 'Expected support_w to exist');
  assert(supportY, 'Expected support_y to exist');

  const supportWordIds = supportLists.flatMap(list => list.words.map(word => word.id));
  const normalWordIds = new Set(mainWordLists(wordLists).flatMap(list => list.words.map(word => word.id)));
  assertEqual(supportWordIds.length, new Set(supportWordIds).size, 'Support words should have unique stable IDs.');
  assertEqual(supportWordIds.some(id => normalWordIds.has(id)), false, 'Support words should not reuse normal progression word IDs.');
  assertEqual(supportLists.some(list => list.id === 'support_wy'), false, 'Retired support_wy should not be part of the active static support-list seed.');
  assertEqual(supportFf.listType, 'support', 'Support FF should be explicitly typed as a support list.');
  assertEqual(supportFf.isSupportList, true, 'Support FF should carry the support-list flag.');
  assertEqual(supportFf.hiddenFromMainCatalogue, true, 'Support FF should be hidden from the public word-list catalogue.');
  assertEqual(mainWordLists(supportLists).some(list => list.id === 'support_ff'), false, 'Support FF should not appear in the main catalogue filter.');
  assertEqual(supportRh.listType, 'support', 'Support RH should be explicitly typed as a support list.');
  assertEqual(supportRh.isSupportList, true, 'Support RH should carry the support-list flag.');
  assertEqual(supportRh.hiddenFromMainCatalogue, true, 'Support RH should be hidden from the public word-list catalogue.');
  assertEqual(mainWordLists(supportLists).some(list => list.id === 'support_rh'), false, 'Support RH should not appear in the main catalogue filter.');
  assertEqual(supportRh.words.some(word => word.welshAnswer === 'rhiain'), false, 'Support RH should not include obscure rhiain.');
  assertEqual(supportRh.words.some(word => word.welshAnswer === 'rhaid'), true, 'Support RH should include rhaid.');
  assertEqual(supportRh.words.every(word => word.welshAnswer.includes('rh')), true, 'Every Support RH answer should visibly contain rh.');
  assertEqual(supportW.words.map(word => word.id).join('|'), 'support_w_001|support_w_002|support_w_003|support_w_004|support_w_005|support_w_006|support_w_007|support_w_008|support_w_009|support_w_010', 'Support W should use stable support_w word IDs.');
  assertEqual(supportW.words.map(word => word.welshAnswer).join('|'), 'dŵr|cwm|byw|bwrdd|twr|cwrdd|sŵn|mwg|gŵr|lwc', 'Support W should contain the focused w-as-vowel practice words.');
  assertEqual(supportW.words.some(word => word.welshAnswer === 'ŵyr'), false, 'Support W should not include ambiguous ŵyr.');
  assertEqual(supportW.words.some(word => word.welshAnswer === 'gwr'), false, 'Support W should not include unaccented gwr for man / husband.');
  assertEqual(supportW.words.some(word => word.welshAnswer === 'gŵr'), true, 'Support W should include gŵr for man / husband.');
  assertEqual(supportW.words.every(word => /[wŵ]/i.test(word.welshAnswer)), true, 'Every Support W answer should visibly contain w or ŵ.');
  assertEqual(supportY.words.map(word => word.id).join('|'), 'support_y_001|support_y_002|support_y_003|support_y_004|support_y_005|support_y_006|support_y_007|support_y_008|support_y_009|support_y_010', 'Support Y should use stable support_y word IDs.');
  assertEqual(supportY.words.map(word => word.welshAnswer).join('|'), 'tŷ|dydd|byd|mynydd|llyfr|ysgol|yfed|ynys|pysgod|tywydd', 'Support Y should contain the focused y-as-vowel practice words.');
  assertEqual(supportY.words.some(word => word.welshAnswer === 'heddiw'), false, 'Support Y should not include heddiw because it does not visibly contain y or ŷ.');
  assertEqual(supportY.words.some(word => word.welshAnswer === 'byd'), true, 'Support Y should include byd as the replacement y-pattern word.');
  assertEqual(supportY.words.every(word => /[yŷ]/i.test(word.welshAnswer)), true, 'Every Support Y answer should visibly contain y or ŷ.');
  assertEqual(supportY.listType, 'support', 'Support Y should be explicitly typed as a support list.');
  assertEqual(supportY.isSupportList, true, 'Support Y should carry the support-list flag.');
  assertEqual(supportY.hiddenFromMainCatalogue, true, 'Support Y should be hidden from the public word-list catalogue.');
  assertEqual(mainWordLists(supportLists).some(list => list.id === 'support_y'), false, 'Support Y should not appear in the main catalogue filter.');

  const ffrwyth = supportFf.words.find(word => word.welshAnswer === 'ffrwyth');
  assert(ffrwyth, 'Support FF should keep pedagogically useful ffrwyth.');
  assertEqual(ffrwyth.id, 'support_ff_006', 'ffrwyth should have a stable support-context word ID.');
  assertEqual(ffrwyth.listId, 'support_ff', 'ffrwyth should belong to the support FF list, not a normal progression list.');
  assertEqual(ffrwyth.audioUrl, '', 'ffrwyth should not inherit opportunistic audio from normal progression data.');
  assertEqual(ffrwyth.audioStatus, 'missing', 'ffrwyth should remain missing until the support-list audio workflow generates it.');
  const rhaid = supportRh.words.find(word => word.id === 'support_rh_003');
  assert(rhaid, 'Support RH should include replacement rhaid at support_rh_003.');
  assertEqual(rhaid.welshAnswer, 'rhaid', 'support_rh_003 should be the replacement rhaid word.');
  assertEqual(rhaid.englishPrompt, 'must', 'support_rh_003 should prompt rhaid as must.');
  assertEqual(rhaid.audioUrl, '', 'replacement rhaid should start without generated support-list audio.');
  assertEqual(rhaid.audioStatus, 'missing', 'replacement rhaid should remain missing until the support-list audio workflow generates it.');
  const mwg = supportW.words.find(word => word.welshAnswer === 'mwg');
  assert(mwg, 'Support W should include mwg.');
  assertEqual(mwg.id, 'support_w_008', 'mwg should use the stable support_w_008 support-context word ID.');
  assertEqual(mwg.audioStatus, 'missing', 'mwg should remain missing until the support-list audio workflow generates it.');
  const gwr = supportW.words.find(word => word.welshAnswer === 'gŵr');
  assert(gwr, 'Support W should include gŵr.');
  assertEqual(gwr.id, 'support_w_009', 'gŵr should use the stable support_w_009 support-context word ID.');
  assertEqual(gwr.audioStatus, 'missing', 'gŵr should remain missing until the support-list audio workflow generates it.');
  const byd = supportY.words.find(word => word.welshAnswer === 'byd');
  assert(byd, 'Support Y should include byd.');
  assertEqual(byd.id, 'support_y_003', 'byd should use the stable support_y_003 support-context word ID.');
  assertEqual(byd.listId, 'support_y', 'byd should belong to the support Y list, not a normal progression list.');
  assertEqual(byd.audioUrl, '', 'byd should start without generated support-list audio.');
  assertEqual(byd.audioStatus, 'missing', 'byd should remain missing until the support-list audio workflow generates it.');
});

test('support lists remain available when ordinary progression lists are removed', () => {
  const ordinarySubset = mainWordLists(wordLists).filter(list => list.id !== 'foundations_first_words' && list.id !== 'stage2_food');
  const listsWithSupport = withSupportWordLists(ordinarySubset);
  const supportFf = findSupportWordList(listsWithSupport, 'support_ff');

  assert(supportFf, 'Support FF should be added independently of ordinary progression list membership.');
  assertEqual(supportFf.words.map(word => word.welshAnswer).join('|'), 'ffordd|coffi|ffrind|ffôn|fferm|ffrwyth', 'Support FF words should not depend on normal list contents.');
  assertEqual(supportFf.words.every(word => word.listId === 'support_ff'), true, 'Support FF words should keep support-list ownership.');
});

test('support-list progress does not affect normal difficult-word review pools', () => {
  const support = findSupportWordList(wordLists, 'support_dd');
  assert(support, 'Expected support_dd to exist');

  const storage = applyWordProgressPatch(createDefaultStorage(), support.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');

  assertEqual(storage.wordProgress[support.words[0].id]?.difficult, true, 'Detached session storage may mark a support word difficult');
  assertEqual(hasDifficultWords(storage, wordLists), false, 'Normal difficult-word flow should ignore support-list words');
  assertEqual(getDifficultWordCount(storage, wordLists), 0, 'Normal difficult-word count should ignore support-list words');
  assertEqual(createPracticeSession(wordLists, storage, true).words.length, 0, 'Dedicated normal review should not include support-list words');
});

test('detached support review is scoped to difficult words from the current support list', () => {
  const supportDd = findSupportWordList(wordLists, 'support_dd');
  const supportFf = findSupportWordList(wordLists, 'support_ff');
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(supportDd && supportFf && numbers, 'Expected support_dd, support_ff, and foundations_numbers to exist');

  const original = numbersStorage();
  const start = createDetachedSupportPracticeStart(original, supportDd);
  let sessionStorage = applyWordProgressPatch(start.storage, supportDd.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');
  sessionStorage = applyWordProgressPatch(sessionStorage, supportFf.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');
  sessionStorage = applyWordProgressPatch(sessionStorage, numbers.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');

  assertEqual(getDifficultWordCountInList(sessionStorage, supportDd), 1, 'Support end screen should see difficult words from the completed support list.');
  assertEqual(hasDifficultWords(sessionStorage, wordLists), true, 'Setup should include a normal difficult word to prove support review stays scoped.');

  const reviewStart = createDetachedSupportReviewPracticeStart(sessionStorage, supportDd);
  const reviewSession = createPracticeSession(wordLists, reviewStart.storage, reviewStart.review, reviewStart.recap);

  assertEqual(reviewStart.storage.selectedListIds[0], 'support_dd', 'Support review should keep the detached support list selected.');
  assertEqual(reviewStart.storage.currentPathPosition, 'support_dd', 'Support review should keep the detached support path position.');
  assertEqual(reviewSession.words.length, 1, 'Support review should include only unresolved difficult words from that support list.');
  assertEqual(reviewSession.words[0]?.id, supportDd.words[0].id, 'Support review should not mix in difficult words from another support list.');
  assertEqual(reviewSession.words.some(word => word.listId === 'foundations_numbers'), false, 'Support review should not include normal progression difficult words.');
  assertEqual(original.selectedListIds[0], 'foundations_numbers', 'Support review start should not mutate the original selected list.');
  assertEqual(original.currentPathPosition, 'foundations_numbers', 'Support review start should not mutate the original path position.');
});

test('detached support end-screen difficult count is zero without support mistakes', () => {
  const support = findSupportWordList(wordLists, 'support_accents');
  assert(support, 'Expected support_accents to exist');

  const start = createDetachedSupportPracticeStart(numbersStorage(), support);
  const cleanStorage = applyWordProgressPatch(start.storage, support.words[0], {
    completed: true,
    cleanCompleted: true
  }, '2026-05-05T00:00:00.000Z');

  assertEqual(getDifficultWordCountInList(cleanStorage, support), 0, 'Clean detached support sessions should keep Back to spelling basics as the primary CTA.');
  assertEqual(createPracticeSession(wordLists, cleanStorage, true).words.length, 0, 'Clean support sessions should have no scoped review pool.');
});

test('detached support review disappears after clean resolution', () => {
  const support = findSupportWordList(wordLists, 'support_dd');
  assert(support, 'Expected support_dd to exist');

  const start = createDetachedSupportPracticeStart(numbersStorage(), support);
  const difficultStorage = applyWordProgressPatch(start.storage, support.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');
  const reviewStart = createDetachedSupportReviewPracticeStart(difficultStorage, support);
  const resolvedStorage = applyWordProgressPatch(reviewStart.storage, support.words[0], {
    completed: true,
    cleanCompleted: true,
    reviewResolvedClean: true
  }, '2026-05-06T00:00:00.000Z');
  const nextReviewSession = createPracticeSession(wordLists, resolvedStorage, true);

  assertEqual(getDifficultWordCountInList(resolvedStorage, support), 0, 'Clean support review completion should remove the support difficult word.');
  assertEqual(nextReviewSession.words.length, 0, 'Support review should shrink immediately after clean resolution.');
  assertEqual(hasDifficultWords(resolvedStorage, wordLists), false, 'Resolved support review should leave the global review pool untouched.');
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

test('full-word reveal keeps word difficult and prioritises review even without revealed letters', () => {
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
    revealedLetters: 0,
    durationSeconds: 30,
    listIds: ['foundations_numbers']
  };
  storage = finishNumbersSession(storage, { ...base, state: classifySession(base) });

  const recommendation = getRecommendation(storage, wordLists);
  assertEqual(storage.lastSessionResult?.state, 'struggled', 'A full-word reveal should make the session struggled even when no individual letters were revealed');
  assertEqual(storage.wordProgress[difficultWord.id]?.difficult, true, 'Full-word reveal should leave the word in Review difficult words');
  assertEqual(storage.listProgress.foundations_numbers?.strongSessionCount, 0, 'Full-word reveal should not count as a strong list-level session');
  assertEqual(recommendation.kind, 'review', 'Full-word reveal should make Review difficult words primary');
  assertEqual(recommendation.title, 'Review difficult words', 'Primary action should review difficult words after a full-word reveal');
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

  storage = applyWordProgressPatch(storage, numbers.words[0], { completed: true, cleanCompleted: true, reviewResolvedClean: true }, '2026-05-05T00:01:00.000Z');

  assertEqual(storage.wordProgress[numbers.words[0].id]?.difficult, false, 'One clean review completion should clear difficult');
  assertEqual(storage.wordProgress[numbers.words[0].id]?.recapDue, true, 'Clean review completion should leave recap due for reinforcement');
  assertEqual(storage.recentlyResolvedReviewWordIds?.[0], numbers.words[0].id, 'Clean review completion should temporarily exclude the word from automatic recap');
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

test('attempted incomplete list shows amber progress without homepage review or From earlier', () => {
  const list = makeLargeList('test_attempted_no_review', 1, 4);
  const result: SessionResult = {
    totalWords: 1,
    correctWords: 1,
    incorrectWords: 0,
    revealedWords: 0,
    incorrectAttempts: 0,
    revealedLetters: 0,
    durationSeconds: 10,
    listIds: [list.id],
    state: 'strong'
  };
  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: [list.id],
    currentPathPosition: list.id,
    lastSessionDate: '2026-05-05T00:00:10.000Z',
    lastSessionResult: result
  };
  storage = applyWordProgressPatch(storage, list.words[0], { completed: true, cleanCompleted: true }, '2026-05-05T00:00:00.000Z');
  storage = updateListCompletion(storage, [list], result);

  const recommendation = getRecommendation(storage, [list]);

  assertEqual(getInProgressListIds(storage, [list]).includes(list.id), true, 'Attempted incomplete list should show the soft amber progress indicator');
  assertEqual(getFullyCompletedListIds(storage, [list]).includes(list.id), false, 'Attempted incomplete list should not show the completion tick');
  assertEqual(hasDifficultWords(storage, [list]), false, 'Attempted clean progress alone should not create Review difficult words');
  assertEqual(getRecapWordCount(storage, [list]), 0, 'Attempted clean progress alone should not create From earlier');
  assertEqual(recommendation.kind, 'list', 'Homepage should continue normal learning when review and recap pools are empty');
});

test('unresolved difficult words create review eligibility and keep list amber until resolved', () => {
  const list = makeLargeList('test_unresolved_difficult', 1, 3);
  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: [list.id],
    currentPathPosition: list.id,
    lastSessionDate: '2026-05-05T00:00:10.000Z',
    lastSessionResult: {
      totalWords: 1,
      correctWords: 0,
      incorrectWords: 1,
      revealedWords: 0,
      incorrectAttempts: 1,
      revealedLetters: 0,
      durationSeconds: 10,
      listIds: [list.id],
      state: 'struggled'
    }
  };
  storage = applyWordProgressPatch(storage, list.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');

  const recommendation = getRecommendation(storage, [list]);

  assertEqual(getInProgressListIds(storage, [list]).includes(list.id), true, 'Unresolved difficult words should show the list as in progress');
  assertEqual(hasDifficultWords(storage, [list]), true, 'Unresolved difficult words should be eligible for Review difficult words');
  assertEqual(getDifficultWordCount(storage, [list]), 1, 'Review difficult word count should reflect the eligible difficult pool');
  assertEqual(recommendation.kind, 'review', 'A struggled session with eligible difficult words should recommend review');
});

test('resolved difficult words leave review, become From earlier, and keep incomplete list amber', () => {
  const list = makeLargeList('test_resolved_recap_due', 1, 3);
  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: [list.id],
    currentPathPosition: list.id,
    lastSessionDate: '2026-05-05T00:01:00.000Z',
    lastSessionResult: {
      totalWords: 1,
      correctWords: 1,
      incorrectWords: 0,
      revealedWords: 0,
      incorrectAttempts: 0,
      revealedLetters: 0,
      durationSeconds: 10,
      listIds: [list.id],
      state: 'strong'
    }
  };
  storage = applyWordProgressPatch(storage, list.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, list.words[0], { completed: true, cleanCompleted: true }, '2026-05-05T00:01:00.000Z');

  const recommendation = getRecommendation(storage, [list]);

  assertEqual(getInProgressListIds(storage, [list]).includes(list.id), true, 'Resolved but incomplete list should still show amber progress');
  assertEqual(hasDifficultWords(storage, [list]), false, 'Clean completion should remove the word from Review difficult words');
  assertEqual(getRecapWordCount(storage, [list]), 1, 'Resolved difficult words should be eligible for From earlier until clean recap');
  assertEqual(recommendation.kind, 'list', 'Recap-only words should not turn the primary recommendation into Review difficult words');
});

test('completed list shows green tick without amber, review, or From earlier', () => {
  const list = makeLargeList('test_completed_clean', 1, 3);
  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: [list.id],
    currentPathPosition: list.id
  };
  storage = completeListCleanlyInLists(storage, [list], list.id);

  assertEqual(getFullyCompletedListIds(storage, [list]).includes(list.id), true, 'Clean completed list should show the green tick');
  assertEqual(getInProgressListIds(storage, [list]).includes(list.id), false, 'Clean completed list should not also show amber progress');
  assertEqual(hasDifficultWords(storage, [list]), false, 'Clean completed list should not create Review difficult words');
  assertEqual(getRecapWordCount(storage, [list]), 0, 'Clean completed list should not create From earlier');
});

test('reveal-used incomplete list can stay amber after difficulty and recap are cleared', () => {
  const list = makeLargeList('test_reveal_used_no_review', 1, 3);
  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: [list.id],
    currentPathPosition: list.id
  };
  storage = applyWordProgressPatch(storage, list.words[0], { revealed: true }, '2026-05-05T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, list.words[0], { completed: true, cleanCompleted: true }, '2026-05-05T00:01:00.000Z');
  storage = applyWordProgressPatch(storage, list.words[0], { completed: true, cleanCompleted: true, recapCompletedClean: true }, '2026-05-05T00:02:00.000Z');

  assertEqual(storage.wordProgress[list.words[0].id]?.revealedCount, 1, 'Setup should preserve reveal history on the word');
  assertEqual(getInProgressListIds(storage, [list]).includes(list.id), true, 'Reveal-used incomplete list should show amber progress from meaningful history');
  assertEqual(getFullyCompletedListIds(storage, [list]).includes(list.id), false, 'Reveal-used incomplete list should not show a completion tick');
  assertEqual(hasDifficultWords(storage, [list]), false, 'Resolved reveal history should not keep Review difficult words visible');
  assertEqual(getRecapWordCount(storage, [list]), 0, 'Clean recap should remove From earlier eligibility');
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

test('normal progression skips a fully completed ticked next list', () => {
  let storage = weatherAndWorkStorage();
  storage = completeListCleanly(storage, 'stage2_adjectives');
  storage = completeListCleanly(storage, 'stage2_weather');

  const adjectives = wordLists.find(list => list.id === 'stage2_adjectives');
  assert(adjectives, 'Expected stage2_adjectives to exist');
  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(isListFullyComplete(storage, adjectives), true, 'Setup should make the immediate next list fully complete');
  assertEqual(recommendation.kind, 'list', 'Normal progression should still recommend a list');
  assertEqual(recommendation.listId, 'stage2_adverbs', 'Fully completed immediate next list should be skipped for the following list');
});

test('normal progression skips ticked foundations_places after foundations_actions', () => {
  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: ['foundations_actions'],
    currentPathPosition: 'foundations_actions'
  };
  storage = completeListCleanly(storage, 'foundations_places');
  storage = completeListCleanly(storage, 'foundations_actions');

  const places = wordLists.find(list => list.id === 'foundations_places');
  const time = wordLists.find(list => list.id === 'foundations_time');
  assert(places, 'Expected foundations_places to exist');
  assert(time, 'Expected foundations_time to exist');

  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(isListProgressionReady(storage, places), true, 'Setup should make foundations_places progression-complete');
  assertEqual(isListFullyComplete(storage, places), true, 'Setup should make foundations_places fully completed/ticked');
  assertEqual(isListFullyComplete(storage, time), false, 'Setup should leave foundations_time not fully completed/ticked');
  assertEqual(recommendation.kind, 'list', 'Normal progression should still recommend a list');
  assertEqual(recommendation.listId, 'foundations_time', 'Normal progression should skip the ticked foundations_places list');
});

test('normal progression does not pin to ticked foundations_places when path already advanced there', () => {
  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: ['foundations_actions'],
    currentPathPosition: 'foundations_actions'
  };
  storage = completeListCleanly(storage, 'foundations_places');
  storage = completeListCleanly(storage, 'foundations_actions');
  storage = {
    ...storage,
    selectedListIds: ['foundations_places'],
    currentPathPosition: 'foundations_places'
  };

  const places = wordLists.find(list => list.id === 'foundations_places');
  assert(places, 'Expected foundations_places to exist');
  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(isListFullyComplete(storage, places), true, 'Setup should make the current path list fully completed/ticked');
  assertEqual(recommendation.listId, 'foundations_time', 'A fully completed current path should continue to the next not-ticked list');
});

test('normal progression does not skip a progression-ready next list without a completion tick', () => {
  const adjectives = wordLists.find(list => list.id === 'stage2_adjectives');
  assert(adjectives, 'Expected stage2_adjectives to exist');

  let storage = weatherAndWorkStorage();
  for (const word of adjectives.words) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-05T00:00:00.000Z');
  }
  storage = completeListCleanly(storage, 'stage2_weather');

  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(isListProgressionReady(storage, adjectives), true, 'Setup should make the immediate next list progression-ready');
  assertEqual(isListFullyComplete(storage, adjectives), false, 'Setup should leave the immediate next list without the modal tick');
  assertEqual(recommendation.listId, 'stage2_adjectives', 'Progression-ready next list should not be skipped unless it is fully complete');
});

test('normal progression still recommends foundations_places when it is progression-complete but unticked', () => {
  const places = wordLists.find(list => list.id === 'foundations_places');
  assert(places, 'Expected foundations_places to exist');

  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: ['foundations_actions'],
    currentPathPosition: 'foundations_actions'
  };
  for (const word of places.words) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-05T00:00:00.000Z');
  }
  storage = completeListCleanly(storage, 'foundations_actions');

  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(isListProgressionReady(storage, places), true, 'Setup should make foundations_places progression-complete');
  assertEqual(isListFullyComplete(storage, places), false, 'Setup should leave foundations_places without the modal tick');
  assertEqual(recommendation.listId, 'foundations_places', 'Progression-complete foundations_places should not be skipped unless it is fully completed/ticked');
});

test('normal progression does not skip foundations_places when eligible difficult words block its tick', () => {
  const places = wordLists.find(list => list.id === 'foundations_places');
  assert(places, 'Expected foundations_places to exist');

  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: ['foundations_actions'],
    currentPathPosition: 'foundations_actions'
  };
  storage = completeListCleanly(storage, 'foundations_places');
  storage = applyWordProgressPatch(storage, places.words[0], { incorrect: true }, '2026-05-05T00:01:00.000Z');
  storage = completeListCleanly(storage, 'foundations_actions');

  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(isListProgressionReady(storage, places), true, 'Setup should keep foundations_places progression-complete');
  assertEqual(isListFullyComplete(storage, places), false, 'Eligible difficult words should block the modal tick');
  assertEqual(recommendation.listId, 'foundations_places', 'A progression-complete list with unresolved eligible difficulty should not be skipped');
});

test('review difficult words still overrides skipped sequential progression', () => {
  let storage = weatherAndWorkStorage();
  storage = completeListCleanly(storage, 'stage2_adjectives');
  storage = completeListCleanly(storage, 'stage2_weather');

  const weather = wordLists.find(list => list.id === 'stage2_weather');
  assert(weather, 'Expected stage2_weather to exist');
  storage = applyWordProgressPatch(storage, weather.words[0], { incorrect: true }, '2026-05-05T00:01:00.000Z');
  storage = {
    ...storage,
    lastSessionResult: storage.lastSessionResult
      ? { ...storage.lastSessionResult, state: 'struggled' }
      : null
  };

  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(hasDifficultWords(storage, wordLists), true, 'Setup should create eligible difficult words');
  assertEqual(recommendation.kind, 'review', 'Review difficult words should remain the primary recommendation');
});

test('review difficult words still overrides foundations_actions skipped sequential progression', () => {
  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: ['foundations_actions'],
    currentPathPosition: 'foundations_actions'
  };
  storage = completeListCleanly(storage, 'foundations_places');
  storage = completeListCleanly(storage, 'foundations_actions');

  const actions = wordLists.find(list => list.id === 'foundations_actions');
  assert(actions, 'Expected foundations_actions to exist');
  storage = applyWordProgressPatch(storage, actions.words[0], { incorrect: true }, '2026-05-05T00:01:00.000Z');
  storage = {
    ...storage,
    lastSessionResult: storage.lastSessionResult
      ? { ...storage.lastSessionResult, state: 'struggled' }
      : null
  };

  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(hasDifficultWords(storage, wordLists), true, 'Setup should create eligible difficult words');
  assertEqual(recommendation.kind, 'review', 'Review difficult words should remain the primary recommendation');
});

test('normal progression falls back when sequential next lists are complete or unavailable', () => {
  const current: WordList = { ...makeLargeList('test_seq_current', 1, 2), nextListId: 'test_seq_done' };
  const done: WordList = { ...makeLargeList('test_seq_done', 2, 2), nextListId: 'test_seq_missing' };
  const fallback: WordList = makeLargeList('test_seq_fallback', 3, 2);
  const lists = [current, done, fallback];

  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: [current.id],
    currentPathPosition: current.id
  };
  storage = completeListCleanlyInLists(storage, lists, done.id);
  storage = completeListCleanlyInLists(storage, lists, current.id);

  const recommendation = getRecommendation(storage, lists);

  assertEqual(isListFullyComplete(storage, done), true, 'Setup should make the sequential next list fully complete');
  assertEqual(recommendation.kind, 'list', 'Normal progression should fall back to a list recommendation');
  assertEqual(recommendation.listId, fallback.id, 'Unavailable sequential continuation should use the existing unfinished-list fallback');
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

test('progression can move forward before unresolved difficult words earn a modal tick', () => {
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
  const result: SessionResult = { ...base, state: classifySession(base) };
  storage = finishNumbersSession(storage, result);

  const primaryRecommendation = getRecommendation(storage, wordLists);
  const normalRecommendation = getNormalContinuationRecommendation(storage, wordLists);

  assertEqual(primaryRecommendation.kind, 'review', 'A struggled session with a difficult word should still recommend review');
  assertEqual(normalRecommendation.listId, 'foundations_mixed_01', 'Normal continue should still allow next-list progression');
  assertEqual(isListProgressionReady(storage, numbers), true, 'Seen-all list should be progression-ready');
  assertEqual(isListFullyComplete(storage, numbers), false, 'Unresolved difficult words should block the modal tick');
  assertEqual(getFullyCompletedListIds(storage, wordLists).includes('foundations_numbers'), false, 'Word list modal should not show the tick yet');
});

test('resolving the difficult word cleanly allows a previously strong seen-all list to show the modal tick', () => {
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
  storage = applyWordProgressPatch(storage, difficultWord, { completed: true, cleanCompleted: true, reviewResolvedClean: true }, '2026-05-05T00:01:00.000Z');

  assertEqual(hasDifficultWords(storage, wordLists), false, 'Clean review completion should remove the word from Review difficult words');
  assertEqual(isListFullyComplete(storage, numbers), true, 'Seen-all, strong-session list should show the tick once difficulty is resolved');
  assertEqual(getFullyCompletedListIds(storage, wordLists).includes('foundations_numbers'), true, 'Word list modal should show the single completed tick');
});

test('clean manually selected normal session marks People & Family complete', () => {
  const people = wordLists.find(list => list.id === 'stage2_people');
  assert(people, 'Expected stage2_people to exist');

  let storage = applyManualWordListSelection(createDefaultStorage(), [people.id]);
  for (const word of people.words) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-27T00:00:00.000Z');
  }

  const result: SessionResult = {
    totalWords: 10,
    correctWords: 10,
    incorrectWords: 0,
    revealedWords: 0,
    incorrectAttempts: 0,
    revealedLetters: 0,
    durationSeconds: 30,
    listIds: [people.id],
    state: 'strong'
  };
  storage = updateListCompletion({ ...storage, lastSessionDate: '2026-05-27T00:00:30.000Z', lastSessionResult: result }, wordLists, result);

  assertEqual(storage.listProgress.stage2_people?.completed, true, 'Clean People normal session should set list completion.');
  assertEqual(getFullyCompletedListIds(storage, wordLists).includes(people.id), true, 'Clean People normal session should show the green tick.');
});

test('revealed manually selected normal session leaves People & Family in progress', () => {
  const people = wordLists.find(list => list.id === 'stage2_people');
  assert(people, 'Expected stage2_people to exist');

  let storage = applyManualWordListSelection(createDefaultStorage(), [people.id]);
  storage = applyWordProgressPatch(storage, people.words[0], { revealed: true }, '2026-05-27T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, people.words[0], { completed: true, cleanCompleted: false }, '2026-05-27T00:00:05.000Z');
  for (const word of people.words.slice(1)) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-27T00:00:10.000Z');
  }

  const result: SessionResult = {
    totalWords: 10,
    correctWords: 9,
    incorrectWords: 0,
    revealedWords: 1,
    incorrectAttempts: 0,
    revealedLetters: 1,
    durationSeconds: 30,
    listIds: [people.id],
    state: 'struggled'
  };
  storage = updateListCompletion({ ...storage, lastSessionDate: '2026-05-27T00:00:30.000Z', lastSessionResult: result }, wordLists, result);

  assertEqual(storage.listProgress.stage2_people?.completed, false, 'Revealed People session should not immediately complete the list.');
  assertEqual(storage.listProgress.stage2_people?.strongSessionCount, 0, 'Reveal should not count as a strong list-level session.');
  assertEqual(getFullyCompletedListIds(storage, wordLists).includes(people.id), false, 'Revealed People session should not show a green tick yet.');
  assertEqual(getInProgressListIds(storage, wordLists).includes(people.id), true, 'Revealed People session should show the in-progress dot.');
});

test('clean Review difficult recovery after reveal marks original list complete without advancing progression', () => {
  const people = wordLists.find(list => list.id === 'stage2_people');
  assert(people, 'Expected stage2_people to exist');

  let storage = applyManualWordListSelection(createDefaultStorage(), [people.id]);
  storage = applyWordProgressPatch(storage, people.words[0], { revealed: true }, '2026-05-27T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, people.words[0], { completed: true, cleanCompleted: false }, '2026-05-27T00:00:05.000Z');
  for (const word of people.words.slice(1)) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-27T00:00:10.000Z');
  }

  const normalResult: SessionResult = {
    totalWords: 10,
    correctWords: 9,
    incorrectWords: 0,
    revealedWords: 1,
    incorrectAttempts: 0,
    revealedLetters: 1,
    durationSeconds: 30,
    listIds: [people.id],
    state: 'struggled'
  };
  storage = updateListCompletion({
    ...storage,
    selectedListIds: ['stage2_work'],
    currentPathPosition: 'stage2_work',
    lastSessionDate: '2026-05-27T00:00:30.000Z',
    lastSessionResult: normalResult
  }, wordLists, normalResult);

  storage = applyWordProgressPatch(storage, people.words[0], {
    completed: true,
    cleanCompleted: true,
    reviewResolvedClean: true
  }, '2026-05-27T00:01:00.000Z');
  const reviewResult: SessionResult = {
    totalWords: 1,
    correctWords: 1,
    incorrectWords: 0,
    revealedWords: 0,
    incorrectAttempts: 0,
    revealedLetters: 0,
    durationSeconds: 10,
    listIds: [people.id],
    state: 'strong'
  };
  storage = updateReviewCompletion({ ...storage, lastSessionResult: reviewResult }, wordLists, reviewResult);

  assertEqual(hasDifficultWords(storage, wordLists), false, 'Clean review recovery should clear the remaining People difficult word.');
  assertEqual(storage.listProgress.stage2_people?.completed, true, 'Clean review recovery should set the original list complete.');
  assertEqual(getFullyCompletedListIds(storage, wordLists).includes(people.id), true, 'Clean review recovery should show the original list green tick.');
  assertEqual(storage.selectedListIds[0], 'stage2_work', 'Review recovery must not advance or rewrite selected list.');
  assertEqual(storage.currentPathPosition, 'stage2_work', 'Review recovery must not advance or rewrite current path.');
});

test('recap-only recovery does not mark a list complete', () => {
  const people = wordLists.find(list => list.id === 'stage2_people');
  assert(people, 'Expected stage2_people to exist');

  let storage = applyManualWordListSelection(createDefaultStorage(), [people.id]);
  storage = applyWordProgressPatch(storage, people.words[0], { revealed: true }, '2026-05-27T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, people.words[0], { completed: true, cleanCompleted: false }, '2026-05-27T00:00:05.000Z');
  for (const word of people.words.slice(1)) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-27T00:00:10.000Z');
  }

  const normalResult: SessionResult = {
    totalWords: 10,
    correctWords: 9,
    incorrectWords: 0,
    revealedWords: 1,
    incorrectAttempts: 0,
    revealedLetters: 1,
    durationSeconds: 30,
    listIds: [people.id],
    state: 'struggled'
  };
  storage = updateListCompletion({ ...storage, lastSessionResult: normalResult }, wordLists, normalResult);
  storage = applyWordProgressPatch(storage, people.words[0], {
    completed: true,
    cleanCompleted: true,
    recapCompletedClean: true
  }, '2026-05-27T00:01:00.000Z');

  assertEqual(storage.wordProgress[people.words[0].id]?.difficult, false, 'Clean recap can clear the difficult flag at word level.');
  assertEqual(getFullyCompletedListIds(storage, wordLists).includes(people.id), false, 'Recap-only recovery should not create a list completion marker.');
});

test('manual and continuation starts use the same selected-list completion rules', () => {
  const people = wordLists.find(list => list.id === 'stage2_people');
  assert(people, 'Expected stage2_people to exist');

  const manualStorage = applyManualWordListSelection(createDefaultStorage(), [people.id]);
  const continuationStorage = applyPracticeStartListSelection(createDefaultStorage(), people.id);

  assertEqual(createPracticeSession(wordLists, manualStorage).listIds[0], people.id, 'Manual selection should create a People session.');
  assertEqual(createPracticeSession(wordLists, continuationStorage).listIds[0], people.id, 'Continuation selection should create a People session.');
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

test('older multi-list selection uses only the first valid active list in normal sessions', () => {
  const lists = [
    makeLargeList('test_legacy_multi_a', 1, 24),
    makeLargeList('test_legacy_multi_b', 2, 24),
    makeLargeList('test_legacy_multi_c', 3, 24)
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
  const repeatedWords = secondSession.words.filter(word => firstSessionIds.has(word.id));

  assertEqual(firstSession.words.length, 10, 'Setup first session should use ten words');
  assertEqual(firstSession.words.every(word => word.listId === lists[0].id), true, 'Older multi-list storage should resolve to the first valid selected list');
  assertEqual(secondSession.words.length, 10, 'Second session should use ten words');
  assertEqual(secondSession.words.every(word => word.listId === lists[0].id), true, 'Later sessions should remain on the resolved single list');
  assertEqual(repeatedWords.length, 0, 'Second session should draw unseen words from the single selected list before repeating session one');
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

test('tail-end sessions stay short when only a few unseen learning items remain', () => {
  const tailList = makeLargeList('test_tail_single', 1, 12);
  const lists = [tailList];
  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: [tailList.id],
    currentPathPosition: tailList.id
  };
  const firstSession = createPracticeSession(lists, storage);

  storage = completeSessionWordsCleanly(storage, firstSession.words, firstSession.listIds);
  const secondSession = createPracticeSession(lists, storage);
  const unseenWords = secondSession.words.filter(word => storage.wordProgress[word.id]?.seen !== true);
  const repeatedWords = secondSession.words.filter(word => storage.wordProgress[word.id]?.seen === true);

  assertEqual(firstSession.words.length, 10, 'First tail setup session should use the normal ten-word target');
  assertEqual(unseenWords.length, 2, 'Tail session should include all remaining unseen items');
  assertEqual(repeatedWords.length, 2, 'Tail session should add only modest reinforcement');
  assertEqual(secondSession.words.length, 4, 'Tail session should not pad awkwardly back to ten words');
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

test('dialect variants count as one conceptual item for sessions and completion', () => {
  const list = dialectCompletionList();
  const lists = [list];
  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: [list.id],
    currentPathPosition: list.id,
    settings: {
      ...createDefaultStorage().settings,
      dialectPreference: 'mixed'
    }
  };
  const session = createPracticeSession(lists, storage);

  assertEqual(list.words.length, 11, 'Setup should contain more raw rows than conceptual items');
  assertEqual(session.words.length, 10, 'Ordinary session size should count conceptual items, not raw dialect rows');
  assertEqual(session.words.filter(word => word.variantGroupId === 'now').length, 1, 'Session should include only one variant from the group');

  for (const word of list.words.filter(word => word.dialect !== 'North Wales')) {
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
    listIds: [list.id],
    state: 'strong'
  };
  storage = updateListCompletion(
    {
      ...storage,
      lastSessionDate: '2026-05-05T00:00:30.000Z',
      lastSessionResult: result
    },
    lists,
    result
  );

  const northStorage: SpelioStorage = {
    ...storage,
    settings: {
      ...storage.settings,
      dialectPreference: 'north'
    }
  };

  assertEqual(storage.listProgress[list.id]?.completed, true, 'Unselected sibling variant should not block list completion');
  assertEqual(getFullyCompletedListIds(storage, lists).includes(list.id), true, 'Completed conceptual variant item should show the modal tick');
  assertEqual(isListProgressionReady(northStorage, list), true, 'Switching dialect later should not undo conceptual progression readiness');
});

test('ineligible dialect difficult variants do not block the modal tick', () => {
  const list = dialectCompletionList();
  const lists = [list];
  const northNow = list.words.find(word => word.variantGroupId === 'now' && word.dialect === 'North Wales');
  assert(northNow, 'Expected North Wales now variant');

  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: [list.id],
    currentPathPosition: list.id,
    settings: {
      ...createDefaultStorage().settings,
      dialectPreference: 'south_standard'
    }
  };

  storage = applyWordProgressPatch(storage, northNow, { incorrect: true }, '2026-05-05T00:00:00.000Z');
  for (const word of list.words.filter(word => word.dialect !== 'North Wales')) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-05T00:00:05.000Z');
  }

  const result: SessionResult = {
    totalWords: 10,
    correctWords: 10,
    incorrectWords: 0,
    revealedWords: 0,
    incorrectAttempts: 0,
    revealedLetters: 0,
    durationSeconds: 30,
    listIds: [list.id],
    state: 'strong'
  };
  storage = updateListCompletion(
    {
      ...storage,
      lastSessionDate: '2026-05-05T00:00:30.000Z',
      lastSessionResult: result
    },
    lists,
    result
  );

  assertEqual(storage.wordProgress[northNow.id]?.difficult, true, 'Setup should leave an unresolved North-only difficult variant');
  assertEqual(hasDifficultWords(storage, lists), false, 'Current South/Standard review logic should ignore the ineligible North variant');
  assertEqual(isListFullyComplete(storage, list), true, 'Ineligible old variant difficulty should not block full completion');
  assertEqual(getFullyCompletedListIds(storage, lists).includes(list.id), true, 'Word list modal should still show one completed tick');
});

test('older three-list storage resolves to one 20+ word pool while unseen words remain', () => {
  const lists = [
    makeLargeList('test_large_multi_a', 1, 24),
    makeLargeList('test_large_multi_b', 2, 24),
    makeLargeList('test_large_multi_c', 3, 24)
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

  assertEqual(firstSession.words.length, 10, 'First session should use ten words');
  assertEqual(firstSession.words.every(word => word.listId === 'test_large_multi_a'), true, 'Older multi-list storage should use only the first valid active list');
  assertEqual(secondSession.words.length, 10, 'Second session should use ten unseen words from the single selected list');
  assertEqual(secondSession.words.every(word => word.listId === 'test_large_multi_a'), true, 'Second session should remain in the first valid active list');
  assertEqual(secondSession.words.some(word => firstSessionIds.has(word.id)), false, 'Second session should exclude cleanly completed words while unseen words remain');
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

test('primer-led normal sessions suppress automatic recap without changing explicit recap or review sessions', () => {
  const firstWords = wordLists.find(list => list.id === 'foundations_first_words');
  assert(firstWords, 'Expected foundations_first_words to exist');
  const please = firstWords.words.find(word => word.englishPrompt === 'please');
  assert(please, 'Expected please to exist in first words');

  const primerList = makeLargeList('foundation_patterns_f_ff', 500, 12);
  const lists = [firstWords, primerList];
  const primerSelectedStorage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: [primerList.id],
    currentPathPosition: primerList.id,
    completedNormalSessionCount: 2
  };

  const difficultStorage = applyWordProgressPatch(primerSelectedStorage, please, { incorrect: true }, '2026-05-05T00:00:00.000Z');
  const resolvedRecapStorage = applyWordProgressPatch(difficultStorage, please, { completed: true, cleanCompleted: true }, '2026-05-05T00:01:00.000Z');

  const normalSession = createPracticeSession(lists, resolvedRecapStorage);
  const secondNormalSession = createPracticeSession(lists, resolvedRecapStorage);
  const injected = selectPreSessionRecapWord(resolvedRecapStorage, lists, normalSession.words);
  const secondInjected = selectPreSessionRecapWord(resolvedRecapStorage, lists, secondNormalSession.words);

  assertEqual(normalSession.words.every(word => word.listId === primerList.id), true, 'Primer-led normal session should contain only words from the selected list');
  assertEqual(injected, undefined, 'Primer-led normal session should not receive automatic recap injection');
  assertEqual(secondInjected, undefined, 'Primer-led recap suppression should remain deterministic');
  assertEqual(
    secondNormalSession.words.map(word => word.id).join('|'),
    normalSession.words.map(word => word.id).join('|'),
    'Primer-led normal session generation should remain deterministic'
  );

  const recapStart = createRecapPracticeStart(resolvedRecapStorage);
  const recapSession = createPracticeSession(lists, recapStart.storage, recapStart.review, recapStart.recap);
  assertEqual(recapSession.words.some(word => word.id === please.id), true, 'Explicit From earlier sessions should still include recapDue words');

  const reviewSession = createPracticeSession(lists, difficultStorage, true);
  assertEqual(reviewSession.words.some(word => word.id === please.id), true, 'Review difficult words should still include current difficult words');
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

test('automatic recap does not inject the only word just resolved in difficult review', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  storage = applyWordProgressPatch(storage, numbers.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, numbers.words[0], { completed: true, cleanCompleted: true, reviewResolvedClean: true }, '2026-05-05T00:01:00.000Z');
  storage = {
    ...storage,
    completedNormalSessionCount: 2
  };

  const normalSession = createPracticeSession(wordLists, storage);
  const injected = selectPreSessionRecapWord(storage, wordLists, normalSession.words);

  assertEqual(storage.wordProgress[numbers.words[0].id]?.recapDue, true, 'Clean review completion may leave the word recap due');
  assertEqual(injected, undefined, 'Quick recap should not immediately reuse the just-resolved review word');
});

test('automatic recap skips words just resolved in difficult review and falls back to older recap due words', () => {
  const list = recapSelectionList();
  const storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: [list.id],
    currentPathPosition: list.id,
    completedNormalSessionCount: 2,
    recentlyResolvedReviewWordIds: ['resolved_easy_older'],
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
      }
    }
  };

  const selected = selectPreSessionRecapWord(storage, [list], []);
  const selectedAfterNormalSessionClearsExclusion = selectPreSessionRecapWord({ ...storage, recentlyResolvedReviewWordIds: [] }, [list], []);

  assertEqual(selected?.id, 'resolved_hard_recent', 'Quick recap should skip the just-resolved review word and use another eligible recap word');
  assertEqual(selectedAfterNormalSessionClearsExclusion?.id, 'resolved_easy_older', 'The skipped word may become eligible again after the transient exclusion is cleared');
});

test('recapDue word completed cleanly in From earlier clears recap due and shrinks count', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  storage = applyWordProgressPatch(storage, numbers.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, numbers.words[0], { completed: true, cleanCompleted: true }, '2026-05-05T00:00:30.000Z');

  assertEqual(storage.wordProgress[numbers.words[0].id]?.recapDue, true, 'Resolved word should be available for From earlier');
  assertEqual(getRecapWordCount(storage, wordLists), 1, 'From earlier count should include recap due word before recap completion');

  storage = applyWordProgressPatch(storage, numbers.words[0], { completed: true, cleanCompleted: true, recapCompletedClean: true }, '2026-05-05T00:01:00.000Z');

  assertEqual(storage.wordProgress[numbers.words[0].id]?.cleanRecapCount, 1, 'First clean recap should increment cleanRecapCount');
  assertEqual(storage.wordProgress[numbers.words[0].id]?.recapDue, false, 'First clean recap should clear recap due');
  assertEqual(getRecapWordCount(storage, wordLists), 0, 'From earlier count should shrink after one clean recap completion');
});

test('recapDue word completed with incorrect attempt remains recap due', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  storage = applyWordProgressPatch(storage, numbers.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, numbers.words[0], { completed: true, cleanCompleted: false, incorrect: true }, '2026-05-05T00:01:00.000Z');

  assertEqual(storage.wordProgress[numbers.words[0].id]?.recapDue, true, 'Incorrect recap completion should keep recap due');
  assertEqual(storage.wordProgress[numbers.words[0].id]?.cleanRecapCount, 0, 'Incorrect recap completion should not increment cleanRecapCount');
});

test('recapDue word completed with reveal remains recap due', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  storage = applyWordProgressPatch(storage, numbers.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, numbers.words[0], { completed: true, cleanCompleted: false, revealed: true }, '2026-05-05T00:01:00.000Z');

  assertEqual(storage.wordProgress[numbers.words[0].id]?.recapDue, true, 'Revealed recap completion should keep recap due');
  assertEqual(storage.wordProgress[numbers.words[0].id]?.cleanRecapCount, 0, 'Revealed recap completion should not increment cleanRecapCount');
});

test('recapDue word injected into normal session clears after one clean recap completion', () => {
  const firstWords = wordLists.find(list => list.id === 'foundations_first_words');
  assert(firstWords, 'Expected foundations_first_words to exist');
  const please = firstWords.words.find(word => word.englishPrompt === 'please');
  assert(please, 'Expected please to exist in first words');

  let storage = firstWordsStorage('mixed');
  storage = applyWordProgressPatch(storage, please, { incorrect: true }, '2026-05-05T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, please, { completed: true, cleanCompleted: true }, '2026-05-05T00:00:30.000Z');
  storage = {
    ...storage,
    selectedListIds: ['foundations_verbs'],
    currentPathPosition: 'foundations_verbs',
    completedNormalSessionCount: 2
  };

  const normalSession = createPracticeSession(wordLists, storage);
  const injected = selectPreSessionRecapWord(storage, wordLists, normalSession.words);
  assertEqual(injected?.id, please.id, 'Normal sessions may inject the eligible recapDue word');

  storage = applyWordProgressPatch(storage, please, { completed: true, cleanCompleted: true, recapCompletedClean: true }, '2026-05-05T00:01:00.000Z');

  assertEqual(storage.wordProgress[please.id]?.cleanRecapCount, 1, 'Injected clean recap should increment cleanRecapCount');
  assertEqual(storage.wordProgress[please.id]?.recapDue, false, 'Injected clean recap should clear recap due after one pass');
});

test('From earlier disappears when no recapDue words remain', () => {
  const numbers = wordLists.find(list => list.id === 'foundations_numbers');
  assert(numbers, 'Expected foundations_numbers to exist');

  let storage = numbersStorage();
  storage = applyWordProgressPatch(storage, numbers.words[0], { incorrect: true }, '2026-05-05T00:00:00.000Z');
  storage = applyWordProgressPatch(storage, numbers.words[0], { completed: true, cleanCompleted: true, recapCompletedClean: true }, '2026-05-05T00:01:00.000Z');

  assertEqual(storage.wordProgress[numbers.words[0].id]?.recapDue, false, 'Clean recap should clear the only recapDue word');
  assertEqual(getRecapWordCount(storage, wordLists), 0, 'From earlier should disappear when no recapDue words remain');
  assertEqual(formatRecapWordCount(getRecapWordCount(storage, wordLists)), null, 'From earlier count label should be hidden at zero');
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

test('pending word list selection allows only one selected list', () => {
  const pending = selectSingleWordList('stage2_weather');

  assertEqual(pending.length, 1, 'Pending selection should contain one list');
  assertEqual(pending[0], 'stage2_weather', 'Pending selection should contain the selected list');
});

test('selecting a second pending word list replaces the first', () => {
  let pending = selectSingleWordList('stage2_weather');
  pending = selectSingleWordList('stage2_work');

  assertEqual(pending.length, 1, 'Pending selection should still contain one list');
  assertEqual(pending[0], 'stage2_work', 'Second selection should replace the first');
});

test('Done saves one selected list without starting practice', () => {
  const storage = {
    ...createDefaultStorage(),
    hasStartedPracticeSession: false
  };
  const pending = normalizeSingleSelectedListIds(selectSingleWordList('stage2_work'), wordLists);
  const saved = applyManualWordListSelection(storage, pending);

  assertEqual(saved.selectedListIds.length, 1, 'Done should save one selected list');
  assertEqual(saved.selectedListIds[0], 'stage2_work', 'Done should save the pending selected list');
  assertEqual(saved.currentPathPosition, 'stage2_work', 'Done should move the path position to the selected list');
  assertEqual(saved.hasStartedPracticeSession, false, 'Done must not mark practice as started');
  assertEqual(saved.lastSessionResult, null, 'Done should clear stale session-derived state');
});

test('closing word list modal discards pending changes', () => {
  const storage = weatherAndWorkStorage();
  const beforeSelectedListId = storage.selectedListIds[0];
  const pending = selectSingleWordList('stage2_work');
  const closedStorage = storage;

  assertEqual(pending[0], 'stage2_work', 'Setup should have a changed pending selection');
  assertEqual(closedStorage.selectedListIds[0], beforeSelectedListId, 'Closing should leave saved selection unchanged');
  assertEqual(closedStorage.currentPathPosition, 'stage2_weather', 'Closing should leave path position unchanged');
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

test('old multiple selectedListIds storage is migrated to one valid active list', () => {
  const storage = weatherAndWorkStorage();
  const migrated = normalizeStorageWordListSelection(storage, wordLists);
  const recommendation = getRecommendation(migrated, wordLists);

  assertEqual(migrated.selectedListIds.length, 1, 'Migration should keep one selected list ID');
  assertEqual(migrated.selectedListIds[0], 'stage2_weather', 'Migration should keep the first valid active list');
  assertEqual(migrated.currentPathPosition, 'stage2_weather', 'Migration should preserve a valid current path position');
  assertEqual(recommendation.title, 'Continue learning', 'Primary action should use normal single-list recommendation copy');
  assertEqual(recommendation.subtitle, 'Weather — Core', 'Homepage subtitle should name the selected list');
  assertEqual(recommendation.listId, 'stage2_weather', 'Single-list recommendation should provide the selected list ID');
  assertEqual(getSelectedListLabel(storage.selectedListIds, wordLists), 'Weather — Core', 'Selection helper should label older multi-list storage by the first valid list');
});

test('old multiple selectedListIds skips invalid entries before migration', () => {
  const storage = {
    ...createDefaultStorage(),
    selectedListIds: ['missing_list', 'stage2_work', 'stage2_weather'],
    currentPathPosition: 'missing_list'
  };
  const migrated = normalizeStorageWordListSelection(storage, wordLists);

  assertEqual(migrated.selectedListIds.length, 1, 'Migration should keep one selected list');
  assertEqual(migrated.selectedListIds[0], 'stage2_work', 'Migration should keep the first valid active selected list');
  assertEqual(migrated.currentPathPosition, 'stage2_work', 'Migration should repair an invalid current path position');
});

test('practice session draws words from one selected list only', () => {
  const session = createPracticeSession(wordLists, weatherAndWorkStorage());
  const listIds = new Set(session.words.map(word => word.listId));

  assertEqual(session.words.length, 10, 'Session should use the normal ten-word target');
  assert(listIds.has('stage2_weather'), 'Session should include Weather words');
  assertEqual(listIds.has('stage2_work'), false, 'Session should not mix in Work words from older multi-list storage');
});

test('single-list recommendation ignores extra older selected list IDs', () => {
  let storage = weatherAndWorkStorage();
  const weather = wordLists.find(list => list.id === 'stage2_weather');
  assert(weather, 'Expected stage2_weather to exist');

  for (const word of weather.words.slice(0, 2)) {
    storage = applyWordProgressPatch(storage, word, { completed: true, cleanCompleted: true }, '2026-05-05T00:00:00.000Z');
  }

  const recommendation = getRecommendation(storage, wordLists);
  assertEqual(recommendation.kind, 'list', 'Partial selected list should remain normal practice');
  assertEqual(recommendation.title, 'Continue learning', 'Partial selected list should continue normal learning');
  assertEqual(recommendation.subtitle, 'Weather — Core', 'Subtitle should reference the selected list');
  assertEqual(recommendation.listId, 'stage2_weather', 'Recommendation should carry the selected list ID');
});

test('completed single selected list follows normal next-list progression', () => {
  const storage = completeListCleanly(weatherAndWorkStorage(), 'stage2_weather');
  const recommendation = getRecommendation(storage, wordLists);

  assertEqual(hasDifficultWords(storage), false, 'Clean completion should leave no difficult words');
  assertEqual(recommendation.kind, 'list', 'Complete selected list should continue normal path progression');
  assertEqual(recommendation.title, 'Continue learning', 'Complete selected list should use normal continue wording');
  assertEqual(recommendation.subtitle, 'Common Adjectives', 'Subtitle should describe the next list');
  assertEqual(recommendation.listId, 'stage2_adjectives', 'Complete selected list should carry nextListId');
});

test('completed single selected list with difficult words still prioritises review', () => {
  let storage = completeListCleanly(weatherAndWorkStorage(), 'stage2_weather');
  const weather = wordLists.find(list => list.id === 'stage2_weather');
  assert(weather, 'Expected stage2_weather to exist');
  storage = applyWordProgressPatch(storage, weather.words[0], { incorrect: true }, '2026-05-05T00:01:00.000Z');
  storage = {
    ...storage,
    lastSessionResult: storage.lastSessionResult
      ? { ...storage.lastSessionResult, state: 'struggled' }
      : null
  };

  const recommendation = getRecommendation(storage, wordLists);
  assertEqual(hasDifficultWords(storage), true, 'Setup should create a difficult word');
  assertEqual(recommendation.kind, 'review', 'Difficult words should become the primary action');
  assertEqual(recommendation.title, 'Review difficult words', 'Selected list with difficult words should prioritise review');
  assertEqual(recommendation.listId, 'stage2_weather', 'Single-list review should carry the selected list ID');
});

test('single-list completion follows nextListId after completion', () => {
  const storage = {
    ...completeListCleanly(weatherAndWorkStorage(), 'stage2_weather'),
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

  assertEqual(recommendation.listId, 'stage2_adjectives', 'Single-list completion should recommend nextListId');
  assertEqual(recommendation.kind, 'list', 'Single-list completion should progress forward');
  assertEqual(recommendation.title, 'Continue learning', 'Single-list completion should use normal continue wording');
});

test('starting next recommendation stores one selected list ID', () => {
  const storage = completeListCleanly(weatherAndWorkStorage(), 'stage2_weather');
  const recommendation = getRecommendation(storage, wordLists);
  const nextStorage = applyPracticeStartListSelection(storage, recommendation.listId);

  assertEqual(recommendation.kind, 'list', 'Complete selected list should make the next list primary');
  assertEqual(recommendation.listId, 'stage2_adjectives', 'Recommendation should carry the next list ID');
  assertEqual(nextStorage.selectedListIds.length, 1, 'Practice start should store one selected list ID');
  assertEqual(nextStorage.selectedListIds[0], 'stage2_adjectives', 'Practice start should move to nextListId');
  assertEqual(nextStorage.currentPathPosition, 'stage2_adjectives', 'Practice start should update path position');
});

test('word list selected rows do not render a selected check icon', () => {
  const practiceSource = readFileSync('src/components/Practice.tsx', 'utf8');

  assertEqual(practiceSource.includes('wordlist-selected-indicator'), false, 'Selected rows should not render a tick/check icon solely for current selection.');
  assert(practiceSource.includes('wordlist-in-progress-indicator'), 'Word list rows should render an in-progress status indicator.');
  assert(practiceSource.includes('wordlist-completed-indicator'), 'Word list rows should still render the completed check indicator.');
});

test('word list selected-row highlight styling is preserved', () => {
  const styles = readFileSync('src/styles.css', 'utf8');

  assert(styles.includes('.word-lists-page .wordlist-row.selected'), 'Standalone Word Lists selected-row styling should remain present.');
  assert(styles.includes('box-shadow:inset 3px 0 0 rgba(217,0,0,.34)'), 'Selected rows should preserve the left red stripe/accent.');
  assert(styles.includes('background:#fff2ee'), 'Selected rows should preserve the pink highlighted background.');
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
  assertEqual(storage.mixedWelshExposure?.north, 0, 'Missing Mixed Welsh north exposure should normalize to zero');
  assertEqual(storage.mixedWelshExposure?.southStandard, 0, 'Missing Mixed Welsh South/Standard exposure should normalize to zero');
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

test('Mixed Welsh does not always choose South/Standard first across fresh single-variant-group lists', () => {
  const lists = [
    singleVariantGroupList('test_single_variant_1', 1),
    singleVariantGroupList('test_single_variant_2', 2),
    singleVariantGroupList('test_single_variant_3', 3)
  ];
  let storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: [lists[0].id],
    currentPathPosition: lists[0].id,
    settings: {
      ...createDefaultStorage().settings,
      dialectPreference: 'mixed'
    }
  };
  const chosenDialects: PracticeWord['dialect'][] = [];

  for (const list of lists) {
    storage = {
      ...storage,
      selectedListIds: [list.id],
      currentPathPosition: list.id
    };
    const session = createPracticeSession(lists, storage);
    const variant = session.words.find(word => word.variantGroupId === 'shared');
    assert(variant, 'Expected single variant group to be selected');
    chosenDialects.push(variant.dialect);
    storage = completeMixedNormalSessionCleanly(storage, lists, session.words, session.listIds);
  }

  assert(chosenDialects.includes('North Wales'), 'Mixed Welsh progression should include a North Wales first exposure');
  assert(chosenDialects.includes('South Wales / Standard'), 'Mixed Welsh progression should still include South/Standard exposure');
});

test('Mixed Welsh balances North and South variants over repeated normal sessions', () => {
  let storage = wantingStorage('mixed');
  const lists = wordLists;

  for (let index = 0; index < 2; index += 1) {
    const session = createPracticeSession(lists, storage);
    storage = completeMixedNormalSessionCleanly(storage, lists, session.words, session.listIds);
    storage = {
      ...storage,
      selectedListIds: ['stage2_phrases_wanting'],
      currentPathPosition: 'stage2_phrases_wanting'
    };
  }

  assertEqual(storage.mixedWelshExposure?.north, 5, 'Two Mixed Welsh wanting sessions should show five North variants');
  assertEqual(storage.mixedWelshExposure?.southStandard, 5, 'Two Mixed Welsh wanting sessions should show five South/Standard variants');
});

test('Mixed Welsh exposure ignores unavoidable and ungrouped dialect items', () => {
  const list = unavoidableBeforeChoicefulList();
  const storage: SpelioStorage = {
    ...createDefaultStorage(),
    selectedListIds: [list.id],
    currentPathPosition: list.id,
    settings: {
      ...createDefaultStorage().settings,
      dialectPreference: 'mixed'
    }
  };
  const session = createPracticeSession([list], storage);
  const choiceful = session.words.find(word => word.variantGroupId === 'choiceful');

  assert(choiceful, 'Expected choiceful variant group to be selected');
  assertEqual(choiceful.dialect, 'South Wales / Standard', 'Single-side South group should not skew same-session choiceful balancing');

  const nextStorage = addMixedWelshExposure(storage, session.words, [list]);

  assertEqual(nextStorage.mixedWelshExposure?.north, 0, 'Ungrouped North item should not be counted as Mixed Welsh choice exposure');
  assertEqual(nextStorage.mixedWelshExposure?.southStandard, 1, 'Only the choiceful South/Standard variant should be counted');
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
