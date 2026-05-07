import dataset from '../../data/spelio_welsh_35_list_dataset_dialect_v1_1.json';
import type { AdminDialect, AdminWord, AdminWordList, AudioStatus } from '../types';

type RawWord = {
  id: string;
  englishPrompt: string;
  welshAnswer: string;
  acceptedAlternatives?: string[];
  audioUrl?: string;
  audioStatus?: AudioStatus;
  notes?: string;
  order: number;
  difficulty?: number;
  dialect?: AdminWord['dialect'];
  dialectNote?: string;
  usageNote?: string;
  variantGroupId?: string;
};

type RawList = {
  id: string;
  name: string;
  description: string;
  language: string;
  dialect: AdminDialect;
  stage: string;
  focus?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  order: number;
  nextListId?: string | null;
  isActive: boolean;
  words: RawWord[];
};

const rawLists = dataset.lists as RawList[];
const baseCreatedAt = '2025-05-12';
const baseUpdatedAt = '2025-05-19';
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const adminWordLists: AdminWordList[] = rawLists
  .map(list => ({
    id: list.id,
    name: list.name,
    description: list.description,
    language: list.language === 'cy' ? 'Welsh' : list.language,
    dialect: list.dialect,
    stageId: slug(list.stage),
    stage: list.stage,
    focusCategoryId: slug(list.focus ?? 'General'),
    focus: list.focus ?? 'General',
    difficulty: list.difficulty,
    order: list.order,
    nextListId: list.nextListId ?? null,
    isActive: list.isActive,
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
        notes: word.notes ?? '',
        order: word.order,
        difficulty: word.difficulty ?? list.difficulty,
        dialect: word.dialect ?? 'Both',
        dialectNote: word.dialectNote ?? '',
        usageNote: word.usageNote ?? '',
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
  const generated = list.words.filter(word => word.audioStatus === 'generated').length;
  return { missing, failed, generated, percent: Math.round((generated / total) * 100) };
}
