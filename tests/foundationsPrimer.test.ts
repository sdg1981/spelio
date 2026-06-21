import { getFoundationsPrimer, getPrimerAudioText, hasFoundationsPrimer } from '../src/content/foundationsPrimer';
import { getCollectionIntro, getCollectionIntroAudioGenerationText, hasSeenCollectionIntro, markCollectionIntroSeen, normalizeCollectionIntroContent, WELSH_FOUNDATIONS_COLLECTION_ID } from '../src/content/collectionIntro';
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

const welshYPrimerFromDraft = getFoundationsPrimer('foundation_patterns_y', 'cy');
assert(welshYPrimerFromDraft, 'Welsh interface should resolve Y primer from bundled primerDrafts when DB content is absent.');
assertEqual(welshYPrimerFromDraft.title, 'Y llythyren Y', 'Welsh fallback primer should use primerDrafts.primerTitleCy.');
assertEqual(welshYPrimerFromDraft.soundItems[0].label, 'Y (sillaf olaf)', 'Welsh primer sound labels should prefer labelCy from primerDrafts.');

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
const databaseDddPrimerCy = getFoundationsPrimer({
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
      label: 'DD English',
      labelCy: 'DD Cymraeg',
      textToSpeak: 'hedd',
      audioUrl: 'https://example.test/dd.mp3',
      audioStatus: 'ready',
      audioSource: 'manual',
      order: 1
    }, {
      id: 'd_admin',
      key: 'd_admin',
      label: 'D fallback',
      labelCy: '',
      textToSpeak: 'da',
      audioUrl: '',
      audioStatus: 'missing',
      audioSource: 'unknown',
      order: 2
    }]
  }
}, 'cy');
assert(databaseDddPrimerCy, 'Welsh database primer content should resolve for a list object.');
assertEqual(databaseDddPrimerCy.title, 'Admin D/DD CY', 'Learner primer should prefer DB titleCy for the Welsh interface.');
assertEqual(databaseDddPrimerCy.body, 'Corff admin.', 'Learner primer should prefer DB bodyCy for the Welsh interface.');
assertEqual(databaseDddPrimerCy.soundItems[0].label, 'DD Cymraeg', 'Welsh database primer sound labels should prefer DB labelCy.');
assertEqual(databaseDddPrimerCy.soundItems[1].label, 'D fallback', 'Welsh database primer sound labels should fall back to English labels when labelCy is empty.');
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

const foundationsIntroContent = normalizeCollectionIntroContent(undefined, WELSH_FOUNDATIONS_COLLECTION_ID);
assertEqual(foundationsIntroContent.enabled, true, 'Foundations collection should have a default enabled introduction.');
assertEqual(foundationsIntroContent.titleEn, 'Welsh Spelling Foundations', 'Foundations collection intro should carry the approved English title.');
assertEqual(foundationsIntroContent.titleCy, '', 'Foundations collection intro Welsh title should remain empty until reviewed.');
const foundationsIntro = getCollectionIntro({ id: WELSH_FOUNDATIONS_COLLECTION_ID, introContent: foundationsIntroContent }, 'en');
assert(foundationsIntro, 'Enabled Foundations collection intro should resolve for learners.');
assert(
  foundationsIntro.body.includes('Welsh spelling can look unfamiliar at first'),
  'Foundations collection intro should include the approved English body.'
);
assert(
  foundationsIntro.body.includes('memorise words and rules'),
  'Foundations collection intro should include the approved updated English body copy.'
);
assertEqual(foundationsIntro.displayLanguage, 'en', 'English interface should display English intro content.');
assertEqual(getCollectionIntro({ id: WELSH_FOUNDATIONS_COLLECTION_ID, introContent: { ...foundationsIntroContent, enabled: false } }, 'en'), null, 'Disabled collection intro should not resolve.');

