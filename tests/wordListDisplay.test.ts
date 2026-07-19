import type { WordList } from '../src/data/wordLists';
import { buildPublicCatalogueGroups, compareWordListCollectionsForDisplay, getCollectionDisplayName, getFoundationPatternLabel, getListDisplayDescription, getListDisplayName, getPracticeLibraryCatalogueLists, getPracticeLibraryIconName, getWelshFoundationsCollectionDisplayName, getWordListCatalogueOrder, getWordListStageDisplayName } from '../src/lib/practice/wordListDisplay';

declare function require(name: string): { readFileSync(path: string, encoding: string): string };

const { readFileSync } = require('fs');

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
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
  'Adolygiad — D/DD, Y, F/FF, W, SI',
  'Welsh interface should identify the patterns represented by a legacy review name.'
);

assertEqual(
  getListDisplayName({ name: 'Mixed Confidence — Foundations 4', nameCy: 'Hyder Cymysg — Sylfeini 4' }, 'en'),
  'Review — U, C, G, TH/DD',
  'English interface should identify the patterns represented by a legacy review name.'
);

assertEqual(
  getFoundationPatternLabel({ name: 'Mixed Confidence — Foundations 5', nameCy: 'Hyder Cymysg — Sylfeini 5' }, 'en'),
  'Final Foundations Review',
  'Final review chips should use the clear final-review title.'
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
  { id: 'spelio_core_welsh', name: 'Spelio Core Welsh', nameCy: 'Spelio Craidd Cymraeg', order: 2 },
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

function createPracticeLibraryList(id: string, name: string, order: number, overrides: Partial<WordList> = {}): WordList {
  return createList({
    id,
    collectionId: 'practice',
    collection: practiceAnimalList.collection,
    name,
    stageId: 'core',
    stage: 'Core',
    focus: 'Topic Vocabulary',
    order,
    words: [
      {
        id: `${id}_word`,
        listId: id,
        prompt: name,
        answer: name,
        englishPrompt: name,
        welshAnswer: name,
        sourceLanguage: 'en',
        targetLanguage: 'cy',
        acceptedAlternatives: [],
        order: 1,
        difficulty: 1,
        dialect: 'Both'
      }
    ],
    ...overrides
  });
}

const practiceLibraryOrderedLists = [
  createPracticeLibraryList('practice_most_common_animals', 'Most Common Animals', 1),
  createPracticeLibraryList('practice_most_common_food_and_drink', 'Most Common Food & Drink', 2),
  createPracticeLibraryList('practice_most_common_people_and_family', 'Most Common People & Family', 3),
  createPracticeLibraryList('practice_most_common_home_and_household', 'Most Common Home & Household', 4),
  createPracticeLibraryList('practice_most_common_places', 'Most Common Places', 5),
  createPracticeLibraryList('practice_most_common_travel_and_transport', 'Most Common Travel & Transport', 6),
  createPracticeLibraryList('practice_most_common_weather', 'Most Common Weather', 7),
  createPracticeLibraryList('practice_most_common_colours', 'Most Common Colours', 8),
  createPracticeLibraryList('practice_most_common_clothing', 'Most Common Clothing', 9),
  createPracticeLibraryList('practice_most_common_time_and_calendar', 'Most Common Time & Calendar', 10),
  createPracticeLibraryList('practice_most_common_work', 'Most Common Work', 11),
  createPracticeLibraryList('practice_most_common_school_and_learning', 'Most Common School & Learning', 12),
  createPracticeLibraryList('practice_most_common_nature_and_landscape', 'Most Common Nature & Landscape', 13),
  createPracticeLibraryList('practice_most_common_shopping', 'Most Common Shopping', 14),
  createPracticeLibraryList('practice_most_common_body_parts', 'Most Common Body Parts', 15),
  createPracticeLibraryList('practice_most_common_sports', 'Most Common Sports', 16),
  createPracticeLibraryList('practice_most_common_leisure', 'Most Common Leisure', 17),
  createPracticeLibraryList('practice_most_common_numbers', 'Most Common Numbers', 18),
  createPracticeLibraryList('practice_most_common_meals_and_eating', 'Most Common Meals & Dining', 19),
  createPracticeLibraryList('practice_most_common_around_town', 'Most Common Around Town', 20)
];

const practiceWelshMetadataMigration = readFileSync('supabase/migrations/202606290001_add_practice_welsh_display_metadata.sql', 'utf8');
for (const list of practiceLibraryOrderedLists) {
  const rowPattern = new RegExp(`\\('${list.id}',\\s*'((?:[^']|'')+)',\\s*'((?:[^']|'')+)'\\)`);
  const row = practiceWelshMetadataMigration.match(rowPattern);
  assert(row, `${list.name} should be included in the Practice Welsh display metadata migration.`);
  assert(
    Boolean(row[1]?.trim()) && Boolean(row[2]?.trim()),
    `${list.name} should receive a non-empty Welsh display name and description.`
  );
}
assert(
  /name_cy\s*=\s*case/.test(practiceWelshMetadataMigration) && /description_cy\s*=\s*case/.test(practiceWelshMetadataMigration),
  'Practice Welsh display metadata migration should update Welsh display fields conditionally.'
);
assert(
  !/next_list_id\s*=|order_index\s*=|audio_url\s*=|audio_status\s*=|insert into public\.words/i.test(practiceWelshMetadataMigration),
  'Practice Welsh display metadata migration should not change progression, ordering, audio, or word membership.'
);

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
  ...practiceLibraryOrderedLists
]);
const practiceLibraryGroup = practiceLibraryCatalogue.find(group => group.title === 'Practice Library');
assertEqual(
  practiceLibraryGroup?.listGroups.flatMap(group => group.lists.map(list => list.name)).join('|'),
  [
    'Most Common Animals',
    'Most Common Food & Drink',
    'Most Common People & Family',
    'Most Common Home & Household',
    'Most Common Places',
    'Most Common Travel & Transport',
    'Most Common Weather',
    'Most Common Colours',
    'Most Common Clothing',
    'Most Common Time & Calendar',
    'Most Common Work',
    'Most Common School & Learning',
    'Most Common Nature & Landscape',
    'Most Common Shopping',
    'Most Common Body Parts',
    'Most Common Sports',
    'Most Common Leisure',
    'Most Common Numbers',
    'Most Common Meals & Dining',
    'Most Common Around Town'
  ].join('|'),
  'Practice Library public display should follow the intended admin/catalogue order sequence.'
);

