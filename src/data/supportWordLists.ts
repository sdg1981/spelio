import type { PracticeWord, WordList, WordListCollection } from './wordLists';

export type WordListType = 'main' | 'support';

export const SUPPORT_WORD_LIST_COLLECTION_ID = 'spelio_support_welsh';

export const supportWordListCollection: WordListCollection = {
  id: SUPPORT_WORD_LIST_COLLECTION_ID,
  slug: 'spelio-support-welsh',
  name: 'Spelio Support Welsh',
  nameCy: 'Cymorth Cymraeg Spelio',
  description: 'Built-in contextual support lists for focused practice.',
  descriptionCy: 'Rhestrau cymorth cyd-destunol mewnol ar gyfer ymarfer ffocysedig.',
  type: 'spelio_core',
  sourceLanguage: 'en',
  targetLanguage: 'cy',
  curriculumKeyStage: null,
  curriculumArea: null,
  ownerType: 'spelio',
  ownerId: null,
  order: 99,
  isActive: true
};

type SupportWordSeed = {
  englishPrompt: string;
  welshAnswer: string;
  acceptedAlternatives?: string[];
  audioUrl?: string;
  audioStatus?: PracticeWord['audioStatus'];
  elevenLabsAudioUrl?: string;
  elevenLabsAudioStatus?: PracticeWord['elevenLabsAudioStatus'];
  elevenLabsGenerationMode?: PracticeWord['elevenLabsGenerationMode'];
  preferredElevenLabsGenerationMode?: PracticeWord['preferredElevenLabsGenerationMode'];
  elevenLabsPronunciationHint?: string;
  elevenLabsPronunciationHintUsed?: boolean;
  elevenLabsPronunciationHintText?: string;
  elevenLabsContextPhrase?: string;
  elevenLabsExtractMode?: PracticeWord['elevenLabsExtractMode'];
  elevenLabsExtractChunkCount?: PracticeWord['elevenLabsExtractChunkCount'];
  elevenLabsExtractStartOffsetMs?: PracticeWord['elevenLabsExtractStartOffsetMs'];
  elevenLabsExtractionUsed?: boolean;
  elevenLabsContextPhraseUsed?: string;
  elevenLabsGeneratedAt?: string;
  elevenLabsModel?: string;
  elevenLabsVoiceId?: string;
  elevenLabsLanguageOverride?: string;
  elevenLabsPrompt?: string;
  audioReviewStatus?: PracticeWord['audioReviewStatus'];
  difficulty?: number;
  dialect?: PracticeWord['dialect'];
  dialectNote?: string;
  usageNote?: string;
  variantGroupId?: string;
};

type SupportListSeed = {
  id: string;
  name: string;
  nameCy: string;
  description: string;
  descriptionCy: string;
  focus: string;
  words: SupportWordSeed[];
};