const bilingualCollectionIntro = {
  ...foundationsIntroContent,
  titleCy: 'Sylfeini Sillafu Cymraeg',
  bodyCy: 'Corff cyflwyniad Cymraeg.',
  audioUrlEn: 'https://example.test/collection-intro-en.mp3',
  audioStatusEn: 'ready' as const,
  audioSourceEn: 'manual' as const,
  audioUrlCy: 'https://example.test/collection-intro-cy.mp3',
  audioStatusCy: 'ready' as const,
  audioSourceCy: 'manual' as const
};
const welshCollectionIntro = getCollectionIntro({ id: WELSH_FOUNDATIONS_COLLECTION_ID, introContent: bilingualCollectionIntro }, 'cy');
assert(welshCollectionIntro, 'Welsh interface should resolve collection intro content.');
assertEqual(welshCollectionIntro.displayLanguage, 'cy', 'Welsh interface should display Welsh intro content when reviewed Welsh copy exists.');
assertEqual(welshCollectionIntro.title, 'Sylfeini Sillafu Cymraeg', 'Welsh interface should use Welsh intro title when present.');
assertEqual(welshCollectionIntro.body, 'Corff cyflwyniad Cymraeg.', 'Welsh interface should use Welsh intro body when present.');
assertEqual(welshCollectionIntro.audioUrl, 'https://example.test/collection-intro-cy.mp3', 'Welsh interface should use Welsh intro audio when available.');
assertEqual(
  getCollectionIntroAudioGenerationText(bilingualCollectionIntro, 'en'),
  foundationsIntroContent.bodyEn,
  'English collection intro audio generation should use body text only, without the visible title.'
);
assertEqual(
  getCollectionIntroAudioGenerationText(bilingualCollectionIntro, 'cy'),
  'Corff cyflwyniad Cymraeg.',
  'Welsh collection intro audio generation should use body text only, without the visible title.'
);

const welshTextWithoutWelshAudioIntro = getCollectionIntro({
  id: WELSH_FOUNDATIONS_COLLECTION_ID,
  introContent: {
    ...bilingualCollectionIntro,
    audioUrlCy: '',
    audioStatusCy: 'missing',
    audioSourceCy: 'unknown'
  }
}, 'cy');
assert(welshTextWithoutWelshAudioIntro, 'Welsh text intro should still resolve without Welsh audio.');
assertEqual(welshTextWithoutWelshAudioIntro.displayLanguage, 'cy', 'Welsh text should remain selected when Welsh audio is missing.');
assertEqual(welshTextWithoutWelshAudioIntro.audioUrl, undefined, 'Welsh interface should not play English audio while showing Welsh intro text.');

const welshFallbackIntro = getCollectionIntro({
  id: WELSH_FOUNDATIONS_COLLECTION_ID,
  introContent: {
    ...bilingualCollectionIntro,
    titleCy: '',
    bodyCy: '',
    audioUrlCy: '',
    audioStatusCy: 'missing',
    audioSourceCy: 'unknown'
  }
}, 'cy');
assert(welshFallbackIntro, 'Welsh interface should fall back safely when Welsh intro copy is missing.');
assertEqual(welshFallbackIntro.displayLanguage, 'en', 'Missing Welsh intro copy should fall back to English display content.');
assertEqual(welshFallbackIntro.audioUrl, 'https://example.test/collection-intro-en.mp3', 'English audio may be used when the displayed intro copy falls back to English.');

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

class MockSpeechSynthesisUtterance {
  lang = '';
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  rate = 1;

  constructor(public text: string) {}
}

