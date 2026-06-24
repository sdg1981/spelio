import { wordLists } from '../src/data/wordLists';
import { resolvePublicMetadata } from '../src/lib/publicMetadata';
import { getWordListPath } from '../src/lib/wordListSharing';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

const origin = 'https://spelio.app';

const home = resolvePublicMetadata({
  origin,
  pathname: '/',
  interfaceLanguage: 'en',
  wordLists
});
assertEqual(home.title, 'Spelio - Welsh spelling practice', 'Homepage should use the English product title.');
assertEqual(home.canonicalUrl, 'https://spelio.app/', 'Homepage should canonicalise to root.');
assertEqual(home.robots, 'index, follow', 'Homepage should be indexable.');

const welshHome = resolvePublicMetadata({
  origin,
  pathname: '/cy',
  interfaceLanguage: 'cy',
  wordLists
});
assertEqual(welshHome.title, 'Spelio - Ymarfer sillafu Cymraeg', 'Welsh homepage route should use Welsh metadata.');
assertEqual(welshHome.canonicalUrl, 'https://spelio.app/', '/cy should canonicalise to root for MVP.');
assertEqual(welshHome.robots, 'noindex, follow', '/cy should not be separately indexed for MVP.');

const spellingBasicsW = resolvePublicMetadata({
  origin,
  pathname: '/spelling-basics/w',
  interfaceLanguage: 'en',
  wordLists
});
assert(
  spellingBasicsW.description.includes('dŵr'),
  'Welsh spelling basics metadata should preserve Welsh characters and diacritics.'
);
assertEqual(spellingBasicsW.description.includes('byw'), false, 'W metadata should not mention removed W example byw.');
assertEqual(spellingBasicsW.description.includes('bwrdd'), false, 'W metadata should not mention removed W example bwrdd.');

const legacyWy = resolvePublicMetadata({
  origin,
  pathname: '/spelling-basics/wy',
  interfaceLanguage: 'en',
  wordLists
});
assertEqual(
  legacyWy.canonicalUrl,
  'https://spelio.app/spelling-basics/w',
  '/spelling-basics/wy should canonicalise to /spelling-basics/w.'
);

const firstList = wordLists.find(list => list.isActive && !list.hiddenFromMainCatalogue);
assert(firstList, 'Expected at least one active public word list.');

const sharedList = resolvePublicMetadata({
  origin,
  pathname: getWordListPath(firstList),
  interfaceLanguage: 'en',
  wordLists
});
assertEqual(sharedList.title, `${firstList.name} | Spelio`, 'Shared list title should use the resolved list name.');
assertEqual(sharedList.description, firstList.description, 'Shared list description should use the resolved list description.');
assertEqual(sharedList.canonicalUrl, `${origin}${getWordListPath(firstList)}`, 'Shared list should canonicalise to its list route.');

const practiceTest = resolvePublicMetadata({
  origin,
  pathname: getWordListPath(firstList),
  search: '?mode=practice-test',
  interfaceLanguage: 'en',
  wordLists
});
assertEqual(
  practiceTest.title,
  `${firstList.name} practice test - Spelio`,
  'Shared practice-test metadata should identify practice-test mode.'
);
assertEqual(
  practiceTest.canonicalUrl,
  `${origin}${getWordListPath(firstList)}`,
  'Practice-test mode should canonicalise to the main shared list for MVP.'
);
assertEqual(
  practiceTest.ogUrl,
  `${origin}${getWordListPath(firstList)}?mode=practice-test`,
  'Practice-test social URL should preserve the shared practice-test URL.'
);

const customList = resolvePublicMetadata({
  origin,
  pathname: '/custom/abcdefghijklmnop',
  interfaceLanguage: 'en',
  wordLists
});
assertEqual(customList.robots, 'noindex, follow', 'Custom list entry pages should be noindex.');
assertEqual(customList.title, 'Custom Welsh spelling list - Spelio', 'Custom list entry should have useful fallback share metadata.');

const supportPractice = resolvePublicMetadata({
  origin,
  pathname: '/practice',
  search: '?supportListId=support_w&returnTo=%2Fspelling-basics%2Fw',
  interfaceLanguage: 'en',
  screen: 'practice',
  wordLists
});
assertEqual(supportPractice.robots, 'noindex, follow', 'Practice screens should not be treated as indexable content.');

const unknown = resolvePublicMetadata({
  origin,
  pathname: '/not-a-real-route',
  interfaceLanguage: 'en',
  wordLists
});
assertEqual(unknown.title, 'Page not found - Spelio', 'Unknown public paths should use not-found metadata.');
assertEqual(unknown.robots, 'noindex, follow', 'Unknown public paths should be noindex while there is no 404 screen.');
assertEqual(
  unknown.canonicalUrl,
  'https://spelio.app/not-a-real-route',
  'Unknown public paths should not canonicalise to the homepage.'
);

const invalidTopic = resolvePublicMetadata({
  origin,
  pathname: '/spelling-basics/not-a-topic',
  interfaceLanguage: 'en',
  wordLists
});
assertEqual(invalidTopic.robots, 'noindex, follow', 'Invalid spelling basics topic routes should be noindex.');
assertEqual(
  invalidTopic.canonicalUrl,
  'https://spelio.app/spelling-basics/not-a-topic',
  'Invalid spelling basics topic routes should keep a deterministic non-homepage canonical.'
);