assertEqual(
  getPracticeLibraryIconName({ id: 'practice_most_common_food_and_drink', name: 'Most Common Food & Drink', iconName: '' }),
  'Apple',
  'Practice Library icon defaults should be content-specific when database icon_name is missing.'
);

assertEqual(
  getPracticeLibraryIconName({ id: 'practice_most_common_work', name: 'Most Common Work', iconName: 'BriefcaseBusiness' }),
  'BriefcaseBusiness',
  'Practice Library icon metadata should preserve explicit database icon names for the frontend resolver.'
);

practiceLibraryOrderedLists.forEach((list, index) => {
  const expectedOrder = index + 1;
  assertEqual(list.order, expectedOrder, `${list.name} test fixture order should match the intended admin/catalogue order.`);
  assertEqual(getWordListCatalogueOrder(list), expectedOrder, `${list.name} catalogue order should come from the database/admin order value.`);
});

const expectedPracticeLibraryIcons = [
  ['practice_most_common_animals', 'Most Common Animals', 'Dog'],
  ['practice_most_common_food_and_drink', 'Most Common Food & Drink', 'Apple'],
  ['practice_most_common_people_and_family', 'Most Common People & Family', 'UserRound'],
  ['practice_most_common_home_and_household', 'Most Common Home & Household', 'Home'],
  ['practice_most_common_places', 'Most Common Places', 'MapPin'],
  ['practice_most_common_travel_and_transport', 'Most Common Travel & Transport', 'MapPin'],
  ['practice_most_common_weather', 'Most Common Weather', 'CloudSun'],
  ['practice_most_common_time_and_calendar', 'Most Common Time & Calendar', 'Calendar'],
  ['practice_most_common_colours', 'Most Common Colours', 'Palette'],
  ['practice_most_common_clothing', 'Most Common Clothing', 'Shirt'],
  ['practice_most_common_work', 'Most Common Work', 'Briefcase'],
  ['practice_most_common_school_and_learning', 'Most Common School & Learning', 'GraduationCap'],
  ['practice_most_common_nature_and_landscape', 'Most Common Nature & Landscape', 'Leaf'],
  ['practice_most_common_shopping', 'Most Common Shopping', 'ShoppingBag'],
  ['practice_most_common_body_parts', 'Most Common Body Parts', 'Hand'],
  ['practice_most_common_sports', 'Most Common Sports', 'Trophy'],
  ['practice_most_common_leisure', 'Most Common Leisure', 'Sparkles'],
  ['practice_most_common_numbers', 'Most Common Numbers', 'Hash'],
  ['practice_most_common_meals_and_eating', 'Most Common Meals & Dining', 'Utensils'],
  ['practice_most_common_around_town', 'Most Common Around Town', 'Map']
] as const;

