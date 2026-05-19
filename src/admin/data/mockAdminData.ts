import { wordLists } from '../../data/wordLists';
import { supportWordListCollection } from '../../data/supportWordLists';
import type { AdminDialect, AdminWord, AdminWordList, AdminWordListCollection, AudioReviewStatus, AudioStatus, ElevenLabsAudioStatus, ElevenLabsGenerationMode } from '../types';
import { DEFAULT_COLLECTION_ID } from '../types';

type RawWord = {
  id: string;
  englishPrompt: string;
  welshAnswer: string;
  acceptedAlternatives?: string[];
  audioUrl?: string;
  audioStatus?: AudioStatus;
  elevenLabsAudioUrl?: string;
  elevenLabsAudioStatus?: ElevenLabsAudioStatus;
  elevenLabsGenerationMode?: ElevenLabsGenerationMode;
  preferredElevenLabsGenerationMode?: ElevenLabsGenerationMode;
  elevenLabsPronunciationHint?: string;
  elevenLabsPronunciationHintUsed?: boolean;
  elevenLabsPronunciationHintText?: string;
  elevenLabsContextPhrase?: string;
  elevenLabsExtractMode?: AdminWord['elevenLabsExtractMode'];
  elevenLabsExtractionUsed?: boolean;
  elevenLabsContextPhraseUsed?: string;
  elevenLabsGeneratedAt?: string;
  elevenLabsModel?: string;
  elevenLabsVoiceId?: string;
  elevenLabsLanguageOverride?: string;
  elevenLabsPrompt?: string;
  audioReviewStatus?: AudioReviewStatus;
  notes?: string;
  order: number;
  difficulty?: number;
  dialect?: AdminWord['dialect'];
  dialectNote?: string;
  usageNote?: string;
  spellingHintId?: string;
  disablePatternHints?: boolean;
  variantGroupId?: string;
};

type RawList = {
  id: string;
  slug?: string;
  collectionId?: string;
  name: string;
  nameCy?: string;
  description: string;
  descriptionCy?: string;
  language: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  dialect: AdminDialect;
  stage: string;
  focus?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  order: number;
  nextListId?: string | null;
  isActive: boolean;
  isSupportList?: boolean;
  listType?: 'main' | 'support';
  hiddenFromMainCatalogue?: boolean;
  words: RawWord[];
};

const rawLists = wordLists as unknown as RawList[];
const baseCreatedAt = '2025-05-12';
const baseUpdatedAt = '2025-05-19';
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const adminWordListCollections: AdminWordListCollection[] = [
  {
    id: DEFAULT_COLLECTION_ID,
    slug: 'spelio-core-welsh',
    name: 'Spelio Core Welsh',
    description: 'Core Welsh spelling practice lists for the Spelio MVP.',
    type: 'spelio_core',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    curriculumKeyStage: null,
    curriculumArea: null,
    ownerType: 'spelio',
    ownerId: null,
    order: 1,
    isActive: true,
    createdAt: baseCreatedAt,
    updatedAt: baseUpdatedAt
  },
  {
    ...supportWordListCollection,
    curriculumKeyStage: supportWordListCollection.curriculumKeyStage ?? null,
    curriculumArea: supportWordListCollection.curriculumArea ?? null,
    ownerId: supportWordListCollection.ownerId ?? null,
    createdAt: baseCreatedAt,
    updatedAt: baseUpdatedAt
  }
];

const collectionNameById = new Map(adminWordListCollections.map(collection => [collection.id, collection.name]));

