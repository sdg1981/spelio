import dataset from './spelio_welsh_35_list_dataset_dialect_v1_1.json';

export type WelshSpellingMode = 'flexible' | 'strict';
export type Dialect = 'Both' | 'Mixed' | 'North Wales' | 'South Wales / Standard' | 'Standard' | 'Other';
export type DialectPreference = 'mixed' | 'north' | 'south_standard';
export type LanguageCode = 'en' | 'cy' | string;

export interface PracticeWord {
  id: string;
  listId: string;
  prompt: string;
  answer: string;
  englishPrompt: string;
  welshAnswer: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  acceptedAlternatives?: string[];
  audioUrl?: string;
  audioStatus?: 'missing' | 'generated' | 'failed';
  notes?: string;
  order: number;
  difficulty?: number;
  dialect: Exclude<Dialect, 'Mixed'>;
  dialectNote?: string;
  usageNote?: string;
  variantGroupId?: string;
}

export interface WordList {
  id: string;
  name: string;
  description: string;
  language: 'Welsh';
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  dialect: Dialect;
  stage: string;
  focus?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  order: number;
  nextListId?: string | null;
  isActive: boolean;
  words: PracticeWord[];
}

type DatasetWord = {
  id: string;
  prompt?: string;
  answer?: string;
  englishPrompt: string;
  welshAnswer: string;
  acceptedAlternatives?: string[];
  audioUrl?: string;
  audioStatus?: 'missing' | 'generated' | 'failed';
  notes?: string;
  order: number;
  difficulty?: number;
  dialect?: PracticeWord['dialect'];
  dialectNote?: string;
  usageNote?: string;
  variantGroupId?: string;
};

type DatasetList = {
  id: string;
  name: string;
  description: string;
  language: string;
  sourceLanguage?: LanguageCode;
  targetLanguage?: LanguageCode;
  dialect: Dialect;
  stage: string;
  focus?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  order: number;
  nextListId?: string | null;
  isActive: boolean;
  words: DatasetWord[];
};

const rawLists = (dataset.lists as DatasetList[]);
const datasetMetadata = dataset as { sourceLanguage?: LanguageCode; targetLanguage?: LanguageCode };

const usageNotesByWordId = new Map(
  (dataset.lists as DatasetList[])
    .flatMap(list => list.words)
    .filter(word => word.usageNote)
    .map(word => [word.id, word.usageNote ?? ''])
);

export const wordLists: WordList[] = rawLists
  .filter(list => list.isActive)
  .sort((a, b) => a.order - b.order)
  .map(list => ({
    id: list.id,
    name: list.name,
    description: list.description,
    language: 'Welsh',
    sourceLanguage: list.sourceLanguage ?? datasetMetadata.sourceLanguage ?? 'en',
    targetLanguage: list.targetLanguage ?? datasetMetadata.targetLanguage ?? 'cy',
    dialect: list.dialect,
    stage: list.stage,
    focus: list.focus,
    difficulty: list.difficulty,
    order: list.order,
    nextListId: list.nextListId ?? null,
    isActive: list.isActive,
    words: [...list.words]
      .sort((a, b) => a.order - b.order)
      .map(word => ({
        id: word.id,
        listId: list.id,
        prompt: word.prompt ?? word.englishPrompt,
        answer: word.answer ?? word.welshAnswer,
        englishPrompt: word.englishPrompt,
        welshAnswer: word.welshAnswer,
        sourceLanguage: list.sourceLanguage ?? datasetMetadata.sourceLanguage ?? 'en',
        targetLanguage: list.targetLanguage ?? datasetMetadata.targetLanguage ?? 'cy',
        acceptedAlternatives: word.acceptedAlternatives ?? [],
        audioUrl: word.audioUrl ?? '',
        audioStatus: word.audioStatus ?? 'missing',
        notes: word.notes ?? '',
        order: word.order,
        difficulty: word.difficulty,
        dialect: word.dialect ?? 'Both',
        dialectNote: word.dialectNote ?? '',
        usageNote: word.usageNote ?? usageNotesByWordId.get(word.id) ?? '',
        variantGroupId: word.variantGroupId ?? ''
      }))
  }));

export function getPrompt(word: Pick<PracticeWord, 'prompt' | 'englishPrompt'>) {
  return word.prompt || word.englishPrompt;
}

export function getAnswer(word: Pick<PracticeWord, 'answer' | 'welshAnswer'>) {
  return word.answer || word.welshAnswer;
}