expectedPracticeLibraryIcons.forEach(([id, name, expectedIcon]) => {
  assertEqual(
    getPracticeLibraryIconName({ id, name, iconName: '' }),
    expectedIcon,
    `${name} should use its content-specific icon fallback.`
  );
});

assert(
  new Set(expectedPracticeLibraryIcons.map(([id, name]) => getPracticeLibraryIconName({ id, name, iconName: '' }))).size > 1,
  'Practice Library icon defaults should not collapse every card to BookOpen.'
);

const displayOrderWithExplicitProgression = buildPublicCatalogueGroups([
  createPracticeLibraryList('practice_animals_entry', 'Animals Entry', 1, { nextListId: 'practice_animals_progression_target' }),
  createPracticeLibraryList('practice_animals_browsable_extra', 'Animals Browsable Extra', 2),
  createPracticeLibraryList('practice_animals_progression_target', 'Animals Progression Target', 99)
]);
assertEqual(
  displayOrderWithExplicitProgression[0]?.listGroups.flatMap(group => group.lists.map(list => list.name)).join('|'),
  'Animals Entry|Animals Browsable Extra|Animals Progression Target',
  'Public catalogue display order should not be changed by explicit nextListId progression links.'
);

const shuffledPracticeLibraryPageLists = [
  createPracticeLibraryList('practice_most_common_weather', 'Most Common Weather', 7),
  createPracticeLibraryList('practice_most_common_home_and_household', 'Most Common Home & Household', 4),
  createPracticeLibraryList('practice_most_common_animals', 'Most Common Animals', 1),
  createPracticeLibraryList('practice_most_common_places', 'Most Common Places', 5),
  createPracticeLibraryList('practice_most_common_food_and_drink', 'Most Common Food & Drink', 2)
];
assertEqual(
  getPracticeLibraryCatalogueLists(shuffledPracticeLibraryPageLists).map(list => list.id).join('|'),
  'practice_most_common_animals|practice_most_common_food_and_drink|practice_most_common_home_and_household|practice_most_common_places|practice_most_common_weather',
  'Practice Library page cards should render from database/admin order, not hard-coded visual order or input order.'
);

const practiceSource = readFileSync('src/components/Practice.tsx', 'utf8');
assert(
  !practiceSource.includes('PRACTICE_LIBRARY_MAIN_LIST_IDS'),
  'Practice Library page rendering should not use a hard-coded visual ID order.'
);
assert(
  practiceSource.includes('return Icon ?? BookOpen;') && !practiceSource.includes("typeof Icon === 'function'"),
  'Lucide icon resolution should accept React component object exports and only fall back to BookOpen when no icon resolves.'
);

