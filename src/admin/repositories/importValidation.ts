import type { AdminWord, AdminWordList, AdminWordListCollection, AudioStatus, ImportValidationResult } from '../types';
import { DEFAULT_COLLECTION_ID } from '../types';

const validDialects = new Set(['Both', 'Mixed', 'North Wales', 'South Wales / Standard', 'Standard', 'Other']);
const validWordDialects = new Set(['Both', 'North Wales', 'South Wales / Standard', 'Standard', 'Other']);
const validAudioStatuses = new Set<AudioStatus>(['missing', 'queued', 'generating', 'generated', 'failed']);
const validCollectionTypes = new Set(['spelio_core', 'curriculum', 'course', 'school', 'teacher', 'personal', 'custom']);
const validOwnerTypes = new Set(['spelio', 'school', 'teacher', 'user']);

export interface ImportValidationContext {
  existingCollectionIds?: string[];
  existingListIds?: string[];
  existingWordIds?: string[];
}

export interface NormalizedImportContent {
  collections: AdminWordListCollection[];
  lists: AdminWordList[];
  words: AdminWord[];
}

export interface ImportPreview extends ImportValidationResult {
  content: NormalizedImportContent;
}

type RawCollection = Record<string, unknown>;
type RawList = Record<string, unknown>;
type RawWord = Record<string, unknown>;