const supportListSeeds: SupportListSeed[] = [
  {
    id: 'support_ff',
    name: 'Support: ff pattern',
    nameCy: 'Cymorth: patrwm ff',
    description: 'Focused support practice for Welsh ff.',
    descriptionCy: 'Ymarfer cymorth ffocysedig ar gyfer ff Cymraeg.',
    focus: 'Welsh spelling basics',
    words: [
      { englishPrompt: 'road', welshAnswer: 'ffordd' },
      { englishPrompt: 'coffee', welshAnswer: 'coffi' },
      { englishPrompt: 'friend', welshAnswer: 'ffrind' },
      { englishPrompt: 'phone', welshAnswer: 'ffôn' },
      { englishPrompt: 'farm', welshAnswer: 'fferm' },
      { englishPrompt: 'fruit', welshAnswer: 'ffrwyth' }
    ]
  },
  {
    id: 'support_dd',
    name: 'Support: dd pattern',
    nameCy: 'Cymorth: patrwm dd',
    description: 'Focused support practice for Welsh dd.',
    descriptionCy: 'Ymarfer cymorth ffocysedig ar gyfer dd Cymraeg.',
    focus: 'Welsh spelling basics',
    words: [
      { englishPrompt: 'day', welshAnswer: 'dydd' },
      { englishPrompt: 'today', welshAnswer: 'heddiw' },
      { englishPrompt: 'mountain', welshAnswer: 'mynydd' },
      { englishPrompt: 'end', welshAnswer: 'diwedd' },
      { englishPrompt: 'new', welshAnswer: 'newydd' },
      { englishPrompt: 'will be', welshAnswer: 'bydd' }
    ]
  },
  {
    id: 'support_ll',
    name: 'Support: ll pattern',
    nameCy: 'Cymorth: patrwm ll',
    description: 'Focused support practice for Welsh ll.',
    descriptionCy: 'Ymarfer cymorth ffocysedig ar gyfer ll Cymraeg.',
    focus: 'Welsh spelling basics',
    words: [
      { englishPrompt: 'place', welshAnswer: 'lle' },
      { englishPrompt: 'hand', welshAnswer: 'llaw' },
      { englishPrompt: 'book', welshAnswer: 'llyfr' },
      { englishPrompt: 'milk', welshAnswer: 'llaeth' },
      { englishPrompt: 'out', welshAnswer: 'allan' },
      { englishPrompt: 'can / able to', welshAnswer: 'gallu' }
    ]
  },
  {
    id: 'support_ch',
    name: 'Support: ch pattern',
    nameCy: 'Cymorth: patrwm ch',
    description: 'Focused support practice for Welsh ch.',
    descriptionCy: 'Ymarfer cymorth ffocysedig ar gyfer ch Cymraeg.',
    focus: 'Welsh spelling basics',
    words: [
      { englishPrompt: 'small', welshAnswer: 'bach' },
      { englishPrompt: 'six', welshAnswer: 'chwech' },
      { englishPrompt: 'health', welshAnswer: 'iechyd' },
      { englishPrompt: 'high', welshAnswer: 'uchel' },
      { englishPrompt: 'to play', welshAnswer: 'chwarae' },
      { englishPrompt: 'to begin', welshAnswer: 'dechrau' }
    ]
  },
  {
    id: 'support_rh',
    name: 'Support: rh pattern',
    nameCy: 'Cymorth: patrwm rh',
    description: 'Focused support practice for Welsh rh.',
    descriptionCy: 'Ymarfer cymorth ffocysedig ar gyfer rh Cymraeg.',
    focus: 'Welsh spelling basics',
    words: [
      { englishPrompt: 'free', welshAnswer: 'rhydd' },
      { englishPrompt: 'some / kind', welshAnswer: 'rhyw' },
      { englishPrompt: 'must', welshAnswer: 'rhaid' },
      { englishPrompt: 'must', welshAnswer: 'rhaid' },
      { englishPrompt: 'between', welshAnswer: 'rhwng' },
      { englishPrompt: 'to run', welshAnswer: 'rhedeg' }
    ]
  },
  {
    id: 'support_w',
    name: 'Support: w as a vowel',
    nameCy: 'Cymorth: w fel llafariad',
    description: 'Focused support practice for Welsh w as a vowel.',
    descriptionCy: 'Ymarfer cymorth ffocysedig ar gyfer w fel llafariad Gymraeg.',
    focus: 'Welsh spelling basics',
    words: [
      { englishPrompt: 'water', welshAnswer: 'dŵr' },
      { englishPrompt: 'valley', welshAnswer: 'cwm' },
      { englishPrompt: 'living', welshAnswer: 'byw' },
      { englishPrompt: 'table', welshAnswer: 'bwrdd' },
      { englishPrompt: 'tower', welshAnswer: 'twr' },
      { englishPrompt: 'meet', welshAnswer: 'cwrdd' },
      { englishPrompt: 'sound', welshAnswer: 'sŵn' },
      { englishPrompt: 'smoke', welshAnswer: 'mwg' },
      { englishPrompt: 'man / husband', welshAnswer: 'gŵr' },
      { englishPrompt: 'luck', welshAnswer: 'lwc' }
    ]
  },
  {
    id: 'support_y',
    name: 'Support: y as a vowel',
    nameCy: 'Cymorth: y fel llafariad',
    description: 'Focused support practice for Welsh y as a vowel.',
    descriptionCy: 'Ymarfer cymorth ffocysedig ar gyfer y fel llafariad Gymraeg.',
    focus: 'Welsh spelling basics',
    words: [
      { englishPrompt: 'house', welshAnswer: 'tŷ' },
      { englishPrompt: 'day', welshAnswer: 'dydd' },
      { englishPrompt: 'world', welshAnswer: 'byd' },
      { englishPrompt: 'mountain', welshAnswer: 'mynydd' },
      { englishPrompt: 'book', welshAnswer: 'llyfr' },
      { englishPrompt: 'school', welshAnswer: 'ysgol' },
      { englishPrompt: 'drink', welshAnswer: 'yfed' },
      { englishPrompt: 'island', welshAnswer: 'ynys' },
      { englishPrompt: 'fish', welshAnswer: 'pysgod' },
      { englishPrompt: 'weather', welshAnswer: 'tywydd' }
    ]
  },
  {
    id: 'support_accents',
    name: 'Support: accents and long vowels',
    nameCy: 'Cymorth: acenion a llafariaid hir',
    description: 'Focused support practice for Welsh accents and long vowels.',
    descriptionCy: 'Ymarfer cymorth ffocysedig ar gyfer acenion a llafariaid hir Cymraeg.',
    focus: 'Welsh spelling basics',
    words: [
      { englishPrompt: 'water', welshAnswer: 'dŵr' },
      { englishPrompt: 'house', welshAnswer: 'tŷ' },
      { englishPrompt: 'corn / grain', welshAnswer: 'ŷd' },
      { englishPrompt: 'fire', welshAnswer: 'tân' },
      { englishPrompt: 'sound', welshAnswer: 'sŵn' },
      { englishPrompt: 'song', welshAnswer: 'cân' }
    ]
  },
  {
    id: 'support_spelling_basics_examples',
    name: 'Support: spelling basics examples',
    nameCy: 'Cymorth: enghreifftiau hanfodion sillafu',
    description: 'Hidden support audio list for Welsh Spelling Basics explanatory examples.',
    descriptionCy: 'Rhestr sain gymorth gudd ar gyfer enghreifftiau esboniadol Hanfodion Sillafu Cymraeg.',
    focus: 'Welsh spelling basics',
    words: [
      { englishPrompt: 'apple', welshAnswer: 'afal' },
      { englishPrompt: 'old', welshAnswer: 'hen' },
      { englishPrompt: 'you', welshAnswer: 'ti' },
      { englishPrompt: 'morning', welshAnswer: 'bore' },
      { englishPrompt: 'school', welshAnswer: 'ysgol' },
      { englishPrompt: 'until', welshAnswer: 'tan' }
    ]
  }
];

