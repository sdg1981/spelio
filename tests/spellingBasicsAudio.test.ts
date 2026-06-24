import type { PracticeWord, WordList } from '../src/data/wordLists';
import { createSupportWordLists } from '../src/data/supportWordLists';
import { getSpellingBasicsTopic, getSpellingBasicsTopicSlugFromPath, spellingBasicsCategories, spellingBasicsTopics } from '../src/content/spellingBasics';
import { createSupportPracticeRoute, handleSpellingBasicsExampleAudioClick, resolveSpellingBasicsExampleAudio } from '../src/lib/spellingBasicsAudio';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function makeWord(overrides: Partial<PracticeWord>): PracticeWord {
  const id = overrides.id ?? 'word-1';
  const listId = overrides.listId ?? 'list-1';
  const welshAnswer = overrides.welshAnswer ?? 'dydd';
  const englishPrompt = overrides.englishPrompt ?? 'day';

  return {
    id,
    listId,
    prompt: englishPrompt,
    answer: welshAnswer,
    englishPrompt,
    welshAnswer,
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    acceptedAlternatives: [],
    audioUrl: '',
    audioStatus: 'missing',
    notes: '',
    order: 1,
    difficulty: 1,
    dialect: 'Both',
    dialectNote: '',
    usageNote: '',
    variantGroupId: '',
    ...overrides
  };
}

function makeList(overrides: Partial<WordList> & { words: PracticeWord[] }): WordList {
  return {
    id: overrides.id ?? 'list-1',
    collectionId: overrides.collectionId ?? 'test',
    name: overrides.name ?? 'Test list',
    description: '',
    language: 'Welsh',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    dialect: 'Both',
    stage: 'Test',
    difficulty: 1,
    order: 1,
    nextListId: null,
    isActive: true,
    ...overrides
  };
}

const supportList = makeList({
  id: 'support_ff',
  collectionId: 'spelio_support_welsh',
  name: 'Support FF',
  isSupportList: true,
  listType: 'support',
  hiddenFromMainCatalogue: true,
  words: [
    makeWord({
      id: 'support_ff_006',
      listId: 'support_ff',
      welshAnswer: 'ffrwyth',
      englishPrompt: 'fruit',
      audioUrl: '',
      audioStatus: 'missing'
    })
  ]
});
const normalList = makeList({
  id: 'normal_food',
  words: [
    makeWord({
      id: 'normal_food_001',
      listId: 'normal_food',
      welshAnswer: 'ffrwyth',
      englishPrompt: 'fruit',
      audioUrl: 'https://example.com/audio/ffrwyth.mp3',
      audioStatus: 'ready'
    })
  ]
});

assertEqual(
  createSupportPracticeRoute('support_ff', '/spelling-basics/ff'),
  '/practice?supportListId=support_ff&returnTo=%2Fspelling-basics%2Fff',
  'Practise this pattern should have a stable support-practice route target.'
);
assertEqual(getSpellingBasicsTopicSlugFromPath('/spelling-basics/w'), 'w', 'W as a vowel should have a spelling basics route.');
assertEqual(getSpellingBasicsTopicSlugFromPath('/spelling-basics/y'), 'y', 'Y as a vowel should have a spelling basics route.');
assertEqual(getSpellingBasicsTopicSlugFromPath('/spelling-basics/wy'), 'w', 'The old wy route should resolve to the W topic for compatibility.');
const soundCategory = spellingBasicsCategories.find(category => category.id === 'sounds');
assert(soundCategory, 'Spelling basics should have a Welsh sounds category.');
assertEqual(soundCategory.topicSlugs.includes('w'), true, 'Overview should include a separate w tile.');
assertEqual(soundCategory.topicSlugs.includes('y'), true, 'Overview should include a separate y tile.');
assertEqual(soundCategory.topicSlugs.includes('wy' as never), false, 'Overview should not show the retired combined wy tile.');
assertEqual(getSpellingBasicsTopic('w')?.practiceListId, 'support_w', 'W topic should launch support_w practice.');
assertEqual(getSpellingBasicsTopic('y')?.practiceListId, 'support_y', 'Y topic should launch support_y practice.');
const phoneticTopic = getSpellingBasicsTopic('phonetic');
assert(phoneticTopic?.kind === 'single' && phoneticTopic.phoneticOrientation, 'Phonetic topic should expose sound anchors.');
const phoneticYSound = phoneticTopic.phoneticOrientation.sounds.find(sound => sound.symbol === 'y');
assertEqual(phoneticYSound?.example, 'tŷ', 'Phonetic y sound should keep tŷ as the example word.');
assertEqual(phoneticYSound?.hint.en, '“ee” in the English word see', 'Phonetic y sound should explicitly label the English anchor word.');
assertEqual(phoneticYSound?.hint.cy, '“ee” yn y gair Saesneg see', 'Phonetic y sound should keep the softened Welsh sound anchor text in data.');
const phoneticOSound = phoneticTopic.phoneticOrientation.sounds.find(sound => sound.symbol === 'o');
assertEqual(phoneticOSound?.hint.en, '“o” in the English word hot', 'Phonetic sound anchors should explicitly label English reference words.');

