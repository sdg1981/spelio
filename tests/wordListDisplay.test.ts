import { getWordListStageDisplayName } from '../src/lib/practice/wordListDisplay';

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