export const adminWordLists: AdminWordList[] = rawLists
  .map(list => ({
    id: list.id,
    slug: list.slug ?? slug(list.name),
    collectionId: list.collectionId ?? DEFAULT_COLLECTION_ID,
    collectionName: collectionNameById.get(list.collectionId ?? DEFAULT_COLLECTION_ID) ?? 'Spelio Core Welsh',
    name: list.name,
    nameCy: list.nameCy ?? '',
    description: list.description,
    descriptionCy: list.descriptionCy ?? '',
    language: list.language === 'cy' ? 'Welsh' : list.language,
    sourceLanguage: list.sourceLanguage ?? 'en',
    targetLanguage: list.targetLanguage ?? 'cy',
    dialect: list.dialect,
    stageId: slug(list.stage),
    stage: list.stage,
    focusCategoryId: slug(list.focus ?? 'General'),
    focus: list.focus ?? 'General',
    difficulty: list.difficulty,
    order: list.order,
    nextListId: list.nextListId ?? null,
    isActive: list.isActive,
    isSupportList: list.isSupportList === true || list.listType === 'support' || list.hiddenFromMainCatalogue === true,
    listType: list.listType ?? (list.isSupportList ? 'support' : 'main'),
    hiddenFromMainCatalogue: list.hiddenFromMainCatalogue === true || list.isSupportList === true || list.listType === 'support',
    createdAt: baseCreatedAt,
    updatedAt: baseUpdatedAt,
    words: [...list.words]
      .sort((a, b) => a.order - b.order)
      .map(word => ({
        id: word.id,
        listId: list.id,
        englishPrompt: word.englishPrompt,
        welshAnswer: word.welshAnswer,
        acceptedAlternatives: word.acceptedAlternatives ?? [],
        audioUrl: word.audioUrl ?? '',
        audioStatus: word.audioStatus ?? 'missing',
        elevenLabsAudioUrl: word.elevenLabsAudioUrl ?? '',
        elevenLabsAudioStatus: word.elevenLabsAudioStatus ?? 'missing',
        elevenLabsGenerationMode: word.elevenLabsGenerationMode ?? 'direct',
        preferredElevenLabsGenerationMode: word.preferredElevenLabsGenerationMode ?? 'direct',
        elevenLabsPronunciationHint: word.elevenLabsPronunciationHint ?? '',
        elevenLabsPronunciationHintUsed: word.elevenLabsPronunciationHintUsed ?? false,
        elevenLabsPronunciationHintText: word.elevenLabsPronunciationHintText ?? '',
        elevenLabsContextPhrase: word.elevenLabsContextPhrase ?? '',
        elevenLabsExtractMode: word.elevenLabsExtractMode ?? 'none',
        elevenLabsExtractionUsed: word.elevenLabsExtractionUsed ?? false,
        elevenLabsContextPhraseUsed: word.elevenLabsContextPhraseUsed ?? '',
        elevenLabsGeneratedAt: word.elevenLabsGeneratedAt ?? '',
        elevenLabsModel: word.elevenLabsModel ?? '',
        elevenLabsVoiceId: word.elevenLabsVoiceId ?? '',
        elevenLabsLanguageOverride: word.elevenLabsLanguageOverride ?? '',
        elevenLabsPrompt: word.elevenLabsPrompt ?? '',
        audioReviewStatus: word.audioReviewStatus ?? 'unchecked',
        notes: word.notes ?? '',
        order: word.order,
        difficulty: word.difficulty ?? list.difficulty,
        dialect: word.dialect ?? 'Both',
        dialectNote: word.dialectNote ?? '',
        usageNote: word.usageNote ?? '',
        spellingHintId: word.spellingHintId ?? '',
        disablePatternHints: word.disablePatternHints ?? false,
        variantGroupId: word.variantGroupId ?? '',
        createdAt: baseCreatedAt,
        updatedAt: baseUpdatedAt
      }))
  }))
  .sort((a, b) => a.order - b.order);

export const adminStages = Array.from(new Set(adminWordLists.map(list => list.stage))).map((name, index) => ({
  id: slug(name),
  name,
  order: index + 1,
  active: true
}));

export const adminFocusCategories = Array.from(new Set(adminWordLists.map(list => list.focus))).map((name, index) => ({
  id: slug(name),
  name,
  order: index + 1,
  active: true
}));

export const adminDialects: AdminDialect[] = ['Both', 'Mixed', 'North Wales', 'South Wales / Standard', 'Standard', 'Other'];

export function getAudioHealth(list: AdminWordList) {
  const total = list.words.length || 1;
  const missing = list.words.filter(word => word.audioStatus === 'missing').length;
  const failed = list.words.filter(word => word.audioStatus === 'failed').length;
  const generated = list.words.filter(word => word.audioStatus === 'ready').length;
  return { missing, failed, generated, percent: Math.round((generated / total) * 100) };
}