export function validateImportPayload(payload: unknown, context: ImportValidationContext | string[] = []): ImportPreview {
  const existingCollectionIds = Array.isArray(context) ? context : context.existingCollectionIds ?? [];
  const existingListIds = new Set(Array.isArray(context) ? [] : context.existingListIds ?? []);
  const existingWordIds = new Set(Array.isArray(context) ? [] : context.existingWordIds ?? []);
  const parsed = typeof payload === 'string' ? parseJson(payload) : { value: payload, error: '' };
  const errors: string[] = [];
  const warnings: string[] = [];
  const content: NormalizedImportContent = { collections: [], lists: [], words: [] };

  if (parsed.error) errors.push(parsed.error);
  if (!isRecord(parsed.value)) errors.push('Payload must be a JSON object.');
  if (!isRecord(parsed.value) || !Array.isArray(parsed.value.lists)) {
    if (isRecord(parsed.value)) errors.push('Payload must include a lists array.');
    return emptyPreview(errors, warnings);
  }

  const root = parsed.value;
  const collectionIds = new Set<string>([DEFAULT_COLLECTION_ID, ...existingCollectionIds]);
  const importCollectionIds = new Set<string>();
  const listIds = new Set<string>();
  const duplicateListIds = new Set<string>();
  const wordIds = new Set<string>();
  const duplicateWordIds = new Set<string>();
  const wordIdsByList = new Map<string, Set<string>>();
  const duplicatePairsByList = new Map<string, Set<string>>();
  const variantGroups = new Map<string, AdminWord[]>();
  const collectionInputs = new Map<string, RawCollection>();
  const now = new Date().toISOString();

  if (Array.isArray(root.collections)) {
    root.collections.forEach((collection, index) => {
      if (!isRecord(collection)) {
        errors.push(`Collection ${index + 1} must be an object.`);
        return;
      }
      const id = stringValue(collection.id);
      if (!id) {
        errors.push(`Collection ${index + 1} is missing id.`);
        return;
      }
      collectionInputs.set(id, collection);
      collectionIds.add(id);
      importCollectionIds.add(id);
      validateCollection(collection, id, errors, warnings);
    });
  }

  const rawLists = root.lists as unknown[];
  rawLists.forEach((list, listIndex) => {
    if (!isRecord(list)) {
      errors.push(`List ${listIndex + 1} must be an object.`);
      return;
    }

    const listId = stringValue(list.id);
    if (!listId) errors.push(`List ${listIndex + 1} is missing id.`);
    else if (listIds.has(listId)) duplicateListIds.add(listId);
    else listIds.add(listId);
  });

  rawLists.forEach((list, listIndex) => {
    if (!isRecord(list)) return;
    const listLabel = stringValue(list.id) || `#${listIndex + 1}`;
    const listId = stringValue(list.id);
    const listDifficulty = normalizeDifficulty(list.difficulty, 1);
    const sourceLanguage = stringValue(list.sourceLanguage) || 'en';
    const targetLanguage = stringValue(list.targetLanguage) || 'cy';
    const language = stringValue(list.language) || targetLanguage || 'cy';
    const rawCollectionId = stringValue(list.collectionId);
    const collectionId = rawCollectionId || DEFAULT_COLLECTION_ID;
    const listDialect = stringValue(list.dialect) || 'Mixed';

    if (!listId) return;
    if (!stringValue(list.name)) errors.push(`List ${listLabel} is missing name.`);
    if (list.difficulty !== undefined && !validDifficulty(list.difficulty)) errors.push(`List ${listLabel} has invalid difficulty.`);
    if (list.order !== undefined && !validOrder(list.order)) errors.push(`List ${listLabel} has invalid order.`);
    if (list.isActive !== undefined && typeof list.isActive !== 'boolean') errors.push(`List ${listLabel} has invalid isActive.`);
    if (!validLanguage(sourceLanguage)) errors.push(`List ${listLabel} has malformed sourceLanguage "${sourceLanguage}".`);
    if (!validLanguage(targetLanguage)) errors.push(`List ${listLabel} has malformed targetLanguage "${targetLanguage}".`);
    if (!validLanguage(language)) warnings.push(`List ${listLabel} has unusual language "${language}".`);
    if (stringValue(list.dialect) && !validDialects.has(listDialect)) errors.push(`List ${listLabel} has invalid dialect "${listDialect}".`);
    if (rawCollectionId && !collectionIds.has(rawCollectionId)) {
      errors.push(`List ${listLabel} references collectionId "${rawCollectionId}", but that collection does not exist in the admin store or this import.`);
    }
    if (!rawCollectionId) importCollectionIds.add(DEFAULT_COLLECTION_ID);
    else importCollectionIds.add(rawCollectionId);

    const nextListId = stringValue(list.nextListId);
    if (nextListId && !listIds.has(nextListId) && !existingListIds.has(nextListId)) {
      warnings.push(`List ${listLabel} nextListId "${nextListId}" does not match an imported or existing list.`);
    }

    if (!Array.isArray(list.words)) {
      errors.push(`List ${listLabel} must include a words array.`);
      return;
    }

    const pairKeys = new Set<string>();
    const normalizedList: AdminWordList = {
      id: listId,
      collectionId,
      collectionName: collectionName(collectionInputs.get(collectionId), collectionId),
      name: stringValue(list.name),
      nameCy: stringValue(list.nameCy),
      description: stringValue(list.description),
      descriptionCy: stringValue(list.descriptionCy),
      language,
      sourceLanguage,
      targetLanguage,
      dialect: listDialect as AdminWordList['dialect'],
      stageId: slug(stringValue(list.stage)),
      stage: stringValue(list.stage),
      focusCategoryId: slug(stringValue(list.focus)),
      focus: stringValue(list.focus),
      difficulty: listDifficulty as AdminWordList['difficulty'],
      order: numberValue(list.order, listIndex + 1),
      nextListId: nextListId || null,
      isActive: typeof list.isActive === 'boolean' ? list.isActive : true,
      createdAt: now,
      updatedAt: now,
      words: []
    };

    list.words.forEach((word, wordIndex) => {
      if (!isRecord(word)) {
        errors.push(`Word ${wordIndex + 1} in list ${listLabel} must be an object.`);
        return;
      }

      const normalizedWord = normalizeWord(word, normalizedList, wordIndex, errors, warnings, now);
      if (!normalizedWord) return;

      const listWordIds = wordIdsByList.get(listId) ?? new Set<string>();
      if (listWordIds.has(normalizedWord.id)) duplicateWordIds.add(normalizedWord.id);
      listWordIds.add(normalizedWord.id);
      wordIdsByList.set(listId, listWordIds);

      if (wordIds.has(normalizedWord.id)) duplicateWordIds.add(normalizedWord.id);
      else wordIds.add(normalizedWord.id);

      const pairKey = `${normalizedWord.englishPrompt.trim().toLowerCase()}=>${normalizedWord.welshAnswer.trim().toLowerCase()}`;
      if (pairKeys.has(pairKey)) {
        const pairs = duplicatePairsByList.get(listId) ?? new Set<string>();
        pairs.add(pairKey);
        duplicatePairsByList.set(listId, pairs);
      }
      pairKeys.add(pairKey);

      if (normalizedWord.variantGroupId) {
        const group = variantGroups.get(normalizedWord.variantGroupId) ?? [];
        group.push(normalizedWord);
        variantGroups.set(normalizedWord.variantGroupId, group);
      }

      normalizedList.words.push(normalizedWord);
      content.words.push(normalizedWord);
    });

    content.lists.push(normalizedList);
  });

  duplicatePairsByList.forEach((pairs, listId) => {
    pairs.forEach(pair => warnings.push(`List ${listId} contains duplicate prompt/answer pair "${pair}".`));
  });

  variantGroups.forEach((words, groupId) => {
    if (words.length > 1 && words.some(word => word.dialect === 'Both')) {
      warnings.push(`Variant group "${groupId}" has multiple words but at least one variant has no specific dialect.`);
    }
  });

  const allCollectionIds = new Set([...importCollectionIds]);
  allCollectionIds.forEach(id => {
    const input = collectionInputs.get(id);
    if (input || id === DEFAULT_COLLECTION_ID) content.collections.push(normalizeCollection(input, id, now));
  });

  const uniqueListIds = Array.from(listIds);
  const uniqueWordIds = Array.from(wordIds);
  const missingAudio = content.words.filter(word => word.audioStatus === 'missing' || !word.audioUrl).length;
  const duplicates = duplicateListIds.size + duplicateWordIds.size;

  if (duplicateListIds.size) errors.push(...Array.from(duplicateListIds).map(id => `Duplicate word list ID: ${id}.`));
  if (duplicateWordIds.size) errors.push(...Array.from(duplicateWordIds).map(id => `Duplicate word ID: ${id}.`));

  return {
    collections: content.collections.length,
    defaultedCollections: rawLists.filter(list => isRecord(list) && !stringValue(list.collectionId)).length ? 1 : 0,
    totalLists: content.lists.length,
    newLists: uniqueListIds.filter(id => !existingListIds.has(id)).length,
    updatedLists: uniqueListIds.filter(id => existingListIds.has(id)).length,
    newWords: uniqueWordIds.filter(id => !existingWordIds.has(id)).length,
    updatedWords: uniqueWordIds.filter(id => existingWordIds.has(id)).length,
    totalWords: content.words.length,
    duplicates,
    missingAudio,
    errors,
    warnings,
    content
  };
}