const stylesSource = readFileSync('src/styles.css', 'utf8');
assert(
  /\.public-app\[data-theme="dark"\] \.word-lists-page\{\s*--word-lists-card-bg:/.test(stylesSource) &&
    !/@supports \(-webkit-touch-callout:none\)\{\s*\.public-app\[data-theme="dark"\] \.word-lists-page\{\s*--word-lists-card-bg:/.test(stylesSource),
  'Shared Word Lists dark surfaces should apply in normal web and Android dark mode, not only in iOS WebKit.'
);
const darkWordListsTokens = stylesSource.match(
  /\.public-app\[data-theme="dark"\] \.word-lists-page\{([\s\S]*?)\n\}/
)?.[1] ?? '';
const webKitWordListsCompatibility = stylesSource.match(
  /@supports \(-webkit-touch-callout:none\)\{([\s\S]*?)\n\}/
)?.[1] ?? '';
assert(
  webKitWordListsCompatibility.includes('-webkit-appearance:none;') &&
    !/(?:background|color|border-color|box-shadow):/.test(webKitWordListsCompatibility),
  'The iOS/WebKit-specific Word Lists block should contain only native control-painting compatibility.'
);

function getHexToken(name: string) {
  const value = darkWordListsTokens.match(new RegExp(`--${name}:(#[0-9a-f]{6});`, 'i'))?.[1];
  assert(value, `Dark word-list theme should define --${name} as an explicit application-owned colour.`);
  return value;
}

function relativeLuminance(hex: string) {
  const channels = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
  const [red, green, blue] = channels.map(channel => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

const darkCardBackground = getHexToken('word-lists-card-bg');
assert(
  contrastRatio(getHexToken('word-lists-card-text'), darkCardBackground) >= 7,
  'Dark word-list card text should retain enhanced contrast against card surfaces.'
);
assert(
  contrastRatio(getHexToken('word-lists-card-muted'), darkCardBackground) >= 4.5,
  'Dark word-list descriptions and progress copy should retain readable contrast against card surfaces.'
);
assert(
  contrastRatio(getHexToken('word-lists-selected-text'), getHexToken('word-lists-selected-bg')) >= 4.5,
  'Selected word-list labels should remain readable and visually distinct in dark mode.'
);
assert(
  contrastRatio(getHexToken('word-lists-completed-text'), getHexToken('word-lists-completed-bg')) >= 4.5,
  'Completed word-list labels should remain readable and visually distinct in dark mode.'
);
assert(
  contrastRatio(getHexToken('word-lists-progress-text'), getHexToken('word-lists-progress-bg')) >= 4.5,
  'In-progress word-list labels should remain readable and visually distinct in dark mode.'
);
assert(
  /\.learning-journey-chip\.selected:is\(\.completed,\.in-progress\)\{[\s\S]*?background:var\(--word-lists-selected-bg\);/.test(stylesSource),
  'A selected preview chip should remain visibly selected when it is also completed or in progress.'
);
assert(
  contrastRatio(getHexToken('word-lists-footer-text'), '#0f0d0b') >= 4.5,
  'The word-list page footer should remain readable against the dark app background.'
);

assert(
  !/(?:^|[;\s])(opacity|filter|backdrop-filter):/i.test(darkWordListsTokens) &&
    !/\.word-lists-page::(?:before|after)/.test(stylesSource),
  'The dark word-list page must not use a page-wide opacity, filter, backdrop, or overlay.'
);
assert(
  /\.public-app\[data-theme="dark"\] \.word-lists-page \.practice-library-growth-link\{[\s\S]*?background:var\(--word-lists-card-raised\);[\s\S]*?color:var\(--word-lists-card-text\);/.test(stylesSource) &&
    practiceSource.includes('<a className="practice-library-growth-link"') &&
    practiceSource.includes("{t('wordLists.suggestTopic')}"),
  'The Practice Library growth action should keep its content and use an explicit readable dark surface.'
);
assert(
  /\.public-app\[data-theme="dark"\] \.word-lists-page :is\(button,a\),[\s\S]*?-webkit-appearance:none;[\s\S]*?appearance:none;/.test(stylesSource),
  'Dark word-list controls should opt out of iOS native control repainting.'
);
assert(
  /\.wordlist-page-actions\{[\s\S]*?padding:8px clamp\(24px,5vw,72px\) calc\(8px \+ env\(safe-area-inset-bottom\)\);/.test(stylesSource) &&
    /@media \(max-width:520px\)\{[\s\S]*?\.wordlist-page-actions\{[\s\S]*?calc\(12px \+ env\(safe-area-inset-bottom\)\)/.test(stylesSource) &&
    /\.word-lists-page\.how-page\{[\s\S]*?padding-bottom:calc\(112px \+ env\(safe-area-inset-bottom\)\);/.test(stylesSource) &&
    /\.word-lists-page\.how-page\{[\s\S]*?padding:calc\(32px \+ env\(safe-area-inset-top\)\) 26px calc\(106px \+ env\(safe-area-inset-bottom\)\);/.test(stylesSource),
  'The word-list page should clear the iPhone status area and fixed action bar while preserving bottom safe-area padding.'
);
assert(
  stylesSource.includes('background:rgba(255,255,255,.76);') &&
    stylesSource.includes('background:rgba(255,255,255,.78);') &&
    stylesSource.indexOf('background:rgba(255,255,255,.76);') < stylesSource.indexOf('--word-lists-card-bg:#211d19;'),
  'Existing light-mode word-list surfaces should remain intact ahead of scoped dark-mode overrides.'
);
