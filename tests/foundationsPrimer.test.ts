import foundationsExport from '../data-exports/spelio_welsh_foundations_content.json';
import { getFoundationsPrimer, getPrimerAudioText, hasFoundationsPrimer } from '../src/content/foundationsPrimer';
import { getCollectionIntro, getCollectionIntroAudioGenerationText, hasSeenCollectionIntro, markCollectionIntroSeen, normalizeCollectionIntroContent, WELSH_FOUNDATIONS_COLLECTION_ID } from '../src/content/collectionIntro';
import type { PracticeWord } from '../src/data/wordLists';
import { clearPrimerAudioCacheForTests, getStoredPrimerAudioUrl, playPrimerSound, preloadPrimerSounds, resolvePrimerSoundPracticeAudio, stopPrimerAudio } from '../src/lib/foundationsPrimerAudio';
import { shouldPreserveInterfaceLanguageScreen, shouldResetPracticeLaunchContextOnInterfaceLanguageChange } from '../src/lib/interfaceLanguageNavigation';

declare function require(name: string): {
  readFileSync?: (path: string, encoding: string) => string;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const documentShellSource = readFileSync('index.html', 'utf8');
const stylesSource = readFileSync('src/styles.css', 'utf8');
const practiceSessionSource = readFileSync('src/hooks/usePracticeSession.ts', 'utf8');
const primerAudioSource = readFileSync('src/lib/foundationsPrimerAudio.ts', 'utf8');

assert(documentShellSource.includes('viewport-fit=cover'), 'Document viewport should expose iOS safe-area insets.');
assert(
  stylesSource.includes('padding-top:calc(18px + env(safe-area-inset-top))'),
  'Mobile public pages should include the iOS top safe area in their header layout.'
);
assert(
  /\.how-back-button\{[\s\S]*?width:44px;[\s\S]*?height:44px;/.test(stylesSource),
  'Shared public-page back control should keep a reliable 44px touch target.'
);
assert(
  practiceSessionSource.includes('createAudioPlaybackController') && primerAudioSource.includes('createAudioPlaybackController'),
  'Practice sessions and Foundations samples should use the same playback controller.'
);

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
assertEqual(welshYPrimerFromDraft.soundItems.length, 2, 'Y primer should resolve both expected sound samples.');
assertEqual(welshYPrimerFromDraft.soundItems[0].textToSpeak, 'byd', 'Y final-syllable sample should resolve its expected Welsh audio text.');
assertEqual(welshYPrimerFromDraft.soundItems[1].textToSpeak, 'ysgol', 'Y earlier-syllable sample should resolve its expected Welsh audio text.');
const welshYSoundItems = welshYPrimerFromDraft.soundItems;
const exportedLists = (foundationsExport as unknown as { lists: Array<{ id: string; words: PracticeWord[] }> }).lists;
const orderedPracticeWords = (preferredListId: string) => [
  ...(exportedLists.find(list => list.id === preferredListId)?.words ?? []),
  ...exportedLists.filter(list => list.id !== preferredListId).flatMap(list => list.words)
];
const resolvedDddSoundItems = dDdPrimer.soundItems.map(item => resolvePrimerSoundPracticeAudio(item, orderedPracticeWords(dDdPrimer.listId), 'azure'));
const resolvedYSoundItems = welshYSoundItems.map(item => resolvePrimerSoundPracticeAudio(item, orderedPracticeWords(welshYPrimerFromDraft.listId), 'azure'));
assert(
  resolvedDddSoundItems[0].audioUrl?.endsWith('/foundation-patterns-d-dd-001.mp3'),
  'D sample should resolve the ready practice-session asset for da.'
);
assert(
  resolvedDddSoundItems[1].audioUrl?.endsWith('/foundation-patterns-d-dd-004.mp3'),
  'DD sample should resolve the ready practice-session asset for hedd.'
);
assert(
  resolvedYSoundItems[0].audioUrl?.endsWith('/foundation-patterns-y-001.mp3'),
  'Y final-syllable sample should resolve the ready practice-session asset for byd.'
);
assert(
  resolvedYSoundItems[1].audioUrl?.endsWith('/foundation-patterns-y-008.mp3'),
  'Y earlier-syllable sample should resolve the ready practice-session asset for ysgol.'
);
assert(
  [resolvedDddSoundItems, resolvedYSoundItems].flat().every(item => item.audioStatus === 'ready'),
  'D, DD, and Y samples should be promoted to ready only after a practice asset resolves.'
);
const unresolvedFoundationSamples = exportedLists.flatMap(list => {
  const primer = getFoundationsPrimer(list.id, 'en');
  if (!primer) return [];
  return primer.soundItems
    .map(item => resolvePrimerSoundPracticeAudio(item, orderedPracticeWords(list.id), 'azure'))
    .filter(item => !getStoredPrimerAudioUrl(item))
    .map(item => item.textToSpeak);
}).sort();
assertEqual(
  unresolvedFoundationSamples.join(','),
  'gwen,sinema',
  'Every Foundations sample with an existing ready practice asset should resolve through that path; only samples without a ready file should retain generated fallback.'
);

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
  'This review brings together the D / DD, Y, F / FF, W, and SI patterns you’ve just practised.',
  'Mixed Confidence 1 English primer should stay pattern-focused.'
);
assertEqual(mixedPrimer.soundItems.length, 0, 'Primer without sound buttons should expose an empty sound item list.');
const mixedPrimerCy = getFoundationsPrimer('foundation_patterns_mixed_confidence_1', 'cy');
assert(mixedPrimerCy, 'Mixed Confidence 1 should resolve a Welsh primer body.');
assertEqual(
  mixedPrimerCy.body,
  "Mae'r adolygiad hwn yn dod â'r patrymau D / DD, Y, F / FF, W a SI rydych chi newydd eu hymarfer ynghyd.",
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
const mixedConfidence3Primer = getFoundationsPrimer('foundation_patterns_mixed_confidence_3_revised', 'en');
assert(mixedConfidence3Primer, 'Mixed Confidence 3 should resolve a primer body.');
assertEqual(
  mixedConfidence3Primer.body,
  'This review brings together the WY, YW, OE, AU, and AW patterns you’ve just practised.',
  'Mixed Confidence 3 English primer should stay pattern-focused.'
);
const mixedConfidence3PrimerCy = getFoundationsPrimer('foundation_patterns_mixed_confidence_3_revised', 'cy');
assert(mixedConfidence3PrimerCy, 'Mixed Confidence 3 should resolve a Welsh primer body.');
assertEqual(
  mixedConfidence3PrimerCy.body,
  "Mae'r adolygiad hwn yn dod â'r patrymau WY, YW, OE, AU ac AW rydych chi newydd eu hymarfer ynghyd.",
  'Mixed Confidence 3 Welsh primer should stay pattern-focused.'
);
const mixedConfidence4Primer = getFoundationsPrimer('foundation_patterns_mixed_confidence_4_revised', 'en');
assert(mixedConfidence4Primer, 'Mixed Confidence 4 should resolve a primer body.');
assertEqual(
  mixedConfidence4Primer.body,
  'This review brings together the U, C, G, and TH vs DD patterns you’ve just practised.',
  'Mixed Confidence 4 English primer should stay pattern-focused.'
);
const mixedConfidence4PrimerCy = getFoundationsPrimer('foundation_patterns_mixed_confidence_4_revised', 'cy');
assert(mixedConfidence4PrimerCy, 'Mixed Confidence 4 should resolve a Welsh primer body.');
assertEqual(
  mixedConfidence4PrimerCy.body,
  "Mae'r adolygiad hwn yn dod â'r patrymau U, C, G a TH vs DD rydych chi newydd eu hymarfer ynghyd.",
  'Mixed Confidence 4 Welsh primer should stay pattern-focused.'
);
const mixedConfidence5Primer = getFoundationsPrimer('foundation_patterns_mixed_confidence_5', 'en');
assert(mixedConfidence5Primer, 'Mixed Confidence 5 should resolve a primer body.');
assertEqual(
  mixedConfidence5Primer.body,
  "This final review brings together many of the Welsh spelling patterns you've practised throughout Foundations.\n\nUse it as an opportunity to recognise those patterns working together in real words.",
  'Mixed Confidence 5 English primer should stay reflective and confidence-building.'
);
const mixedConfidence5PrimerCy = getFoundationsPrimer('foundation_patterns_mixed_confidence_5', 'cy');
assert(mixedConfidence5PrimerCy, 'Mixed Confidence 5 should resolve a Welsh primer body.');
assertEqual(
  mixedConfidence5PrimerCy.body,
  "Mae'r adolygiad olaf hwn yn dod â llawer o'r patrymau sillafu Cymraeg rydych wedi'u hymarfer drwy gydol Sylfeini ynghyd.\n\nDefnyddiwch ef fel cyfle i adnabod y patrymau hynny'n gweithio gyda'i gilydd mewn geiriau go iawn.",
  'Mixed Confidence 5 Welsh primer should stay reflective and confidence-building.'
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
  static playShouldReject = false;
  static playThrowsSynchronously = false;
  static userGestureActive = false;

  currentTime = 0;
  loadCalls = 0;
  onended: (() => void) | null = null;
  pauseCalls = 0;
  playCalls = 0;
  playCallsDuringUserGesture = 0;
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

  removeAttribute(name: string) {
    if (name === 'src') this.src = '';
  }

  play() {
    this.playCalls += 1;
    if (MockAudio.userGestureActive) this.playCallsDuringUserGesture += 1;
    if (MockAudio.playThrowsSynchronously) throw new Error('Synchronous playback failure');
    return MockAudio.playShouldReject ? Promise.reject(new Error('Playback rejected')) : Promise.resolve();
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
      value: { localStorage: mockLocalStorage, location: { origin: '' } }
    });

    assert(foundationsIntro, 'Foundations intro should be available for local seen-state tests.');
    assert(!hasSeenCollectionIntro(foundationsIntro), 'Collection intro should initially be unseen in local storage.');
    markCollectionIntroSeen(foundationsIntro);
    assert(hasSeenCollectionIntro(foundationsIntro), 'Collection intro should store seen state locally.');

    clearPrimerAudioCacheForTests();
    MockAudio.instances = [];
    fetchCalls = 0;
    await preloadPrimerSounds(welshYSoundItems);
    assertEqual(fetchCalls, 2, 'Y primer should prepare both expected generated audio samples.');

    MockAudio.userGestureActive = true;
    const yFinalPlayback = playPrimerSound(welshYSoundItems[0]);
    MockAudio.userGestureActive = false;
    assert(await yFinalPlayback, 'Y final-syllable sample should play from its direct tap path.');
    MockAudio.userGestureActive = true;
    const yEarlierPlayback = playPrimerSound(welshYSoundItems[1]);
    MockAudio.userGestureActive = false;
    assert(await yEarlierPlayback, 'Y earlier-syllable sample should play from its direct tap path.');
    assertEqual(
      MockAudio.instances.reduce((total, audio) => total + audio.playCallsDuringUserGesture, 0),
      2,
      'Both prepared Y samples should call play before yielding their user gestures.'
    );

    const storedItem = {
      audioUrl: 'https://example.test/storage/v1/object/public/audio/cy-primer/foundations-first-words/dd-sound/20260529T120000Z.mp3',
      textToSpeak: 'hedd'
    };

    clearPrimerAudioCacheForTests();
    MockAudio.instances = [];
    fetchCalls = 0;
    await preloadPrimerSounds([storedItem, storedItem]);
    assertEqual(MockAudio.instances.length, 0, 'Ready practice audio should not create a media element before the user taps.');

    MockAudio.userGestureActive = true;
    const firstStoredPlaybackPromise = playPrimerSound(storedItem);
    MockAudio.userGestureActive = false;
    const firstStoredPlayback = await firstStoredPlaybackPromise;
    const secondStoredPlayback = await playPrimerSound(storedItem);
    assert(firstStoredPlayback && secondStoredPlayback, 'Stored primer audio should play successfully through the practice playback controller.');
    assertEqual(fetchCalls, 0, 'Stored primer audio should not call the dynamic Azure fallback.');
    assertEqual(MockAudio.instances.length, 1, 'Repeated taps should reuse the current practice-style player for the same source.');
    assertEqual(MockAudio.instances[0].playCalls, 2, 'Stored primer audio should replay the cached element on each click.');
    assertEqual(MockAudio.instances[0].playCallsDuringUserGesture, 1, 'Ready sample playback should call play synchronously inside the user interaction.');
    assertEqual(MockAudio.instances[0].src, storedItem.audioUrl, 'Ready sample playback should keep the resolved practice URL unchanged.');

    const cacheBustedUrl = `${storedItem.audioUrl}?v=2026-05-29T12%3A00%3A00.000Z`;
    assertEqual(getStoredPrimerAudioUrl({ audioUrl: cacheBustedUrl }), cacheBustedUrl, 'Primer audio URL normalization should keep an existing stable cache-busting query intact.');
    assertEqual(getStoredPrimerAudioUrl({ audioUrl: storedItem.audioUrl }), storedItem.audioUrl, 'Primer audio URL normalization should not append new cache-busting parameters.');
    assertEqual(getStoredPrimerAudioUrl({ audioUrl: storedItem.audioUrl, audioStatus: 'missing' }), null, 'Primer audio should not use a stored URL unless its status is ready.');

    const regeneratedItem = {
      ...storedItem,
      audioUrl: 'https://example.test/storage/v1/object/public/audio/cy-primer/foundations-first-words/dd-sound/20260529T121500Z.mp3'
    };
    await playPrimerSound(regeneratedItem);
    assertEqual(MockAudio.instances.length, 2, 'A changed source URL should get a fresh practice-style player.');

    stopPrimerAudio();
    await playPrimerSound(regeneratedItem);
    assertEqual(MockAudio.instances.length, 3, 'Leaving and returning should create a fresh player instead of retaining stale screen state.');

    clearPrimerAudioCacheForTests();
    MockAudio.instances = [];
    fetchCalls = 0;
    fetchBodies.length = 0;
    const fallbackItem = { textToSpeak: 'lle', audioStatus: 'missing' };
    await preloadPrimerSounds([fallbackItem, fallbackItem]);
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
    assertEqual(MockAudio.instances.length, 1, 'Generated primer audio fallback should reuse one player across repeated clicks.');
    assertEqual(MockAudio.instances[0].loadCalls, 0, 'Generated fallback preparation should not pre-create or load the playback element.');
    assertEqual(MockAudio.instances[0].playCalls, 2, 'Generated primer audio fallback should replay the cached element on each click.');

    MockAudio.userGestureActive = true;
    const directGesturePlayback = playPrimerSound(fallbackItem);
    MockAudio.userGestureActive = false;
    assert(await directGesturePlayback, 'Prepared primer audio should play successfully from a direct user gesture.');
    assertEqual(MockAudio.instances[0].playCallsDuringUserGesture, 1, 'Prepared primer audio should call play before yielding the user gesture.');

    MockAudio.playShouldReject = true;
    const rejectedPlayback = await playPrimerSound(fallbackItem);
    MockAudio.playShouldReject = false;
    assertEqual(rejectedPlayback, false, 'Primer playback rejection should be caught and reported without an unhandled rejection.');

    MockAudio.playThrowsSynchronously = true;
    const synchronouslyRejectedPlayback = await playPrimerSound(fallbackItem);
    MockAudio.playThrowsSynchronously = false;
    assertEqual(synchronouslyRejectedPlayback, false, 'Synchronous media failures should also remain caught and non-blocking.');
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