async function runPrimerAudioTests() {
  const originalAudio = globalThis.Audio;
  const originalFetch = globalThis.fetch;
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const originalSpeechSynthesis = Object.getOwnPropertyDescriptor(globalThis, 'speechSynthesis');
  const originalSpeechSynthesisUtterance = Object.getOwnPropertyDescriptor(globalThis, 'SpeechSynthesisUtterance');
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
    const localStorageValues = new Map<string, string>();
    const mockLocalStorage = {
      getItem: (key: string) => localStorageValues.get(key) ?? null,
      setItem: (key: string, value: string) => {
        localStorageValues.set(key, value);
      }
    };
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: mockLocalStorage
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { localStorage: mockLocalStorage }
    });

    assert(foundationsIntro, 'Foundations intro should be available for local seen-state tests.');
    assert(!hasSeenCollectionIntro(foundationsIntro), 'Collection intro should initially be unseen in local storage.');
    markCollectionIntroSeen(foundationsIntro);
    assert(hasSeenCollectionIntro(foundationsIntro), 'Collection intro should store seen state locally.');

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
    assertEqual(getStoredPrimerAudioUrl({ audioUrl: storedItem.audioUrl, audioStatus: 'missing' }), null, 'Primer audio should not use a stored URL unless its status is ready.');

    const regeneratedItem = {
      ...storedItem,
      audioUrl: 'https://example.test/storage/v1/object/public/audio/cy-primer/foundations-first-words/dd-sound/20260529T121500Z.mp3'
    };
    await playPrimerSound(regeneratedItem);
    assertEqual(MockAudio.instances.length, 2, 'A regenerated primer audio URL should get a fresh cached audio element.');

    clearPrimerAudioCacheForTests();
    MockAudio.instances = [];
    fetchCalls = 0;
    const fallbackItem = { textToSpeak: 'lle', audioStatus: 'missing' };
    preloadPrimerSounds([fallbackItem, fallbackItem]);
    const firstFallbackPlayback = await playPrimerSound(fallbackItem);
    const secondFallbackPlayback = await playPrimerSound(fallbackItem);
    assert(firstFallbackPlayback && secondFallbackPlayback, 'Primer audio should fall back to Azure TTS when no stored URL exists.');
    assertEqual(fetchCalls, 1, 'Azure TTS fallback should be preloaded once and reused across clicks for a missing stored URL.');
    assertEqual(MockAudio.instances.length, 1, 'Generated primer audio fallback should reuse one cached audio element across clicks.');
    assertEqual(MockAudio.instances[0].loadCalls, 1, 'Generated primer audio fallback should be loaded during preload.');
    assertEqual(MockAudio.instances[0].playCalls, 2, 'Generated primer audio fallback should replay the cached element on each click.');

    clearPrimerAudioCacheForTests();
    MockAudio.instances = [];
    fetchCalls = 0;
    const spokenItems: Array<{ text: string; lang: string; rate: number }> = [];
    const mockSpeechSynthesis = {
      cancelCalls: 0,
      cancel() {
        this.cancelCalls += 1;
      },
      speak(utterance: MockSpeechSynthesisUtterance) {
        spokenItems.push({ text: utterance.text, lang: utterance.lang, rate: utterance.rate });
        setTimeout(() => utterance.onend?.(), 0);
      }
    };
    Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: MockSpeechSynthesisUtterance
    });
    Object.defineProperty(globalThis, 'speechSynthesis', {
      configurable: true,
      value: mockSpeechSynthesis
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { localStorage: mockLocalStorage, speechSynthesis: mockSpeechSynthesis }
    });

    const speechFallbackPlayback = await playPrimerSound({ textToSpeak: 'gwen', audioStatus: 'missing' });
    assert(speechFallbackPlayback, 'Missing primer audio should use direct speech synthesis when available.');
    assertEqual(fetchCalls, 0, 'Speech synthesis primer fallback should not wait for Azure TTS generation.');
    assertEqual(MockAudio.instances.length, 0, 'Speech synthesis primer fallback should not create a generated blob audio element.');
    assertEqual(spokenItems.length, 1, 'Speech synthesis primer fallback should speak once per click.');
    assertEqual(spokenItems[0].text, 'gwen', 'Speech synthesis primer fallback should preserve the primer text.');
    assertEqual(spokenItems[0].lang, 'cy-GB', 'Speech synthesis primer fallback should request a Welsh voice.');
  } finally {
    clearPrimerAudioCacheForTests();
    (globalThis as unknown as { Audio: typeof Audio }).Audio = originalAudio;
    (globalThis as unknown as { fetch: typeof fetch }).fetch = originalFetch;
    if (originalLocalStorage) Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
    else delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else delete (globalThis as unknown as { window?: unknown }).window;
    if (originalSpeechSynthesis) Object.defineProperty(globalThis, 'speechSynthesis', originalSpeechSynthesis);
    else delete (globalThis as unknown as { speechSynthesis?: unknown }).speechSynthesis;
    if (originalSpeechSynthesisUtterance) Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', originalSpeechSynthesisUtterance);
    else delete (globalThis as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance;
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
  }
}

void runPrimerAudioTests().catch(error => {
  setTimeout(() => {
    throw error;
  }, 0);
});
