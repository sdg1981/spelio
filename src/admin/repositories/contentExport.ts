import type { AdminStructureOption, AdminWord, AdminWordList, AdminWordListCollection } from '../types';
import type { WordListPrimerContent } from '../../data/wordLists';
import { normalizePrimerContent, toPrimerContentStorage } from '../../content/foundationsPrimer';

export const ADMIN_CONTENT_EXPORT_SCHEMA_VERSION = '1.3';
export const ADMIN_CONTENT_EXPORT_SOURCE = 'live_database_export';

export interface AdminContentExportPayload {
  schemaVersion: string;
  exportedAt: string;
  source: typeof ADMIN_CONTENT_EXPORT_SOURCE;
  product: 'Spelio';
  language: string;
  sourceLanguage: string;
  targetLanguage: string;
  description: string;
  notes: string[];
  collections: ExportedCollection[];
  stages: ExportedStructureOption[];
  focusCategories: ExportedStructureOption[];
  dialects: ExportedStructureOption[];
  lists: ExportedWordList[];
}

interface ExportedCollection {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: string;
  sourceLanguage: string;
  targetLanguage: string;
  curriculumKeyStage: string | null;
  curriculumArea: string | null;
  ownerType: string | null;
  order: number;
  isActive: boolean;
}

interface ExportedStructureOption {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
}

interface ExportedWordList {
  id: string;
  slug: string;
  collectionId: string;
  name: string;
  nameCy: string;
  description: string;
  descriptionCy: string;
  language: string;
  sourceLanguage: string;
  targetLanguage: string;
  dialect: string;
  stage: string;
  stageId: string;
  focus: string;
  focusCategoryId: string;
  difficulty: number;
  order: number;
  nextListId: string | null;
  isActive: boolean;
  listType: 'main' | 'support';
  isSupportList: boolean;
  hiddenFromMainCatalogue: boolean;
  primerContent?: WordListPrimerContent;
  words: ExportedWord[];
}

interface ExportedWord {
  id: string;
  listId: string;
  englishPrompt: string;
  welshAnswer: string;
  acceptedAlternatives: string[];
  audioUrl: string;
  audioStatus: string;
  notes: string;
  order: number;
  difficulty: number;
  dialect: string;
  dialectNote: string;
  variantGroupId: string;
  usageNote: string;
  spellingHintId?: string;
  disablePatternHints?: boolean;
}

export function buildAdminContentExportPayload(input: {
  collections: AdminWordListCollection[];
  lists: AdminWordList[];
  stages: AdminStructureOption[];
  focusCategories: AdminStructureOption[];
  dialects: AdminStructureOption[];
  exportedAt?: string;
}): AdminContentExportPayload {
  const exportedAt = input.exportedAt ?? new Date().toISOString();
  const collections = [...input.collections].sort(byOrderThenId).map(collection => ({
    id: collection.id,
    slug: collection.slug,
    name: collection.name,
    description: collection.description,
    type: collection.type,
    sourceLanguage: collection.sourceLanguage,
    targetLanguage: collection.targetLanguage,
    curriculumKeyStage: collection.curriculumKeyStage,
    curriculumArea: collection.curriculumArea,
    ownerType: collection.ownerType,
    order: collection.order,
    isActive: collection.isActive
  }));
  const lists = [...input.lists].sort(byOrderThenId).map(exportList);

  return {
    schemaVersion: ADMIN_CONTENT_EXPORT_SCHEMA_VERSION,
    exportedAt,
    source: ADMIN_CONTENT_EXPORT_SOURCE,
    product: 'Spelio',
    language: inferPrimaryLanguage(lists),
    sourceLanguage: inferSourceLanguage(collections, lists),
    targetLanguage: inferTargetLanguage(collections, lists),
    description: 'Live Spelio editorial content export for seeding, backups, migration snapshots, and editorial review.',
    notes: [
      'Generated from the current admin database content, not from static JSON seed files.',
      'The export intentionally excludes learner progress, analytics, timestamps, and transient operational metadata.',
      'Audio fields, including primer audio fields, contain lightweight URL/status metadata only; physical audio files are not embedded.',
      'Collections, lists, and words are sorted by order, then id, for stable review diffs.'
    ],
    collections,
    stages: exportStructureOptions(input.stages),
    focusCategories: exportStructureOptions(input.focusCategories),
    dialects: exportStructureOptions(input.dialects),
    lists
  };
}

