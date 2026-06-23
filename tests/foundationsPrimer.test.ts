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
assertEqual(getPrimerAudioText('RH'), 'rhad', 'RH primer audio override should use the clearer rhad exemplar.');

const rhPrimer = getFoundationsPrimer('foundation_patterns_rh', 'en');
assert(rhPrimer, 'RH Foundations list should resolve a primer.');
assertEqual(rhPrimer.soundItems.length, 1, 'RH primer should keep one sound button.');
assertEqual(rhPrimer.soundItems[0].label, 'RH', 'RH primer sound button should keep its label.');
assertEqual(rhPrimer.soundItems[0].audioText, 'rhad', 'RH primer sound button should use rhad for generated audio.');
assertEqual(rhPrimer.soundItems[0].audioUrl, undefined, 'RH primer audio should be reset until rhad audio is generated.');
assertEqual(rhPrimer.soundItems[0].audioStatus, 'missing', 'RH primer audio should be marked missing until regenerated.');
assertEqual(getPrimerAudioText('WY'), 'mwyn', 'WY primer audio override should use the clearer mwyn exemplar.');

const wyPrimer = getFoundationsPrimer('foundation_patterns_wy', 'en');
assert(wyPrimer, 'WY Foundations list should resolve a primer.');
assertEqual(wyPrimer.soundItems.length, 1, 'WY primer should keep one sound button.');
assertEqual(wyPrimer.soundItems[0].label, 'WY', 'WY primer sound button should keep its label.');
assertEqual(wyPrimer.soundItems[0].audioText, 'mwyn', 'WY primer sound button should use mwyn for generated audio.');
assertEqual(wyPrimer.soundItems[0].audioUrl, undefined, 'WY primer audio should be reset until mwyn audio is generated.');
assertEqual(wyPrimer.soundItems[0].audioStatus, 'missing', 'WY primer audio should be marked missing until regenerated.');

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
assertEqual(
  mixedPrimer.body,
  'This review brings together the D / DD, Y, F / FF, and W patterns you’ve just practised.',
  'Mixed Confidence 1 English primer should stay pattern-focused.'
);
assertEqual(mixedPrimer.soundItems.length, 0, 'Primer without sound buttons should expose an empty sound item list.');
const mixedPrimerCy = getFoundationsPrimer('foundation_patterns_mixed_confidence_1', 'cy');
assert(mixedPrimerCy, 'Mixed Confidence 1 should resolve a Welsh primer body.');
assertEqual(
  mixedPrimerCy.body,
  "Mae'r adolygiad hwn yn dod â'r patrymau D / DD, Y, F / FF a W rydych chi newydd eu hymarfer ynghyd.",
  'Mixed Confidence 1 Welsh primer should stay pattern-focused.'
);
const mixedConfidence2Primer = getFoundationsPrimer('foundation_patterns_mixed_confidence_2_revised', 'en');
assert(mixedConfidence2Primer, 'Mixed Confidence 2 should resolve a primer body.');
assertEqual(
  mixedConfidence2Primer.body,
  'This review brings together the CH, LL, RH, and AE / AI patterns you’ve just practised.',
  'Mixed Confidence 2 English primer should stay pattern-focused.'
);
const mixedConfidence2PrimerCy = getFoundationsPrimer('foundation_patterns_mixed_confidence_2_revised', 'cy');
assert(mixedConfidence2PrimerCy, 'Mixed Confidence 2 should resolve a Welsh primer body.');
assertEqual(
  mixedConfidence2PrimerCy.body,
  "Mae'r adolygiad hwn yn dod â'r patrymau CH, LL, RH ac AE / AI rydych chi newydd eu hymarfer ynghyd.",
  'Mixed Confidence 2 Welsh primer should stay pattern-focused.'
);

assert(hasFoundationsPrimer('foundation_patterns_y'), 'Known Foundations list should report primer availability.');
assertEqual(getFoundationsPrimer('foundations_first_words', 'en'), null, 'Lists without primerDrafts should not show a primer.');

const foundationsIntroTitleEn = 'Welcome to Welsh Spelling Foundations.';
const foundationsIntroTitleCy = 'Croeso i Sylfeini Sillafu Cymraeg.';
const foundationsIntroBodyEn = [
  'Welsh spelling follows patterns.',
  "Over the next few short exercises, you'll begin to recognise some of the sounds and spelling patterns that appear throughout Welsh.",
  'Becoming familiar with these patterns can make Welsh spelling feel much more predictable.'
].join('\n\n');
const foundationsIntroBodyCy = [
  'Mae sillafu Cymraeg yn dilyn patrymau.',
  "Dros yr ymarferion byr hyn, byddwch yn dechrau adnabod rhai o'r seiniau a'r patrymau sillafu sy'n ymddangos drwy'r Gymraeg.",
  "Gall dod yn gyfarwydd â'r patrymau hyn wneud i sillafu Cymraeg deimlo'n llawer mwy rhagweladwy."
].join('\n\n');

