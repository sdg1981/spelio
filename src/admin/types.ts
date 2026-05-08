export type AudioStatus = 'missing' | 'queued' | 'generating' | 'ready' | 'failed';
export type AdminDialect = 'Both' | 'Mixed' | 'North Wales' | 'South Wales / Standard' | 'Standard' | 'Other';
export type AdminCollectionType = 'spelio_core' | 'curriculum' | 'course' | 'school' | 'teacher' | 'personal' | 'custom';
export type AdminCollectionOwnerType = 'spelio' | 'school' | 'teacher' | 'user' | null;

export const DEFAULT_COLLECTION_ID = 'spelio_core_welsh';

export interface AdminWordListCollection {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: AdminCollectionType;
  sourceLanguage: string;
  targetLanguage: string;
  curriculumKeyStage: string | null;
  curriculumArea: string | null;
  ownerType: AdminCollectionOwnerType;
  ownerId: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWord {
  id: string;
  listId: string;
  englishPrompt: string;
  welshAnswer: string;
  acceptedAlternatives: string[];
  audioUrl: string;
  audioStatus: AudioStatus;
  notes: string;
  order: number;
  difficulty: number;
  dialect: Exclude<AdminDialect, 'Mixed'>;
  dialectNote: string;
  usageNote: string;
  spellingHintId?: string;
  disablePatternHints?: boolean;
  variantGroupId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWordList {
  id: string;
  collectionId: string;
  collectionName: string;
  name: string;
  nameCy: string;
  description: string;
  descriptionCy: string;
  language: string;
  sourceLanguage: string;
  targetLanguage: string;
  dialect: AdminDialect;
  stageId: string;
  stage: string;
  focusCategoryId: string;
  focus: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  order: number;
  nextListId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  words: AdminWord[];
}

export interface AdminRoute {
  path: string;
  label: string;
}

export interface AdminStructureOption {
  id: string;
  name: string;
  order: number;
  active: boolean;
}

export interface ImportValidationResult {
  collections: number;
  defaultedCollections: number;
  totalLists: number;
  newLists: number;
  updatedLists: number;
  newWords: number;
  updatedWords: number;
  totalWords: number;
  duplicates: number;
  missingAudio: number;
  errors: string[];
  warnings: string[];
}

export interface ImportContentResult {
  success: boolean;
  collectionsUpserted: number;
  listsUpserted: number;
  wordsUpserted: number;
  errors: string[];
  warnings: string[];
}
