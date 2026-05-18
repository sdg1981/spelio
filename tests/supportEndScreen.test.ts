import { getEndScreenProgressSummary } from '../src/lib/practice/endScreenState';

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

assertEqual(
  getEndScreenProgressSummary('Total progress: 10 spellings learned', null),
  'Total progress: 10 spellings learned',
  'Normal end screens should keep the total progress summary.'
);

assertEqual(
  getEndScreenProgressSummary('Total progress: 10 spellings learned', {
    listId: 'support_accents',
    returnTo: '/spelling-basics/accents'
  }),
  null,
  'Detached support end screens should hide total progress summaries.'
);

assertEqual(
  getEndScreenProgressSummary(null, {
    listId: 'support_ff',
    returnTo: '/spelling-basics/ff'
  }),
  null,
  'Detached support end screens should tolerate already-empty summaries.'
);

console.log('support end screen tests passed');
