import { adminNavGroups } from '../src/admin/navigation';
import { collectionMetadataFieldLabels, createCollectionSlug, createDraftAdminCollection, validateAdminCollectionDraft } from '../src/admin/services/collectionDraft';
import { applyCollectionCatalogueOrder, applyCollectionProgressionOrder } from '../src/admin/services/collectionOrdering';
import type { AdminWordList, AdminWordListCollection } from '../src/admin/types';

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

const customListsNavItem = contentGroup.items.find(item => item.path === '/admin/custom-lists');
assert(customListsNavItem, 'Custom Lists admin navigation item should remain available.');
assertEqual(
  customListsNavItem.badge ?? '',
  '',
  'Custom Lists admin navigation item should not render a Preview badge.'
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
    iconName: '',
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

function makeCollection(id: string, slug: string, order: number, overrides: Partial<AdminWordListCollection> = {}): AdminWordListCollection {
  return {
    id,
    slug,
    name: id,
    nameCy: '',
    description: '',
    descriptionCy: '',
    type: 'spelio_core',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    curriculumKeyStage: null,
    curriculumArea: null,
    ownerType: 'spelio',
    ownerId: null,
    order,
    isActive: true,
    introContent: null,
    createdAt: '',
    updatedAt: '',
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

const draftCollection = createDraftAdminCollection({
  existingCollections: [
    makeCollection('core', 'core', 2),
    makeCollection('practice', 'practice', 5)
  ],
  now: '2026-06-28T00:00:00.000Z'
});

assertEqual(draftCollection.type, 'spelio_core', 'New collection drafts should default to the Spelio core type.');
assertEqual(draftCollection.sourceLanguage, 'en', 'New collection drafts should default to English source language.');
assertEqual(draftCollection.targetLanguage, 'cy', 'New collection drafts should default to Welsh target language.');
assertEqual(draftCollection.ownerType, 'spelio', 'New collection drafts should default to Spelio ownership.');
assertEqual(draftCollection.isActive, true, 'New collection drafts should default to active.');
assertEqual(draftCollection.order, 6, 'New collection drafts should use the next available collection order.');
assertEqual(
  collectionMetadataFieldLabels.join('|'),
  'Name|Slug|Description|Type|Source language|Target language|Order|Public visibility|Owner type|Owner ID',
  'Create and edit should share the same collection metadata field set.'
);
assertEqual(createCollectionSlug('Most Common Places!'), 'most-common-places', 'Collection names should generate editable URL-safe slugs.');
assertEqual(
  validateAdminCollectionDraft({ ...draftCollection, name: 'Most Common Places', slug: 'most-common-places' }, [makeCollection('animals', 'animals', 1)]).length,
  0,
  'Valid collection drafts should pass validation.'
);
assert(
  validateAdminCollectionDraft({ ...draftCollection, name: 'Bad Slug', slug: 'Bad Slug' }, []).some(error => error.includes('lowercase letters')),
  'Collection slug validation should reject spaces and uppercase characters.'
);
assert(
  validateAdminCollectionDraft({ ...draftCollection, name: 'Duplicate', slug: 'practice' }, [makeCollection('practice', 'practice', 1)]).some(error => error.includes('unique')),
  'Collection slug validation should reject duplicate slugs.'
);

const collectionsPageSource = readFileSync('src/admin/pages/CollectionsPage.tsx', 'utf8');
const collectionEditPageSource = readFileSync('src/admin/pages/CollectionEditPage.tsx', 'utf8');
const wordListsPageSource = readFileSync('src/admin/pages/WordListsPage.tsx', 'utf8');
const adminAppSource = readFileSync('src/admin/AdminApp.tsx', 'utf8');
const adminRouterSource = readFileSync('src/admin/utils/router.ts', 'utf8');

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
  collectionsPageSource.includes("navigate('/admin/collections/new')") &&
    collectionsPageSource.includes('<Plus size={16} /> Add collection'),
  'Add collection button should navigate to the collection creation flow.'
);
assert(
  adminAppSource.includes("path === '/admin/collections/new'") &&
    adminAppSource.includes('mode="create"'),
  'Admin router should expose the collection creation route.'
);
assert(
  collectionEditPageSource.includes('repository.createCollection') &&
    collectionEditPageSource.includes('repository.saveCollection') &&
    collectionEditPageSource.includes('Create collection') &&
    collectionEditPageSource.includes('validateAdminCollectionDraft') &&
    collectionEditPageSource.includes('createCollectionSlug'),
  'Collection editor should reuse the edit surface for successful creation with slug validation.'
);
assertEqual(
  collectionEditPageSource.split('<CollectionMetadataForm').length - 1,
  1,
  'Create and edit should render collection metadata through one shared form call.'
);
assert(
  collectionEditPageSource.includes('data-collection-metadata-fields={collectionMetadataFieldLabels.join') &&
    collectionEditPageSource.includes('value={collection.name}') &&
    collectionEditPageSource.includes('value={collection.slug}') &&
    collectionEditPageSource.includes('value={collection.description}') &&
    collectionEditPageSource.includes('value={collection.type}') &&
    collectionEditPageSource.includes('value={collection.sourceLanguage}') &&
    collectionEditPageSource.includes('value={collection.targetLanguage}') &&
    collectionEditPageSource.includes('value={collection.order}') &&
    collectionEditPageSource.includes('checked={collection.isActive}') &&
    collectionEditPageSource.includes('value={collection.ownerType ??') &&
    collectionEditPageSource.includes('value={collection.ownerId ??'),
  'Shared collection metadata form should bind existing edit values for every collection field.'
);
assertEqual(
  collectionEditPageSource.includes('Core collection metadata is preserved and remains read-only in this MVP editor.'),
  false,
  'Edit mode should no longer present collection metadata as read-only while create mode exposes those fields.'
);
assert(
  !collectionEditPageSource.includes('stageId') &&
    !collectionEditPageSource.includes('focusCategoryId'),
  'Collection creation should not reintroduce stage or focus category fields.'
);
assert(
  collectionEditPageSource.includes('Danger zone') && collectionEditPageSource.includes('Clear content'),
  'Collection destructive actions should live on the individual collection edit page danger zone.'
);
assert(
  collectionEditPageSource.includes('Word lists in this collection') &&
    collectionEditPageSource.includes("navigate(`/admin/word-lists/${encodeURIComponent(list.id)}`)") &&
    collectionEditPageSource.includes("navigate(`/admin/word-lists?collection=${encodeURIComponent(collection.id)}`)"),
  'Collection edit page should provide compact navigation into word lists in the collection.'
);
assert(
  wordListsPageSource.includes("new URLSearchParams(window.location.search).get('collection')") &&
    wordListsPageSource.includes('list.collectionId === collectionFilter') &&
    wordListsPageSource.includes("navigate('/admin/word-lists')"),
  'Word lists index should support collection-filtered admin navigation with a clear path back to all lists.'
);
assert(
  adminRouterSource.includes('window.location.search') &&
    adminAppSource.includes("const routePath = path.split('?')[0] ?? path;"),
  'Admin routing should preserve query-string filters while matching pages by pathname.'
);
