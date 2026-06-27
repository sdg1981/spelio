import type { WordList } from '../src/data/wordLists';
import { buildPublicCatalogueGroups, compareWordListCollectionsForDisplay, getCollectionDisplayName, getListDisplayDescription, getListDisplayName, getWelshFoundationsCollectionDisplayName, getWordListStageDisplayName } from '../src/lib/practice/wordListDisplay';

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

assertEqual(
  getWordListStageDisplayName({
    collectionId: 'spelio_core_welsh',
    stageId: 'foundations',
    stage: 'Foundations'
  }),
  'Foundations',
  'Spelio Core Welsh should keep the shared Foundations stage label.'
);

assertEqual(
  getWordListStageDisplayName({
    collectionId: 'spelio_welsh_foundations',
    stageId: 'foundations',
    stage: 'Foundations'
  }),
  'Spelling Patterns',
  'Welsh Spelling Foundations should override the foundations stage label for public display.'
);

assertEqual(
  getWordListStageDisplayName({
    collectionId: 'future_collection',
    stageId: '',
    stage: ''
  }),
  'Word Lists',
  'Lists without legacy stage metadata should still receive a non-empty public catalogue group label.'
);

assertEqual(
  getListDisplayName({ name: 'Mixed Confidence — Foundations 1', nameCy: 'Hyder Cymysg — Sylfeini 1' }, 'cy'),
  'Hyder Cymysg — Sylfeini 1',
  'Welsh interface should prefer Welsh list display names.'
);

assertEqual(
  getListDisplayDescription({ description: 'English description.', descriptionCy: 'Disgrifiad Cymraeg.' }, 'cy'),
  'Disgrifiad Cymraeg.',
  'Welsh interface should prefer Welsh list display descriptions.'
);

assertEqual(
  getListDisplayName({ name: 'D / DD', nameCy: 'D / DD' }, 'cy'),
  'D / DD',
  'Pure pattern labels should remain unchanged in Welsh display.'
);

assertEqual(
  getCollectionDisplayName({ name: 'Welsh Spelling Foundations', nameCy: 'Sylfeini Sillafu Cymraeg' }, 'cy'),
  'Sylfeini Sillafu Cymraeg',
  'Welsh interface should prefer Welsh collection display names.'
);

assertEqual(
  getCollectionDisplayName({ name: 'Welsh Spelling Foundations', nameCy: '' }, 'cy'),
  'Welsh Spelling Foundations',
  'Collection display should fall back to English when Welsh metadata is absent.'
);

assertEqual(
  getWelshFoundationsCollectionDisplayName('cy'),
  'Sylfeini Sillafu Cymraeg',
  'Foundations collection fallback should preserve Welsh homepage context copy.'
);

const sortedCollections = [
  { id: 'spelio_core_welsh', name: 'Spelio Core Welsh', nameCy: 'Spelio Cymraeg Craidd', order: 2 },
  { id: 'missing_order_b', name: 'Beta Collection', order: null },
  { id: 'missing_order_a', name: 'Alpha Collection', order: null },
  { id: 'spelio_welsh_foundations', name: 'Welsh Spelling Foundations', nameCy: 'Sylfeini Sillafu Cymraeg', order: 1 }
].sort((a, b) => compareWordListCollectionsForDisplay(a, b));

assertEqual(
  sortedCollections[0].id,
  'spelio_welsh_foundations',
  'Collection display sorting should put lower collection order first.'
);

assertEqual(
  sortedCollections[1].id,
  'spelio_core_welsh',
  'Collection display sorting should put Spelio Core Welsh after Welsh Spelling Foundations when its order is 2.'
);

assertEqual(
  sortedCollections[2].id,
  'missing_order_a',
  'Collection display sorting should fall back to collection name when order is missing.'
);

function createList(overrides: Partial<WordList>): WordList {
  return {
    id: 'list',
    collectionId: 'spelio_core_welsh',
    collection: {
      id: 'spelio_core_welsh',
      slug: 'spelio-core-welsh',
      name: 'Spelio Core Welsh',
      description: '',
      type: 'spelio_core',
      sourceLanguage: 'en',
      targetLanguage: 'cy',
      ownerType: 'spelio',
      ownerId: null,
      order: 1,
      isActive: true
    },
    name: 'List',
    description: '',
    language: 'Welsh',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    dialect: 'Both',
    stageId: 'core',
    stage: 'Core',
    difficulty: 1,
    order: 1,
    nextListId: null,
    isActive: true,
    words: [],
    ...overrides
  };
}

const foundationsList = createList({
  id: 'foundation_patterns_d_dd',
  collectionId: 'spelio_welsh_foundations',
  collection: {
    id: 'spelio_welsh_foundations',
    slug: 'welsh-spelling-foundations',
    name: 'Welsh Spelling Foundations',
    nameCy: 'Sylfeini Sillafu Cymraeg',
    description: '',
    type: 'spelio_core',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    ownerType: 'spelio',
    ownerId: null,
    order: 1,
    isActive: true
  },
  name: 'D / DD',
  stageId: 'foundations',
  stage: 'Foundations'
});

const practiceAnimalList = createList({
  id: 'practice_most_common_animals',
  collectionId: 'practice',
  collection: {
    id: 'practice',
    slug: 'practice',
    name: 'Practice',
    description: '',
    type: 'spelio_core',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    ownerType: 'spelio',
    ownerId: null,
    order: 2,
    isActive: true
  },
  name: 'Most Common Animals',
  stageId: 'core',
  stage: 'Core',
  focus: 'Topic Vocabulary',
  order: 1
});