function createSupportWord(seed: SupportWordSeed, listId: string, order: number): PracticeWord {
  return {
    id: `${listId}_${String(order).padStart(3, '0')}`,
    listId,
    prompt: seed.englishPrompt,
    answer: seed.welshAnswer,
    englishPrompt: seed.englishPrompt,
    welshAnswer: seed.welshAnswer,
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    acceptedAlternatives: seed.acceptedAlternatives ?? [],
    audioUrl: seed.audioUrl ?? '',
    audioStatus: seed.audioStatus ?? 'missing',
    elevenLabsAudioUrl: seed.elevenLabsAudioUrl ?? '',
    elevenLabsAudioStatus: seed.elevenLabsAudioStatus ?? 'missing',
    elevenLabsGenerationMode: seed.elevenLabsGenerationMode ?? 'direct',
    preferredElevenLabsGenerationMode: seed.preferredElevenLabsGenerationMode ?? 'direct',
    elevenLabsPronunciationHint: seed.elevenLabsPronunciationHint ?? '',
    elevenLabsPronunciationHintUsed: seed.elevenLabsPronunciationHintUsed ?? false,
    elevenLabsPronunciationHintText: seed.elevenLabsPronunciationHintText ?? '',
    elevenLabsContextPhrase: seed.elevenLabsContextPhrase ?? '',
    elevenLabsExtractMode: seed.elevenLabsExtractMode ?? 'none',
    elevenLabsExtractChunkCount: seed.elevenLabsExtractChunkCount ?? 1,
    elevenLabsExtractStartOffsetMs: seed.elevenLabsExtractStartOffsetMs ?? 80,
    elevenLabsExtractionUsed: seed.elevenLabsExtractionUsed ?? false,
    elevenLabsContextPhraseUsed: seed.elevenLabsContextPhraseUsed ?? '',
    elevenLabsGeneratedAt: seed.elevenLabsGeneratedAt ?? '',
    elevenLabsModel: seed.elevenLabsModel ?? '',
    elevenLabsVoiceId: seed.elevenLabsVoiceId ?? '',
    elevenLabsLanguageOverride: seed.elevenLabsLanguageOverride ?? '',
    elevenLabsPrompt: seed.elevenLabsPrompt ?? '',
    audioReviewStatus: seed.audioReviewStatus ?? 'unchecked',
    notes: '',
    order,
    difficulty: seed.difficulty ?? 1,
    dialect: seed.dialect ?? 'Both',
    dialectNote: seed.dialectNote ?? '',
    usageNote: seed.usageNote ?? '',
    spellingHintId: '',
    disablePatternHints: false,
    variantGroupId: seed.variantGroupId ?? ''
  };
}

