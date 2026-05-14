import { wordLists, type WordList } from '../src/data/wordLists';
import {
  applySharedWordListSelection,
  createSharedWordListContext,
  createSharedWordListEffectiveStorage,
  findActiveWordListBySlug,
  getSharedWordListSlugFromPath,
  getWordListCanonicalUrl,
  getWordListSlug,
  isPracticeTestShareMode,
  restoreSharedWordListProgression,
  shouldShowSelectedListShareAction,
  slugifyWordListName
} from '../src/lib/wordListSharing';
import { createDefaultStorage, type SessionResult } from '../src/lib/practice/storage';
import { applyManualWordListSelection } from '../src/lib/practice/storage';
import { createAdminWordListSlug, validateAdminWordListSlug } from '../src/admin/services/wordListSlug';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

const firstVerbs = wordLists.find(list => list.name === 'First Verbs — Core Actions');
assert(firstVerbs, 'Expected First Verbs list to exist');

assertEqual(
  slugifyWordListName('First Verbs — Core Actions'),
  'first-verbs-core-actions',
  'Fallback slugs should be readable, lowercase, and hyphenated.'
);

assertEqual(
  getWordListSlug({ ...firstVerbs, slug: 'custom-first-verbs' }),
  'custom-first-verbs',
  'Stored valid slugs should take precedence over derived list-name slugs.'
);

assertEqual(
  getWordListCanonicalUrl(firstVerbs, 'https://spelio.cymru/'),
  'https://spelio.cymru/list/first-verbs-core-actions',
  'Canonical share URLs should use /list/{slug}.'
);

assertEqual(
  getWordListCanonicalUrl(firstVerbs, 'https://spelio.cymru/', { practiceTest: true }),
  'https://spelio.cymru/list/first-verbs-core-actions?mode=practice-test',
  'Practice test share URLs should add the mode query parameter.'
);

assertEqual(
  isPracticeTestShareMode('?mode=practice-test'),
  true,
  'Practice test share mode should be detected from the query string.'
);

assertEqual(
  isPracticeTestShareMode('?mode=teacher'),
  false,
  'Other mode query values should not enable practice test behaviour.'
);

assertEqual(
  shouldShowSelectedListShareAction(firstVerbs.id, firstVerbs.id),
  true,
  'Selected rows should expose the contextual share action.'
);

assertEqual(
  shouldShowSelectedListShareAction('another-list', firstVerbs.id),
  false,
  'Non-selected rows should not expose share actions.'
);

assertEqual(
  getSharedWordListSlugFromPath('/list/first-verbs-core-actions'),
  'first-verbs-core-actions',
  'Friendly list routes should parse valid slugs.'
);

assertEqual(
  getSharedWordListSlugFromPath('/list/Invalid Slug'),
  null,
  'Invalid route slugs should be ignored safely.'
);

assertEqual(
  findActiveWordListBySlug(wordLists, 'first-verbs-core-actions')?.id,
  firstVerbs.id,
  'Valid list slugs should resolve to their active word list.'
);

const inactiveList: WordList = { ...firstVerbs, id: 'inactive-first-verbs', isActive: false };
assertEqual(
  findActiveWordListBySlug([inactiveList], 'first-verbs-core-actions'),
  null,
  'Inactive shared slugs should be ignored.'
);

const sharedStorage = applySharedWordListSelection(createDefaultStorage(), firstVerbs);
assertEqual(sharedStorage.selectedListIds[0], firstVerbs.id, 'Temporary shared selection should preselect exactly the shared list.');
assertEqual(sharedStorage.currentPathPosition, firstVerbs.id, 'Temporary shared selection should present the shared list as current.');
assertEqual(sharedStorage.hasStartedPracticeSession, false, 'Temporary shared selection must not mark practice as started.');
assertEqual(sharedStorage.lastSessionResult, null, 'Temporary shared selection should clear stale completion state without starting practice.');