const practiceFoodList = createList({
  ...practiceAnimalList,
  id: 'practice_most_common_food_and_drink',
  name: 'Most Common Food & Drink',
  focus: 'Legacy Focus Label',
  order: 2
});

function createPracticeLibraryList(id: string, name: string, order: number): WordList {
  return createList({
    id,
    collectionId: 'practice',
    collection: practiceAnimalList.collection,
    name,
    stageId: 'core',
    stage: 'Core',
    focus: 'Topic Vocabulary',
    order
  });
}

const practiceLibraryRawOrderLists = [
  createPracticeLibraryList('practice_most_common_animals', 'Most Common Animals', 1),
  createPracticeLibraryList('practice_most_common_food_and_drink', 'Most Common Food & Drink', 2),
  createPracticeLibraryList('practice_most_common_places', 'Most Common Places', 3),
  createPracticeLibraryList('practice_most_common_people_and_family', 'Most Common People & Family', 4),
  createPracticeLibraryList('practice_most_common_weather', 'Most Common Weather', 5),
  createPracticeLibraryList('practice_most_common_colours', 'Most Common Colours', 6),
  createPracticeLibraryList('practice_most_common_clothing', 'Most Common Clothing', 7),
  createPracticeLibraryList('practice_most_common_time_and_calendar', 'Most Common Time & Calendar', 8),
  createPracticeLibraryList('practice_most_common_work', 'Most Common Work', 9),
  createPracticeLibraryList('practice_most_common_school_and_learning', 'Most Common School & Learning', 10),
  createPracticeLibraryList('practice_most_common_home_and_household', 'Most Common Home & Household', 11),
  createPracticeLibraryList('practice_most_common_travel_and_transport', 'Most Common Travel & Transport', 12),
  createPracticeLibraryList('practice_most_common_nature_and_landscape', 'Most Common Nature & Landscape', 13),
  createPracticeLibraryList('practice_most_common_shopping', 'Most Common Shopping', 14),
  createPracticeLibraryList('practice_most_common_body_parts', 'Most Common Body Parts', 15),
  createPracticeLibraryList('practice_most_common_sports', 'Most Common Sports', 16),
  createPracticeLibraryList('practice_most_common_leisure', 'Most Common Leisure', 17),
  createPracticeLibraryList('practice_most_common_numbers', 'Most Common Numbers', 18),
  createPracticeLibraryList('practice_most_common_meals_and_eating', 'Most Common Meals & Eating', 19),
  createPracticeLibraryList('practice_most_common_around_town', 'Most Common Around Town', 20)
];

const inactiveCollectionList = createList({
  id: 'inactive_topic',
  collectionId: 'inactive',
  collection: {
    id: 'inactive',
    slug: 'inactive',
    name: 'Inactive',
    description: '',
    type: 'spelio_core',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    ownerType: 'spelio',
    ownerId: null,
    order: 3,
    isActive: false
  },
  name: 'Inactive Topic',
  isActive: true
});

const catalogueGroups = buildPublicCatalogueGroups([
  practiceFoodList,
  inactiveCollectionList,
  foundationsList,
  practiceAnimalList
]);

assertEqual(
  catalogueGroups.map(group => group.title).join('|'),
  'Learning|Practice Library',
  'Public catalogue should use product-area labels and hide inactive collections.'
);

assertEqual(
  catalogueGroups[0].listGroups[0].title,
  'Welsh Spelling Foundations',
  'Foundations should remain the journey/list group title under Learning.'
);

assertEqual(
  catalogueGroups[0].listGroups[0].subtitle,
  'Spelling Patterns',
  'Foundations should expose Spelling Patterns as the visible subgroup label.'
);

assertEqual(
  catalogueGroups[1].listGroups.map(group => group.title).join('|'),
  'Animals|Food & Drink',
  'Practice Library should group active topic lists by catalogue category instead of generic Core stage or focus metadata.'
);

assertEqual(
  catalogueGroups[1].listGroups[0].lists[0].name,
  'Most Common Animals',
  'Practice Library category display should preserve the actual database-backed list name.'
);

const practiceLibraryCatalogue = buildPublicCatalogueGroups([
  foundationsList,
  ...practiceLibraryRawOrderLists
]);
const practiceLibraryGroup = practiceLibraryCatalogue.find(group => group.title === 'Practice Library');
assertEqual(
  practiceLibraryGroup?.listGroups.flatMap(group => group.lists.map(list => list.name)).join('|'),
  [
    'Most Common Animals',
    'Most Common Food & Drink',
    'Most Common Places',
    'Most Common Travel & Transport',
    'Most Common People & Family',
    'Most Common Home & Household',
    'Most Common Weather',
    'Most Common Time & Calendar',
    'Most Common School & Learning',
    'Most Common Work',
    'Most Common Colours',
    'Most Common Clothing',
    'Most Common Nature & Landscape',
    'Most Common Shopping',
    'Most Common Body Parts',
    'Most Common Sports',
    'Most Common Leisure',
    'Most Common Numbers',
    'Most Common Meals & Eating',
    'Most Common Around Town'
  ].join('|'),
  'Practice Library public display should follow the intended catalogue sequence, not raw legacy order indexes.'
);