export function isSupportWordList(list: Pick<WordList, 'id' | 'collectionId' | 'isSupportList' | 'listType' | 'hiddenFromMainCatalogue'>) {
  return list.isSupportList === true ||
    list.listType === 'support' ||
    list.hiddenFromMainCatalogue === true ||
    list.collectionId === SUPPORT_WORD_LIST_COLLECTION_ID ||
    list.id.startsWith('support_');
}

export function mainWordLists(lists: WordList[]) {
  return lists.filter(list => !isSupportWordList(list) && !list.hiddenFromMainCatalogue);
}

export function supportWordLists(lists: WordList[]) {
  return lists.filter(isSupportWordList);
}

export function findSupportWordList(lists: WordList[], listId?: string | null) {
  if (!listId) return undefined;
  return lists.find(list => list.id === listId && list.isActive && isSupportWordList(list));
}

export function createSupportWordLists(): WordList[] {
  return supportListSeeds.map((seed, index) => ({
    id: seed.id,
    slug: seed.id.replace(/_/g, '-'),
    collectionId: SUPPORT_WORD_LIST_COLLECTION_ID,
    collection: supportWordListCollection,
    name: seed.name,
    nameCy: seed.nameCy,
    description: seed.description,
    descriptionCy: seed.descriptionCy,
    language: 'Welsh',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    dialect: 'Both',
    stage: 'Support',
    focus: seed.focus,
    difficulty: 1,
    order: 10_000 + index,
    nextListId: null,
    isActive: true,
    isSupportList: true,
    listType: 'support',
    hiddenFromMainCatalogue: true,
    words: seed.words.map((word, wordIndex) => (
      createSupportWord(word, seed.id, wordIndex + 1)
    ))
  }));
}

export function withSupportWordLists(lists: WordList[]) {
  const existingIds = new Set(lists.map(list => list.id));
  const missingSupportLists = createSupportWordLists().filter(list => !existingIds.has(list.id));
  return [...lists, ...missingSupportLists].sort((a, b) => a.order - b.order);
}