const accentsTopic = spellingBasicsTopics.find(topic => topic.slug === 'accents');
assert(accentsTopic && accentsTopic.kind === 'series', 'Accents topic should be a series topic.');
const accentsCards = accentsTopic.cards;
assertEqual(accentsCards.length, 2, 'Accents topic should have exactly two cards.');
const accentsIntroCard = accentsCards[0];
const accentsLongVowelCard = accentsCards[1];
assert(accentsIntroCard && accentsIntroCard.title, 'Accents card 1 should have a title.');
assert(accentsLongVowelCard && accentsLongVowelCard.title, 'Accents card 2 should have a title.');
assertEqual(accentsIntroCard.title.en, 'Small marks that change words', 'Accents card 1 should introduce accents concretely.');
assertEqual(accentsIntroCard.examples?.[0]?.welsh, 'tan', 'Accents card 1 should compare tan first.');
assertEqual(accentsIntroCard.examples?.[1]?.welsh, 'tân', 'Accents card 1 should compare tân second.');
assertEqual(accentsLongVowelCard.title.en, 'Accented vowels', 'Accents card 2 title should align with its broader accented-vowel body.');
assertEqual(accentsLongVowelCard.title.cy, 'Llafariaid ag acen', 'Accents card 2 Welsh title should align with its broader accented-vowel body.');
assert(
  accentsIntroCard.body.some(copy => copy.en.includes('the â is held a little longer')),
  'Accents card 1 should tell learners what to listen for in tân.'
);
assert(
  accentsLongVowelCard.body.some(copy => copy.en.includes('â, ê, î, ô, û, ŵ, and ŷ')),
  'Accents card 2 should include the useful accented-vowel list.'
);
assert(
  !accentsCards.some(card => card.title?.en === 'Hear the difference'),
  'Accents topic should not include the removed third comparison card.'
);
assert(
  !accentsIntroCard.body.some(copy => copy.en.includes('â, ê') || copy.en.includes('correct spelling')),
  'Accents card 1 should not include the old abstract vowel list or spelling-copy line.'
);
const rhTopic = getSpellingBasicsTopic('rh');
assert(rhTopic?.kind === 'single', 'RH topic should be a single spelling-basics topic.');
assertEqual(rhTopic.card.examples?.some(example => example.welsh === 'rhiain'), false, 'RH examples should not include obscure rhiain.');
assertEqual(rhTopic.card.examples?.some(example => example.welsh === 'rhaid'), true, 'RH examples should use the more useful rhaid example.');
const ffTopic = getSpellingBasicsTopic('ff');
assert(ffTopic?.kind === 'single', 'FF topic should be a single spelling-basics topic.');
assertEqual(ffTopic.card.examples?.map(example => example.welsh).join('|'), 'coffi|ffrind', 'FF examples should not include ffordd.');
const ddTopic = getSpellingBasicsTopic('dd');
assert(ddTopic?.kind === 'single', 'DD topic should be a single spelling-basics topic.');
assertEqual(ddTopic.card.examples?.map(example => example.welsh).join('|'), 'bardd|meddal', 'DD examples should use the current public page examples.');
assertEqual(ddTopic.card.examples?.map(example => example.meaning?.en).join('|'), 'poet|soft', 'DD example meanings should match the current public page examples.');
const yTopic = getSpellingBasicsTopic('y');
assert(yTopic?.kind === 'single', 'Y topic should be a single spelling-basics topic.');
assertEqual(yTopic.card.observation?.title.en, 'Helpful pattern to notice:', 'Y topic should include a lightweight observation heading.');
assertEqual(yTopic.card.observation?.body.map(copy => copy.en).join('|'), 'Y near the end of short words often sounds more like “ee”.|Earlier in longer words it is often softer.', 'Y topic observation should give a practical non-technical clue.');
assertEqual(yTopic.card.observation?.title.cy, 'Patrwm defnyddiol i sylwi arno:', 'Y topic should include the Welsh observation heading.');
assertEqual(yTopic.card.observation?.body.map(copy => copy.cy).join('|'), 'Mae y ger diwedd geiriau byr yn aml yn swnio’n fwy fel “ee”.|Mewn geiriau hirach, mae’n aml yn swnio’n feddalach.', 'Y topic observation should include the Welsh wording.');
assertEqual(yTopic.card.examples?.map(example => example.welsh).join('|'), 'tŷ|dydd|mynydd|llyfr', 'Y topic examples should remain unchanged.');
assertEqual(spellingBasicsTopics.filter(topic => topic.kind === 'single' && topic.card.observation).map(topic => topic.slug).join('|'), 'y', 'Only the Y page should gain the new observation block.');

