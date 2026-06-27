import { adminNavGroups } from '../src/admin/navigation';
import { applyCollectionCatalogueOrder, applyCollectionProgressionOrder } from '../src/admin/services/collectionOrdering';
import type { AdminWordList } from '../src/admin/types';

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
  adminNavGroups.map(group => group.label).join('|'),
  'Content|Audio|Reference / Structure|System',
  'Admin sidebar should be grouped around current content architecture.'
);

const contentGroup = adminNavGroups.find(group => group.label === 'Content');
assert(contentGroup, 'Content group should exist.');
assertEqual(
  contentGroup.items.map(item => item.label).join('|'),
  'Overview|Collections|Word Lists|Words|Custom Lists',
  'Content group should keep learner-facing content maintenance separate from audio, system, and internal reference metadata.'
);

const audioGroup = adminNavGroups.find(group => group.label === 'Audio');
assert(audioGroup, 'Audio group should exist.');
assertEqual(
  audioGroup.items.map(item => item.label).join('|'),
  'Audio Queue|Helper Audio',
  'Audio group should only contain audio maintenance surfaces.'
);

const referenceGroup = adminNavGroups.find(group => group.label === 'Reference / Structure');
assert(referenceGroup, 'Reference / Structure group should exist.');
assertEqual(
  referenceGroup.items.map(item => item.label).join('|'),
  'Dialects',
  'Reference group should keep active structure metadata available without exposing deprecated stage or focus categories.'
);

assertEqual(
  referenceGroup.items.some(item => item.path === '/admin/stages'),
  false,
  'Deprecated stages should not appear in ordinary admin sidebar navigation.'
);

assertEqual(
  referenceGroup.items.some(item => item.path === '/admin/focus-categories'),
  false,
  'Deprecated focus categories should not appear in ordinary admin sidebar navigation.'
);

const systemGroup = adminNavGroups.find(group => group.label === 'System');
assert(systemGroup, 'System group should exist.');
assertEqual(
  systemGroup.items.map(item => item.label).join('|'),
  'Import / Export|Settings',
  'System group should contain import/export and settings.'
);

for (const group of adminNavGroups) {
  for (const item of group.items) {
    assert(item.description.trim().length > 0, `${item.label} should explain what it is for.`);
  }
}

function makeList(id: string, collectionId: string, order: number, nextListId: string | null = null, overrides: Partial<AdminWordList> = {}): AdminWordList {
  return {
    id,
    slug: id,
    collectionId,
    collectionName: collectionId,
    name: id,
    nameCy: '',
    description: '',
    descriptionCy: '',
    language: 'Welsh',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    dialect: 'Both',
    stageId: '',
    stage: '',
    focusCategoryId: '',
    focus: '',
    difficulty: 1,
    order,
    nextListId,
    isActive: true,
    createdAt: '',
    updatedAt: '',
    words: [],
    ...overrides
  };
}

const catalogueLists = [
  makeList('animals', 'practice', 7, 'food'),
  makeList('food', 'practice', 8, null),
  makeList('other', 'other', 1, null)
];
const reorderedCatalogueLists = applyCollectionCatalogueOrder(catalogueLists, ['food', 'animals']);

assertEqual(
  reorderedCatalogueLists.find(list => list.id === 'food')?.order,
  1,
  'Collection word-list order save should update the first list order value.'
);
assertEqual(
  reorderedCatalogueLists.find(list => list.id === 'animals')?.order,
  2,
  'Collection word-list order save should update the second list order value.'
);
assertEqual(
  reorderedCatalogueLists.find(list => list.id === 'animals')?.nextListId,
  'food',
  'Collection word-list order save must not change nextListId progression links.'
);

const progressionLists = [
  makeList('animals', 'practice', 1, 'food'),
  makeList('food', 'practice', 2, 'places'),
  makeList('places', 'practice', 3, null),
  makeList('extra', 'practice', 4, 'food'),
  makeList('other', 'other', 1, null)
];
const progressionUpdates = applyCollectionProgressionOrder(progressionLists, 'practice', ['animals', 'places']);

assertEqual(
  progressionUpdates.find(list => list.id === 'animals')?.nextListId,
  'places',
  'Progression order save should link each included list to the next included list.'
);
assertEqual(
  progressionUpdates.find(list => list.id === 'places')?.nextListId,
  null,
  'Progression order save should clear same-collection nextListId on the final included list.'
);
assertEqual(
  progressionUpdates.find(list => list.id === 'food')?.nextListId,
  null,
  'Excluded same-collection lists should not remain inserted in the curated nextListId chain.'
);
assertEqual(
  progressionUpdates.find(list => list.id === 'extra')?.nextListId,
  null,
  'Excluded lists should have same-collection nextListId cleared while remaining browsable.'
);
assertEqual(
  progressionUpdates.find(list => list.id === 'animals')?.order,
  1,
  'Progression order save should not change catalogue/display order values.'
);

const crossCollectionProgression = applyCollectionProgressionOrder([
  makeList('last_foundations', 'learning', 1, 'animals'),
  makeList('animals', 'practice', 1, null)
], 'learning', ['last_foundations']);

assertEqual(
  crossCollectionProgression.find(list => list.id === 'last_foundations')?.nextListId,
  'animals',
  'Progression order save should preserve an existing cross-collection nextListId on the terminal included list.'
);

const changedLegacyMetadata = applyCollectionProgressionOrder([
  makeList('animals', 'practice', 1, null, { stage: 'Changed', focus: 'Changed' }),
  makeList('food', 'practice', 2, null, { stage: 'Other', focus: 'Other' })
], 'practice', ['animals', 'food']);

assertEqual(
  changedLegacyMetadata.find(list => list.id === 'animals')?.nextListId,
  'food',
  'Collection progression ordering should not depend on legacy stage or focus metadata.'
);

const collectionsPageSource = readFileSync('src/admin/pages/CollectionsPage.tsx', 'utf8');
const collectionEditPageSource = readFileSync('src/admin/pages/CollectionEditPage.tsx', 'utf8');

assert(
  collectionsPageSource.includes('role="link"') && collectionsPageSource.includes('onKeyDown='),
  'Collections table rows should be keyboard-accessible links to collection editing.'
);
assertEqual(
  collectionsPageSource.includes('Clear content'),
  false,
  'Clear content should not appear on the main collections table.'
);
assert(
  collectionsPageSource.includes('Collection creation is not exposed in this MVP editor yet.'),
  'Disabled Add collection button should explain why collection creation is not available.'
);
assert(
  collectionEditPageSource.includes('Danger zone') && collectionEditPageSource.includes('Clear content'),
  'Collection destructive actions should live on the individual collection edit page danger zone.'
);
