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
  lists?: Array<{
    id: string;
    collectionId?: string;
    name: string;
    nameCy?: string;
    descriptionCy?: string;
    order?: number;
    nextListId?: string | null;
    primerContent?: {
      titleEn?: string;
      titleCy?: string;
      bodyEn?: string;
      bodyCy?: string;
      soundItems?: Array<{ label?: string; labelCy?: string; textToSpeak?: string; order?: number }>;
    };
    words?: Array<{ id: string; englishPrompt?: string; welshAnswer?: string; order?: number; usageNote?: string }>;
  }>;
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
  ['foundation_patterns_si', 'SI'],
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

const wList = foundationsLists.find(list => list.id === 'foundation_patterns_w');
const siList = foundationsLists.find(list => list.id === 'foundation_patterns_si');
const mixedConfidence1 = foundationsLists.find(list => list.id === 'foundation_patterns_mixed_confidence_1_revised');
assert(Boolean(wList), 'Foundations export should include the W list.');
assert(Boolean(siList), 'Foundations export should include the SI list.');
assert(Boolean(mixedConfidence1), 'Foundations export should include Mixed Confidence — Foundations 1.');
assertEqual(wList?.nextListId, 'foundation_patterns_si', 'W should progress to SI.');
assertEqual(siList?.nextListId, 'foundation_patterns_mixed_confidence_1_revised', 'SI should progress to Mixed Confidence — Foundations 1.');
assertEqual(wList?.order, 39, 'W should keep its existing order.');
assertEqual(siList?.order, 40, 'SI should be inserted immediately after W.');
assertEqual(mixedConfidence1?.order, 41, 'Mixed Confidence — Foundations 1 should move after SI.');
assertEqual(siList?.primerContent?.titleEn, 'SI', 'SI should include an English primer title.');
assertEqual(siList?.primerContent?.titleCy, 'SI', 'SI should include a Welsh primer title.');
assert(Boolean(siList?.primerContent?.bodyEn?.includes('**si** often sounds')), 'SI should include English primer body copy.');
assert(Boolean(siList?.primerContent?.bodyCy?.includes('Yn Gymraeg')), 'SI should include Welsh primer body copy.');
assertEqual(siList?.primerContent?.soundItems?.[0]?.label, 'SI (before a vowel)', 'SI should include the first English sound label.');
assertEqual(siList?.primerContent?.soundItems?.[0]?.labelCy, 'SI (cyn llafariad)', 'SI should include the first Welsh sound label.');
assertEqual(siList?.primerContent?.soundItems?.[0]?.textToSpeak, 'siop', 'SI first sound button should generate audio from siop.');
assertEqual(siList?.primerContent?.soundItems?.[1]?.label, 'SI (before a consonant)', 'SI should include the second English sound label.');
assertEqual(siList?.primerContent?.soundItems?.[1]?.labelCy, 'SI (cyn gytsain)', 'SI should include the second Welsh sound label.');
assertEqual(siList?.primerContent?.soundItems?.[1]?.textToSpeak, 'sinema', 'SI second sound button should generate audio from sinema.');
assertEqual(siList?.words?.length, 8, 'SI should include eight words.');
assertEqual(siList?.words?.[3]?.englishPrompt, 'shop', 'SI word ordering should keep shop fourth.');
assertEqual(siList?.words?.[3]?.welshAnswer, 'siop', 'SI shop answer should be siop.');
assertEqual(siList?.words?.[3]?.usageNote, 'Notice how **si** sounds before another vowel.', 'Only siop should carry the SI usage note.');
assertEqual(siList?.words?.filter(word => word.usageNote?.trim()).length, 1, 'SI should not add extra usage notes.');
assertEqual(mixedConfidence1?.words?.length, 10, 'Mixed Confidence — Foundations 1 should include ten words.');
assertEqual(mixedConfidence1?.words?.[8]?.englishPrompt, 'shop', 'Mixed Confidence — Foundations 1 should add shop ninth.');
assertEqual(mixedConfidence1?.words?.[8]?.welshAnswer, 'siop', 'Mixed Confidence — Foundations 1 should add siop ninth.');
assertEqual(mixedConfidence1?.words?.[9]?.englishPrompt, 'jacket', 'Mixed Confidence — Foundations 1 should add jacket tenth.');
assertEqual(mixedConfidence1?.words?.[9]?.welshAnswer, 'siaced', 'Mixed Confidence — Foundations 1 should add siaced tenth.');