export function createAdminContentExportFilename(exportedAt = new Date().toISOString()) {
  return `spelio_live_content_export_${exportedAt.replace(/\.\d{3}Z$/, 'Z').replace(/[:.]/g, '-').replace('T', '_')}.json`;
}

function exportList(list: AdminWordList): ExportedWordList {
  return {
    id: list.id,
    slug: list.slug,
    collectionId: list.collectionId,
    name: list.name,
    nameCy: list.nameCy,
    description: list.description,
    descriptionCy: list.descriptionCy,
    language: list.language,
    sourceLanguage: list.sourceLanguage,
    targetLanguage: list.targetLanguage,
    dialect: list.dialect,
    stage: list.stage,
    stageId: list.stageId,
    focus: list.focus,
    focusCategoryId: list.focusCategoryId,
    difficulty: list.difficulty,
    order: list.order,
    nextListId: list.nextListId,
    isActive: list.isActive,
    listType: list.listType ?? (list.isSupportList ? 'support' : 'main'),
    isSupportList: list.isSupportList === true,
    hiddenFromMainCatalogue: list.hiddenFromMainCatalogue === true,
    primerContent: toPrimerContentStorage(normalizePrimerContent(list.primerContent)),
    words: [...list.words].sort(byOrderThenId).map(exportWord)
  };
}

function exportWord(word: AdminWord): ExportedWord {
  const exported: ExportedWord = {
    id: word.id,
    listId: word.listId,
    englishPrompt: word.englishPrompt,
    welshAnswer: word.welshAnswer,
    acceptedAlternatives: [...word.acceptedAlternatives],
    audioUrl: word.audioUrl,
    audioStatus: word.audioStatus,
    notes: word.notes,
    order: word.order,
    difficulty: word.difficulty,
    dialect: word.dialect,
    dialectNote: word.dialectNote,
    variantGroupId: word.variantGroupId,
    usageNote: word.usageNote
  };
  if (word.spellingHintId?.trim()) exported.spellingHintId = word.spellingHintId.trim();
  if (word.disablePatternHints === true) exported.disablePatternHints = true;
  return exported;
}

function exportStructureOptions(options: AdminStructureOption[]): ExportedStructureOption[] {
  return [...options].sort(byOrderThenId).map(option => ({
    id: option.id,
    name: option.name,
    order: option.order,
    isActive: option.active
  }));
}

function byOrderThenId<T extends { order: number; id: string }>(a: T, b: T) {
  return a.order - b.order || a.id.localeCompare(b.id);
}

function inferPrimaryLanguage(lists: Pick<ExportedWordList, 'language'>[]) {
  return lists.find(list => list.language)?.language ?? 'cy';
}

function inferSourceLanguage(collections: Pick<ExportedCollection, 'sourceLanguage'>[], lists: Pick<ExportedWordList, 'sourceLanguage'>[]) {
  return collections.find(collection => collection.sourceLanguage)?.sourceLanguage ?? lists.find(list => list.sourceLanguage)?.sourceLanguage ?? 'en';
}

function inferTargetLanguage(collections: Pick<ExportedCollection, 'targetLanguage'>[], lists: Pick<ExportedWordList, 'targetLanguage'>[]) {
  return collections.find(collection => collection.targetLanguage)?.targetLanguage ?? lists.find(list => list.targetLanguage)?.targetLanguage ?? 'cy';
}