const supportResolution = resolveSpellingBasicsExampleAudio('ffrwyth', [normalList, supportList], 'support_ff');
assertEqual(supportResolution.word?.id, 'support_ff_006', 'Support topic examples should resolve through the support-list word first.');
assertEqual(supportResolution.available, false, 'Missing support-list audio should be treated as unavailable even if a normal list has a matching word.');
assertEqual(supportResolution.audioStatus, 'missing', 'Missing support-list audio should preserve the support word audio status.');

const readyResolution = resolveSpellingBasicsExampleAudio('ffrwyth', [normalList], null);
assertEqual(readyResolution.word?.id, 'normal_food_001', 'Non-support example lookup may use available public word-list audio.');
assertEqual(readyResolution.available, true, 'Ready public word-list audio should be playable.');

const supportExampleLists = createSupportWordLists();
const nestedExampleWords = ['afal', 'hen', 'ti', 'bore', 'tan'];
for (const welsh of nestedExampleWords) {
  const resolution = resolveSpellingBasicsExampleAudio(welsh, supportExampleLists);
  assert(resolution.word, `${welsh} should resolve to hidden support example audio data.`);
  assertEqual(resolution.word.listId, 'support_spelling_basics_examples', `${welsh} should resolve through the spelling-basics examples support list.`);
  assertEqual(resolution.audioStatus, 'missing', `${welsh} should be discoverable as missing support audio until generated.`);
}

const readySupportExamples = makeList({
  id: 'support_spelling_basics_examples',
  collectionId: 'spelio_support_welsh',
  isSupportList: true,
  listType: 'support',
  hiddenFromMainCatalogue: true,
  words: [
    makeWord({
      id: 'support_spelling_basics_examples_001',
      listId: 'support_spelling_basics_examples',
      welshAnswer: 'afal',
      englishPrompt: 'apple',
      audioUrl: 'https://example.com/audio/support/afal.mp3',
      audioStatus: 'ready'
    }),
    makeWord({
      id: 'foundation_patterns_d_dd_006',
      listId: 'foundation_patterns_d_dd',
      welshAnswer: 'bardd',
      englishPrompt: 'poet',
      audioUrl: 'https://example.com/audio/foundations/bardd.mp3',
      audioStatus: 'ready',
      order: 6
    }),
    makeWord({
      id: 'foundation_patterns_d_dd_008',
      listId: 'foundation_patterns_d_dd',
      welshAnswer: 'meddal',
      englishPrompt: 'soft',
      audioUrl: 'https://example.com/audio/foundations/meddal.mp3',
      audioStatus: 'ready',
      order: 8
    })
  ]
});
assertEqual(
  resolveSpellingBasicsExampleAudio('afal', [readySupportExamples]).audioUrl,
  'https://example.com/audio/support/afal.mp3',
  'Phonetic sound examples should play support example audio once generated.'
);
assertEqual(
  resolveSpellingBasicsExampleAudio('bardd', [readySupportExamples], 'support_dd').audioUrl,
  'https://example.com/audio/foundations/bardd.mp3',
  'DD page examples should reuse existing generated word audio when support-list audio is not present.'
);
assertEqual(
  resolveSpellingBasicsExampleAudio('meddal', [readySupportExamples], 'support_dd').audioUrl,
  'https://example.com/audio/foundations/meddal.mp3',
  'DD page examples should reuse existing generated word audio when support-list audio is not present.'
);

void runAsyncAssertions();

async function runAsyncAssertions() {
  let prevented = false;
  let stopped = false;
  let playedUrl = '';
  const played = await handleSpellingBasicsExampleAudioClick(
    {
      preventDefault: () => {
        prevented = true;
      },
      stopPropagation: () => {
        stopped = true;
      }
    },
    readyResolution,
    {
      play: async audioUrl => {
        playedUrl = audioUrl ?? '';
        return true;
      }
    }
  );
  assertEqual(played, true, 'Example audio click should report successful playback when audio exists.');
  assertEqual(playedUrl, 'https://example.com/audio/ffrwyth.mp3', 'Example audio click should call the playback handler with the resolved URL.');
  assertEqual(prevented, true, 'Example audio click should prevent parent navigation defaults.');
  assertEqual(stopped, true, 'Example audio click should stop parent practise-link propagation.');

  let unavailableHandled = false;
  let missingPlayCalled = false;
  const missingPlayed = await handleSpellingBasicsExampleAudioClick(
    {},
    supportResolution,
    {
      play: async () => {
        missingPlayCalled = true;
        return true;
      },
      onUnavailable: () => {
        unavailableHandled = true;
      }
    }
  );
  assertEqual(missingPlayed, false, 'Missing example audio should not attempt playback.');
  assertEqual(missingPlayCalled, false, 'Missing example audio should not call the playback handler.');
  assertEqual(unavailableHandled, true, 'Missing example audio should run the unavailable handler.');

  console.log('spelling basics audio tests passed');
}
