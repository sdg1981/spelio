import { getFoundationsPrimer, getPrimerAudioText, hasFoundationsPrimer } from '../src/content/foundationsPrimer';
import { clearPrimerAudioCacheForTests, getStoredPrimerAudioUrl, playPrimerSound, preloadPrimerSounds } from '../src/lib/foundationsPrimerAudio';
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

class MockAudio {
  static instances: MockAudio[] = [];

  currentTime = 0;
  loadCalls = 0;
  onended: (() => void) | null = null;
  pauseCalls = 0;
  playCalls = 0;
  preload = '';
  src = '';

  constructor() {
    MockAudio.instances.push(this);
  }

  load() {
    this.loadCalls += 1;
  }

  pause() {
    this.pauseCalls += 1;
  }

  play() {
    this.playCalls += 1;
    return Promise.resolve();
  }
}

async function runPrimerAudioTests() {
  const originalAudio = globalThis.Audio;
  const originalFetch = globalThis.fetch;
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  let fetchCalls = 0;
  let objectUrlCounter = 0;

  (globalThis as unknown as { Audio: typeof MockAudio }).Audio = MockAudio;
  (globalThis as unknown as { fetch: typeof fetch }).fetch = async () => {
    fetchCalls += 1;
    return new Response(new Blob(['mock audio'], { type: 'audio/mpeg' }), { status: 200 });
  };
  URL.createObjectURL = () => `blob:primer-audio-${objectUrlCounter += 1}`;
  URL.revokeObjectURL = () => undefined;

  try {
    const storedItem = {
      audioUrl: 'https://example.test/storage/v1/object/public/audio/cy-primer/foundations-first-words/dd-sound/20260529T120000Z.mp3',
      textToSpeak: 'hedd'
    };

    clearPrimerAudioCacheForTests();
    MockAudio.instances = [];
    fetchCalls = 0;
    preloadPrimerSounds([storedItem, storedItem]);
    assertEqual(MockAudio.instances.length, 1, 'Primer preload should create one cached audio element per stored URL.');
    assertEqual(MockAudio.instances[0].loadCalls, 1, 'Primer preload should only call load once for a stable stored URL.');
    assertEqual(MockAudio.instances[0].src, storedItem.audioUrl, 'Primer preload should use the stored URL without adding a click-time cache buster.');

    const firstStoredPlayback = await playPrimerSound(storedItem);
    const secondStoredPlayback = await playPrimerSound(storedItem);
    assert(firstStoredPlayback && secondStoredPlayback, 'Stored primer audio should play successfully from the cached audio element.');
    assertEqual(fetchCalls, 0, 'Stored primer audio should not call the dynamic Azure fallback.');
    assertEqual(MockAudio.instances.length, 1, 'Stored primer audio should reuse the cached audio element across clicks.');
    assertEqual(MockAudio.instances[0].playCalls, 2, 'Stored primer audio should replay the cached element on each click.');

    const cacheBustedUrl = `${storedItem.audioUrl}?v=2026-05-29T12%3A00%3A00.000Z`;
    assertEqual(getStoredPrimerAudioUrl({ audioUrl: cacheBustedUrl }), cacheBustedUrl, 'Primer audio URL normalization should keep an existing stable cache-busting query intact.');
    assertEqual(getStoredPrimerAudioUrl({ audioUrl: storedItem.audioUrl }), storedItem.audioUrl, 'Primer audio URL normalization should not append new cache-busting parameters.');

    const regeneratedItem = {
      ...storedItem,
      audioUrl: 'https://example.test/storage/v1/object/public/audio/cy-primer/foundations-first-words/dd-sound/20260529T121500Z.mp3'
    };
    await playPrimerSound(regeneratedItem);
    assertEqual(MockAudio.instances.length, 2, 'A regenerated primer audio URL should get a fresh cached audio element.');

    clearPrimerAudioCacheForTests();
    MockAudio.instances = [];
    fetchCalls = 0;
    const fallbackPlayback = await playPrimerSound({ textToSpeak: 'lle' });
    assert(fallbackPlayback, 'Primer audio should fall back to Azure TTS when no stored URL exists.');
    assertEqual(fetchCalls, 1, 'Azure TTS fallback should be called exactly once for a missing stored URL click.');
  } finally {
    clearPrimerAudioCacheForTests();
    (globalThis as unknown as { Audio: typeof Audio }).Audio = originalAudio;
    (globalThis as unknown as { fetch: typeof fetch }).fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
  }
}

void runPrimerAudioTests().catch(error => {
  setTimeout(() => {
    throw error;
  }, 0);
});
