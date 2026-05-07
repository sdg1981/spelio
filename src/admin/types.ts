export type AudioStatus = 'missing' | 'queued' | 'generating' | 'generated' | 'failed';
export type AdminDialect = 'Both' | 'Mixed' | 'North Wales' | 'South Wales / Standard' | 'Standard' | 'Other';

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
  variantGroupId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWordList {
  id: string;
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
  newLists: number;
  updatedLists: number;
  totalWords: number;
  duplicates: number;
  missingAudio: number;
  warnings: string[];
}
