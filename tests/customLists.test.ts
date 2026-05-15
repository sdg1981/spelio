import {
  CUSTOM_LIST_MAX_ROWS,
  getVisibleCustomListRowCount,
  validateCustomListRows,
  type CustomListEntryInput
} from '../src/lib/customListValidation';
import { getCustomListCanonicalUrl, getCustomListPath, getCustomPublicIdFromPath } from '../src/lib/customListRoutes';
import { createSharedWordListContext, createSharedWordListEffectiveStorage, isPracticeTestShareMode, restoreSharedWordListProgression } from '../src/lib/wordListSharing';
import { createDefaultStorage } from '../src/lib/practice/storage';
import type { WordList } from '../src/data/wordLists';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function assertDeepEqual(actual: unknown, expected: unknown, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function rows(values: Array<Partial<CustomListEntryInput>>): CustomListEntryInput[] {
  return values.map(value => ({ welsh: value.welsh ?? '', english: value.english ?? '' }));
}

function createCustomList(): WordList {
  return {
    id: 'custom:cl_testtoken1234567890',
    slug: 'cl_testtoken1234567890',
    collectionId: 'temporary_custom_lists',
    name: 'Custom spelling list',
    description: '',
    language: 'Welsh',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    dialect: 'Both',
    stage: 'Custom',
    focus: 'Custom',
    difficulty: 1,
    order: 0,
    nextListId: null,
    isActive: true,
    words: [
      {
        id: 'custom-word-1',
        listId: 'custom:cl_testtoken1234567890',
        prompt: 'coffee',
        answer: 'coffi',
        englishPrompt: 'coffee',
        welshAnswer: 'coffi',
        sourceLanguage: 'en',
        targetLanguage: 'cy',
        audioUrl: 'https://example.com/coffi.mp3',
        audioStatus: 'ready',
        order: 1,
        dialect: 'Both'
      }
    ]
  };
}

{
  const validation = validateCustomListRows(rows([
    { welsh: ' coffi ', english: ' coffee ' },
    { welsh: '' },
    { welsh: ' ysgol ' },
    { english: '' }
  ]));
  assertDeepEqual(validation.errors, [], 'Complete Welsh rows should not produce validation errors.');
  assertDeepEqual(validation.entries, [
    { welsh: 'coffi', english: 'coffee' },
    { welsh: 'ysgol', english: '' }
  ], 'Validation should trim rows, ignore trailing empties, and keep order.');
}

{
  const validation = validateCustomListRows(rows([{ english: 'coffee' }]));
  assert(validation.errors.some(error => error.code === 'welshRequired'), 'English-only rows should require Welsh spelling.');
}

{
  const validation = validateCustomListRows(rows([]));
  assert(validation.errors.some(error => error.code === 'noEntries'), 'A list with no Welsh entries should be rejected.');
}

{
  const validation = validateCustomListRows(rows(Array.from({ length: 5 }, () => ({ welsh: 'coffi' }))));
  assert(validation.errors.some(error => error.code === 'repeatedSpam'), 'Repeated spam rows should be rejected.');
}

{
  const visible = getVisibleCustomListRowCount(rows([
    { welsh: 'un' },
    { welsh: 'dau' },
    { welsh: 'tri' },
    { welsh: 'pedwar' },
    { welsh: 'pump' }
  ]));
  assertEqual(visible, 6, 'Progressive rows should reveal one next empty row after the last used row.');
  assertEqual(getVisibleCustomListRowCount(rows(Array.from({ length: CUSTOM_LIST_MAX_ROWS }, (_, index) => ({ welsh: String(index) })))), CUSTOM_LIST_MAX_ROWS, 'Visible rows should never exceed the maximum.');
}

{
  const publicId = 'cl_testtoken1234567890';
  assertEqual(getCustomListPath(publicId), '/custom/cl_testtoken1234567890', 'Custom list paths should use the non-guessable public ID.');
  assertEqual(getCustomListCanonicalUrl(publicId, 'https://spelio.cymru', { practiceTest: true }), 'https://spelio.cymru/custom/cl_testtoken1234567890?mode=practice-test', 'Practice-test URLs should be query-scoped.');
  assertEqual(getCustomPublicIdFromPath('/custom/cl_testtoken1234567890'), publicId, 'Public ID should parse from custom route.');
  assertEqual(isPracticeTestShareMode('?mode=practice-test'), true, 'Practice-test mode should be detected from query string.');
}

{
  const storage = {
    ...createDefaultStorage(),
    selectedListIds: ['foundations_first_words'],
    currentPathPosition: 'foundations_first_words'
  };
  const customList = createCustomList();
  const context = createSharedWordListContext(storage, customList, 'cl_testtoken1234567890', 'practice-test', true);
  const effective = createSharedWordListEffectiveStorage(storage, context);
  assertDeepEqual(effective.selectedListIds, [customList.id], 'Detached custom context should select the custom list only in-session.');
  assertEqual(effective.currentPathPosition, customList.id, 'Detached custom context should point at the custom list in-session.');
  const restored = restoreSharedWordListProgression(effective, context);
  assertDeepEqual(restored.selectedListIds, ['foundations_first_words'], 'Custom practice should not overwrite normal selectedListIds.');
  assertEqual(restored.currentPathPosition, 'foundations_first_words', 'Custom practice should not overwrite normal path position.');
}

console.log('customLists tests passed');