const previousResult: SessionResult = {
  totalWords: 10,
  correctWords: 9,
  incorrectWords: 1,
  revealedWords: 0,
  incorrectAttempts: 1,
  revealedLetters: 0,
  durationSeconds: 30,
  listIds: ['foundations_numbers'],
  state: 'struggled'
};
const mainStorage = {
  ...createDefaultStorage(),
  selectedListIds: ['foundations_numbers'],
  currentPathPosition: 'foundations_numbers',
  lastSessionDate: '2026-05-01T10:00:00.000Z',
  lastSessionResult: previousResult
};
const sharedContext = createSharedWordListContext(mainStorage, firstVerbs, 'first-verbs-core-actions', 'practice-test');
const visibleSharedStorage = createSharedWordListEffectiveStorage(mainStorage, sharedContext);
assertEqual(visibleSharedStorage.selectedListIds[0], firstVerbs.id, 'Shared context should present the linked list temporarily.');
assertEqual(visibleSharedStorage.currentPathPosition, firstVerbs.id, 'Shared context should give session creation the linked list.');
assertEqual(visibleSharedStorage.lastSessionResult, null, 'Shared context should not let prior completion state advance away from the linked list.');
assertEqual(sharedContext.mode, 'practice-test', 'Practice test state should live on the transient shared context.');

const sharedResult: SessionResult = {
  totalWords: 10,
  correctWords: 10,
  incorrectWords: 0,
  revealedWords: 0,
  incorrectAttempts: 0,
  revealedLetters: 0,
  durationSeconds: 25,
  listIds: [firstVerbs.id],
  state: 'strong'
};
const sharedWordId = firstVerbs.words[0]?.id;
assert(sharedWordId, 'Expected First Verbs to contain at least one word.');
const restoredSharedStorage = restoreSharedWordListProgression(
  {
    ...visibleSharedStorage,
    selectedListIds: [firstVerbs.id],
    currentPathPosition: firstVerbs.id,
    lastSessionDate: '2026-05-02T10:00:00.000Z',
    lastSessionResult: sharedResult,
    wordProgress: {
      ...visibleSharedStorage.wordProgress,
      [sharedWordId]: {
        seen: true,
        completedCount: 1,
        incorrectAttempts: 0,
        revealedCount: 0,
        difficult: false,
        lastPractisedAt: '2026-05-02T10:00:00.000Z'
      }
    }
  },
  sharedContext
);
assertEqual(restoredSharedStorage.selectedListIds[0], 'foundations_numbers', 'Shared completion should restore the previous selected list.');
assertEqual(restoredSharedStorage.currentPathPosition, 'foundations_numbers', 'Shared completion should restore the previous path position.');
assertEqual(restoredSharedStorage.lastSessionDate, mainStorage.lastSessionDate, 'Shared completion should not become the main Continue learning anchor.');
assertEqual(restoredSharedStorage.lastSessionResult, previousResult, 'Shared completion should restore the previous main session result.');
assert(restoredSharedStorage.wordProgress[sharedWordId]?.seen, 'Shared sessions should still keep word progress updates.');

const manualStorage = applyManualWordListSelection(createDefaultStorage(), [firstVerbs.id]);
assertEqual(manualStorage.selectedListIds[0], firstVerbs.id, 'Existing manual Done selection should still select the chosen list.');
assertEqual(manualStorage.currentPathPosition, firstVerbs.id, 'Existing manual Done selection should still update path position.');

const adminLists = [
  { id: 'one', slug: 'first-verbs-core-actions', isActive: true },
  { id: 'two', slug: 'draft-duplicate', isActive: false }
];
assertEqual(
  validateAdminWordListSlug('first-verbs-core-actions', adminLists, 'one'),
  '',
  'The current list should be allowed to keep its slug.'
);
assert(
  validateAdminWordListSlug('First Verbs', adminLists, 'one').length > 0,
  'Admin slug validation should reject spaces and uppercase letters.'
);
assert(
  validateAdminWordListSlug('first-verbs-core-actions', adminLists, 'two').length > 0,
  'Admin slug validation should reject active duplicate slugs.'
);
assertEqual(
  createAdminWordListSlug('First Verbs — Core Actions', adminLists),
  'first-verbs-core-actions-2',
  'Admin slug creation should avoid active duplicates.'
);

console.log('word-list sharing tests passed');
