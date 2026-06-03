import foundationsExport from '../data-exports/spelio_welsh_foundations_content.json';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

const exportPayload = foundationsExport as {
  collections?: Array<{ id: string; nameCy?: string; descriptionCy?: string }>;
  lists?: Array<{ id: string; collectionId?: string; name: string; nameCy?: string; descriptionCy?: string }>;
};

const foundationsCollection = exportPayload.collections?.find(collection => collection.id === 'spelio_welsh_foundations');
assert(Boolean(foundationsCollection), 'Foundations export should include the Welsh Foundations collection.');
assertEqual(foundationsCollection?.nameCy, 'Sylfeini Sillafu Cymraeg', 'Foundations collection should include a Welsh display name.');
assert(Boolean(foundationsCollection?.descriptionCy?.trim()), 'Foundations collection should include a Welsh display description.');

const foundationsLists = (exportPayload.lists ?? []).filter(list => list.collectionId === 'spelio_welsh_foundations');
assert(foundationsLists.length > 0, 'Foundations export should include Foundations word lists.');
assert(
  foundationsLists.every(list => Boolean(list.nameCy?.trim()) && Boolean(list.descriptionCy?.trim())),
  'Every Foundations list should include Welsh display metadata.'
);

const unchangedPatternLabels = new Map([
  ['foundation_patterns_d_dd', 'D / DD'],
  ['foundation_patterns_y', 'Y'],
  ['foundation_patterns_f_ff', 'F / FF'],
  ['foundation_patterns_w', 'W'],
  ['foundation_patterns_ch', 'CH'],
  ['foundation_patterns_ll', 'LL'],
  ['foundation_patterns_rh', 'RH'],
  ['foundation_patterns_ae_ai', 'AE / AI']
]);

for (const [id, expectedName] of unchangedPatternLabels) {
  const list = foundationsLists.find(item => item.id === id);
  assert(Boolean(list), `Foundations export should include ${id}.`);
  assertEqual(list?.nameCy, expectedName, `${id} should keep its short pattern label unchanged.`);
}

assertEqual(
  foundationsLists.find(list => list.id === 'foundation_patterns_mixed_confidence_1_revised')?.nameCy,
  'Hyder Cymysg — Sylfeini 1',
  'Mixed Confidence list names should receive natural Welsh display names.'
);