function normalizeWord(word: RawWord, list: AdminWordList, wordIndex: number, errors: string[], warnings: string[], now: string): AdminWord | null {
  const wordId = stringValue(word.id);
  const label = wordId || `#${wordIndex + 1} in list ${list.id}`;
  const englishPrompt = stringValue(word.englishPrompt) || stringValue(word.prompt);
  const welshAnswer = stringValue(word.welshAnswer) || stringValue(word.answer);
  const audioStatus = stringValue(word.audioStatus) || 'missing';
  const dialect = stringValue(word.dialect) || 'Both';
  const listId = stringValue(word.listId);

  if (!wordId) errors.push(`Word ${wordIndex + 1} in list ${list.id} is missing id.`);
  if (!englishPrompt) errors.push(`Word ${label} is missing prompt/englishPrompt.`);
  if (!welshAnswer) errors.push(`Word ${label} is missing answer/welshAnswer.`);
  if (listId && listId !== list.id) errors.push(`Word ${label} belongs to ${listId} but is nested in ${list.id}.`);
  if (word.acceptedAlternatives !== undefined && !Array.isArray(word.acceptedAlternatives)) errors.push(`Word ${label} acceptedAlternatives must be an array.`);
  if (!validAudioStatuses.has(audioStatus as AudioStatus)) errors.push(`Word ${label} has invalid audioStatus "${audioStatus}".`);
  if (stringValue(word.dialect) && !validWordDialects.has(dialect)) errors.push(`Word ${label} has invalid dialect "${dialect}".`);
  if (word.difficulty !== undefined && !validDifficulty(word.difficulty)) errors.push(`Word ${label} has invalid difficulty.`);
  if (word.order !== undefined && !validOrder(word.order)) errors.push(`Word ${label} has invalid order.`);
  if (word.variantGroupId !== undefined && word.variantGroupId !== null && typeof word.variantGroupId !== 'string') {
    errors.push(`Word ${label} variantGroupId must be a string, empty, or null.`);
  }
  if (!wordId || !englishPrompt || !welshAnswer || !validAudioStatuses.has(audioStatus as AudioStatus)) return null;

  const acceptedAlternatives = Array.isArray(word.acceptedAlternatives) ? word.acceptedAlternatives.map(String) : [];
  const usageNote = stringValue(word.usageNote);
  const dialectNote = stringValue(word.dialectNote);

  if (!stringValue(word.audioUrl) || audioStatus === 'missing') warnings.push(`Word ${label} is missing audio.`);
  if (noteContainsAnswer(usageNote, welshAnswer)) warnings.push(`Word ${label} usageNote contains the exact target answer.`);
  if (noteContainsAnswer(dialectNote, welshAnswer)) warnings.push(`Word ${label} dialectNote contains the exact target answer.`);
  if (acceptedAlternatives.some(value => Math.abs(value.length - welshAnswer.length) > 4)) {
    warnings.push(`Word ${label} has acceptedAlternatives with substantially different lengths.`);
  }
  if (welshAnswer.length > 34) warnings.push(`Word ${label} has a long answer that may stress mobile layout.`);

  return {
    id: wordId,
    listId: list.id,
    englishPrompt,
    welshAnswer,
    acceptedAlternatives,
    audioUrl: stringValue(word.audioUrl),
    audioStatus: audioStatus as AudioStatus,
    notes: stringValue(word.notes),
    order: numberValue(word.order, wordIndex + 1),
    difficulty: normalizeDifficulty(word.difficulty, list.difficulty),
    dialect: dialect as AdminWord['dialect'],
    dialectNote,
    usageNote,
    variantGroupId: stringValue(word.variantGroupId),
    createdAt: now,
    updatedAt: now
  };
}

