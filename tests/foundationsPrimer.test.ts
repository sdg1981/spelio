import { getFoundationsPrimer, hasFoundationsPrimer } from '../src/content/foundationsPrimer';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

const dDdPrimer = getFoundationsPrimer('foundation_patterns_d_dd', 'en');
assert(dDdPrimer, 'D/DD Foundations list should resolve a primer.');
assertEqual(dDdPrimer.title, 'D and DD', 'Primer should use the exported title.');
assert(
  dDdPrimer.body.includes('DD sounds like the TH'),
  'Primer should preserve the exported body copy.'
);
assertEqual(dDdPrimer.soundItems.length, 2, 'Primer should normalize sound button labels.');
assertEqual(dDdPrimer.soundItems[0].label, 'D', 'First sound button should keep its label.');
assertEqual(dDdPrimer.soundItems[1].audioText, 'DD', 'String sound buttons should use their label as dynamic audio text.');

const mixedPrimer = getFoundationsPrimer('foundation_patterns_mixed_confidence_1', 'en');
assert(mixedPrimer, 'Mixed Confidence list should resolve primer body even without sound buttons.');
assertEqual(mixedPrimer.soundItems.length, 0, 'Primer without sound buttons should expose an empty sound item list.');

assert(hasFoundationsPrimer('foundation_patterns_y'), 'Known Foundations list should report primer availability.');
assertEqual(getFoundationsPrimer('foundations_first_words', 'en'), null, 'Lists without primerDrafts should not show a primer.');