const foundationsIntroContent = normalizeCollectionIntroContent(undefined, WELSH_FOUNDATIONS_COLLECTION_ID);
assertEqual(foundationsIntroContent.enabled, true, 'Foundations collection should have a default enabled introduction.');
assertEqual(foundationsIntroContent.titleEn, foundationsIntroTitleEn, 'Foundations collection intro should carry the approved English title.');
assertEqual(foundationsIntroContent.titleCy, foundationsIntroTitleCy, 'Foundations collection intro should carry the approved Welsh title.');
assertEqual(foundationsIntroContent.bodyEn, foundationsIntroBodyEn, 'Foundations collection intro should carry the shortened English body.');
assertEqual(foundationsIntroContent.bodyCy, foundationsIntroBodyCy, 'Foundations collection intro should carry the approved Welsh body.');
assertEqual(foundationsIntroContent.version, '2026-06-23', 'Foundations collection intro should use a fresh seen-state version.');
assertEqual(foundationsIntroContent.audioStatusEn, 'missing', 'Shortened English intro should not keep stale generated audio.');
assertEqual(foundationsIntroContent.audioStatusCy, 'missing', 'Welsh intro should not keep stale generated audio.');
const foundationsIntro = getCollectionIntro({ id: WELSH_FOUNDATIONS_COLLECTION_ID, introContent: foundationsIntroContent }, 'en');
assert(foundationsIntro, 'Enabled Foundations collection intro should resolve for learners.');
assertEqual(foundationsIntro.title, foundationsIntroTitleEn, 'English interface should display the shortened English intro title.');
assertEqual(foundationsIntro.body, foundationsIntroBodyEn, 'English interface should display the shortened English intro body.');
assertEqual(foundationsIntro.displayLanguage, 'en', 'English interface should display English intro content.');
assertEqual(getCollectionIntro({ id: WELSH_FOUNDATIONS_COLLECTION_ID, introContent: { ...foundationsIntroContent, enabled: false } }, 'en'), null, 'Disabled collection intro should not resolve.');

const defaultWelshCollectionIntro = getCollectionIntro({ id: WELSH_FOUNDATIONS_COLLECTION_ID, introContent: foundationsIntroContent }, 'cy');
assert(defaultWelshCollectionIntro, 'Welsh interface should resolve the default collection intro content.');
assertEqual(defaultWelshCollectionIntro.displayLanguage, 'cy', 'Welsh interface should display Welsh intro content by default.');
assertEqual(defaultWelshCollectionIntro.title, foundationsIntroTitleCy, 'Welsh interface should display the Welsh intro title.');
assertEqual(defaultWelshCollectionIntro.body, foundationsIntroBodyCy, 'Welsh interface should display the Welsh intro body.');

const bilingualCollectionIntro = {
  ...foundationsIntroContent,
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
assertEqual(welshCollectionIntro.title, foundationsIntroTitleCy, 'Welsh interface should use Welsh intro title when present.');
assertEqual(welshCollectionIntro.body, foundationsIntroBodyCy, 'Welsh interface should use Welsh intro body when present.');
assertEqual(welshCollectionIntro.audioUrl, 'https://example.test/collection-intro-cy.mp3', 'Welsh interface should use Welsh intro audio when available.');
assertEqual(
  getCollectionIntroAudioGenerationText(bilingualCollectionIntro, 'en'),
  `${foundationsIntroTitleEn}\n\n${foundationsIntroBodyEn}`,
  'English collection intro audio generation should match the displayed introduction copy.'
);
assertEqual(
  getCollectionIntroAudioGenerationText(bilingualCollectionIntro, 'cy'),
  `${foundationsIntroTitleCy}\n\n${foundationsIntroBodyCy}`,
  'Welsh collection intro audio generation should match the displayed introduction copy.'
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

async function runPrimerAudioTests() {
  const originalAudio = globalThis.Audio;
  const originalFetch = globalThis.fetch;
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  let fetchCalls = 0;
  const fetchBodies: unknown[] = [];
  let objectUrlCounter = 0;

  (globalThis as unknown as { Audio: typeof MockAudio }).Audio = MockAudio;
  (globalThis as unknown as { fetch: typeof fetch }).fetch = async (_input, init) => {
    fetchCalls += 1;
    fetchBodies.push(JSON.parse(String(init?.body ?? '{}')));
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
    assertEqual(fetchBodies.length, 1, 'Primer Azure fallback should send exactly one generation request.');
    assert(
      typeof fetchBodies[0] === 'object' &&
        fetchBodies[0] !== null &&
        (fetchBodies[0] as { text?: unknown }).text === 'lle' &&
        (fetchBodies[0] as { language?: unknown }).language === 'cy',
      'Primer Azure fallback should request Welsh generation for the primer text.'
    );
    assertEqual(MockAudio.instances.length, 1, 'Generated primer audio fallback should reuse one cached audio element across clicks.');
    assertEqual(MockAudio.instances[0].loadCalls, 1, 'Generated primer audio fallback should be loaded during preload.');
    assertEqual(MockAudio.instances[0].playCalls, 2, 'Generated primer audio fallback should replay the cached element on each click.');
  } finally {
    clearPrimerAudioCacheForTests();
    (globalThis as unknown as { Audio: typeof Audio }).Audio = originalAudio;
    (globalThis as unknown as { fetch: typeof fetch }).fetch = originalFetch;
    if (originalLocalStorage) Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
    else delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else delete (globalThis as unknown as { window?: unknown }).window;
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
  }
}

void runPrimerAudioTests().catch(error => {
  setTimeout(() => {
    throw error;
  }, 0);
});