function validateCollection(collection: RawCollection, id: string, errors: string[], warnings: string[]) {
  if (!stringValue(collection.name)) errors.push(`Collection ${id} is missing name.`);
  const type = stringValue(collection.type);
  if (type && !validCollectionTypes.has(type)) errors.push(`Collection ${id} has invalid type "${type}".`);
  const ownerType = collection.ownerType === null ? '' : stringValue(collection.ownerType);
  if (ownerType && !validOwnerTypes.has(ownerType)) errors.push(`Collection ${id} has invalid ownerType "${ownerType}".`);
  if (collection.order !== undefined && !validOrder(collection.order)) errors.push(`Collection ${id} has invalid order.`);
  if (collection.isActive !== undefined && typeof collection.isActive !== 'boolean') errors.push(`Collection ${id} has invalid isActive.`);
  if (collection.sourceLanguage !== undefined && !validLanguage(stringValue(collection.sourceLanguage))) warnings.push(`Collection ${id} has unusual sourceLanguage.`);
  if (collection.targetLanguage !== undefined && !validLanguage(stringValue(collection.targetLanguage))) warnings.push(`Collection ${id} has unusual targetLanguage.`);
}

function normalizeCollection(collection: RawCollection | undefined, id: string, now: string): AdminWordListCollection {
  const sourceLanguage = stringValue(collection?.sourceLanguage) || 'en';
  const targetLanguage = stringValue(collection?.targetLanguage) || 'cy';
  const isDefault = id === DEFAULT_COLLECTION_ID;
  return {
    id,
    slug: stringValue(collection?.slug) || slug(id),
    name: stringValue(collection?.name) || (isDefault ? 'Spelio Core Welsh' : id),
    description: stringValue(collection?.description) || (isDefault ? 'Core Welsh spelling practice lists for the Spelio MVP.' : ''),
    type: (stringValue(collection?.type) || (isDefault ? 'spelio_core' : 'custom')) as AdminWordListCollection['type'],
    sourceLanguage,
    targetLanguage,
    curriculumKeyStage: nullableString(collection?.curriculumKeyStage),
    curriculumArea: nullableString(collection?.curriculumArea),
    ownerType: (collection?.ownerType === null ? null : stringValue(collection?.ownerType) || (isDefault ? 'spelio' : null)) as AdminWordListCollection['ownerType'],
    ownerId: nullableString(collection?.ownerId),
    order: numberValue(collection?.order, isDefault ? 1 : 0),
    isActive: typeof collection?.isActive === 'boolean' ? collection.isActive : true,
    createdAt: now,
    updatedAt: now
  };
}

function emptyPreview(errors: string[], warnings: string[]): ImportPreview {
  return {
    collections: 0,
    defaultedCollections: 0,
    totalLists: 0,
    newLists: 0,
    updatedLists: 0,
    newWords: 0,
    updatedWords: 0,
    totalWords: 0,
    duplicates: 0,
    missingAudio: 0,
    errors,
    warnings,
    content: { collections: [], lists: [], words: [] }
  };
}

function parseJson(payload: string): { value: unknown; error: string } {
  try {
    return { value: JSON.parse(payload), error: '' };
  } catch (error) {
    return { value: null, error: error instanceof Error ? `Invalid JSON: ${error.message}` : 'Invalid JSON.' };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function nullableString(value: unknown) {
  const normalized = stringValue(value);
  return normalized || null;
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeDifficulty(value: unknown, fallback: number): number {
  return validDifficulty(value) ? value : fallback;
}

function validDifficulty(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}

function validOrder(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function validLanguage(value: string) {
  return /^[A-Za-z]{2,20}(-[A-Za-z0-9]{2,20})*$/.test(value);
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function collectionName(collection: RawCollection | undefined, id: string) {
  return stringValue(collection?.name) || (id === DEFAULT_COLLECTION_ID ? 'Spelio Core Welsh' : id);
}

function noteContainsAnswer(note: string, answer: string) {
  return answer.trim().length > 1 && note.toLowerCase().includes(answer.trim().toLowerCase());
}
