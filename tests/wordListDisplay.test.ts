import { compareWordListCollectionsForDisplay, getCollectionDisplayName, getListDisplayDescription, getListDisplayName, getWelshFoundationsCollectionDisplayName, getWordListStageDisplayName } from '../src/lib/practice/wordListDisplay';

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
  'Common Patterns',
  'Welsh Spelling Foundations should override the foundations stage label for public display.'
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
