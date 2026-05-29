import { getFoundationsPrimer, getPrimerAudioText, hasFoundationsPrimer } from '../src/content/foundationsPrimer';
import { shouldPreserveInterfaceLanguageScreen, shouldResetPracticeLaunchContextOnInterfaceLanguageChange } from '../src/lib/interfaceLanguageNavigation';

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
assertEqual(dDdPrimer.soundItems[0].audioText, 'da', 'D sound button should use a Welsh exemplar instead of an English letter name.');
assertEqual(dDdPrimer.soundItems[1].label, 'DD', 'Second sound button should keep the DD label.');
assertEqual(dDdPrimer.soundItems[1].audioText, 'hedd', 'DD sound button should use a Welsh exemplar instead of speaking the letters.');
assertEqual(getPrimerAudioText('DD'), 'hedd', 'DD primer audio override should be stable.');
assertEqual(getPrimerAudioText('LL'), 'lle', 'LL primer audio override should use a Welsh exemplar.');

const databaseDddPrimer = getFoundationsPrimer({
  id: 'foundation_patterns_d_dd',
  primerContent: {
    enabled: true,
    titleEn: 'Admin D/DD',
    titleCy: 'Admin D/DD CY',
    bodyEn: 'Admin primer body.',
    bodyCy: 'Corff admin.',
    soundItems: [{
      id: 'dd_admin',
      key: 'dd_admin',
      label: 'DD',
      labelCy: 'DD',
      textToSpeak: 'hedd',
      audioUrl: 'https://example.test/dd.mp3',
      audioStatus: 'ready',
      audioSource: 'manual',
      order: 1
    }]
  }
}, 'en');
assert(databaseDddPrimer, 'Database primer content should resolve for a list object.');
assertEqual(databaseDddPrimer.title, 'Admin D/DD', 'Database primer content should take priority over JSON primerDrafts.');
assertEqual(databaseDddPrimer.soundItems[0].audioUrl, 'https://example.test/dd.mp3', 'Stored primer audio URL should be exposed before dynamic fallback.');
assertEqual(getFoundationsPrimer({
  id: 'foundation_patterns_d_dd',
  primerContent: {
    enabled: false,
    titleEn: 'Disabled admin primer',
    titleCy: '',
    bodyEn: 'This should suppress JSON fallback.',
    bodyCy: '',
    soundItems: []
  }
}, 'en'), null, 'Disabled database primer content should suppress JSON primerDraft fallback.');

const mixedPrimer = getFoundationsPrimer('foundation_patterns_mixed_confidence_1', 'en');
assert(mixedPrimer, 'Mixed Confidence list should resolve primer body even without sound buttons.');
assertEqual(mixedPrimer.soundItems.length, 0, 'Primer without sound buttons should expose an empty sound item list.');

assert(hasFoundationsPrimer('foundation_patterns_y'), 'Known Foundations list should report primer availability.');
assertEqual(getFoundationsPrimer('foundations_first_words', 'en'), null, 'Lists without primerDrafts should not show a primer.');

assert(
  shouldPreserveInterfaceLanguageScreen('primer', true, '/'),
  'Language switching from an active primer should preserve the primer screen even when the browser path is the homepage.'
);
assert(
  !shouldResetPracticeLaunchContextOnInterfaceLanguageChange('primer', true),
  'Language switching from an active primer should preserve the pending practice start.'
);
assert(
  shouldResetPracticeLaunchContextOnInterfaceLanguageChange('home', false),
  'Normal homepage language switching should keep resetting transient practice launch context.'
);
