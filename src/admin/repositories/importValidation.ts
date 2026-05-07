import type { AudioStatus, ImportValidationResult } from '../types';

const validDialects = new Set(['Both', 'Mixed', 'North Wales', 'South Wales / Standard', 'Standard', 'Other']);
const validWordDialects = new Set(['Both', 'North Wales', 'South Wales / Standard', 'Standard', 'Other']);
const validAudioStatuses = new Set<AudioStatus>(['missing', 'queued', 'generating', 'generated', 'failed']);

export function validateImportPayload(payload: unknown): ImportValidationResult {
  const parsed = typeof payload === 'string' ? safeParse(payload) : payload;
  const warnings: string[] = [];
  const listIds = new Set<string>();
  const duplicateListIds = new Set<string>();
  const wordIds = new Set<string>();
  const duplicateWordIds = new Set<string>();

  if (!isRecord(parsed) || !Array.isArray(parsed.lists)) {
    return {
      newLists: 0,
      updatedLists: 0,
      totalWords: 0,
      duplicates: 0,
      missingAudio: 0,
      warnings: ['Payload must be an object with a lists array.']
    };
  }

  let totalWords = 0;
  let missingAudio = 0;

  parsed.lists.forEach((list, listIndex) => {
    if (!isRecord(list)) {
      warnings.push(`List ${listIndex + 1} must be an object.`);
      return;
    }

    const listId = stringValue(list.id);
    if (!listId) warnings.push(`List ${listIndex + 1} is missing id.`);
    else if (listIds.has(listId)) duplicateListIds.add(listId);
    else listIds.add(listId);

    ['name', 'description', 'language', 'dialect', 'stage'].forEach(field => {
      if (!stringValue(list[field])) warnings.push(`List ${listId || listIndex + 1} is missing ${field}.`);
    });

    if (stringValue(list.dialect) && !validDialects.has(stringValue(list.dialect))) {
      warnings.push(`List ${listId || listIndex + 1} has invalid dialect "${String(list.dialect)}".`);
    }

    if (!validDifficulty(list.difficulty)) {
      warnings.push(`List ${listId || listIndex + 1} has invalid difficulty.`);
    }

    if (!Array.isArray(list.words)) {
      warnings.push(`List ${listId || listIndex + 1} must include a words array.`);
      return;
    }

    list.words.forEach((word, wordIndex) => {
      totalWords += 1;
      if (!isRecord(word)) {
        warnings.push(`Word ${wordIndex + 1} in list ${listId || listIndex + 1} must be an object.`);
        return;
      }

      const wordId = stringValue(word.id);
      if (!wordId) warnings.push(`Word ${wordIndex + 1} in list ${listId || listIndex + 1} is missing id.`);
      else if (wordIds.has(wordId)) duplicateWordIds.add(wordId);
      else wordIds.add(wordId);

      if (stringValue(word.listId) && listId && stringValue(word.listId) !== listId) {
        warnings.push(`Word ${wordId || wordIndex + 1} belongs to ${String(word.listId)} but is nested in ${listId}.`);
      }

      ['englishPrompt', 'welshAnswer'].forEach(field => {
        if (!stringValue(word[field])) warnings.push(`Word ${wordId || wordIndex + 1} is missing ${field}.`);
      });

      const dialect = stringValue(word.dialect);
      if (!dialect || !validWordDialects.has(dialect)) warnings.push(`Word ${wordId || wordIndex + 1} has invalid dialect.`);

      const audioStatus = stringValue(word.audioStatus || 'missing');
      if (!validAudioStatuses.has(audioStatus as AudioStatus)) warnings.push(`Word ${wordId || wordIndex + 1} has invalid audioStatus.`);
      if (audioStatus === 'missing' || !stringValue(word.audioUrl)) missingAudio += 1;

      if (!validDifficulty(word.difficulty)) warnings.push(`Word ${wordId || wordIndex + 1} has invalid difficulty.`);
      if (!Array.isArray(word.acceptedAlternatives)) warnings.push(`Word ${wordId || wordIndex + 1} acceptedAlternatives must be an array.`);
      if (word.variantGroupId !== undefined && word.variantGroupId !== null && typeof word.variantGroupId !== 'string') {
        warnings.push(`Word ${wordId || wordIndex + 1} variantGroupId must be a string, empty, or null.`);
      }
    });
  });

  return {
    newLists: listIds.size,
    updatedLists: 0,
    totalWords,
    duplicates: duplicateListIds.size + duplicateWordIds.size,
    missingAudio,
    warnings: [
      ...Array.from(duplicateListIds).map(id => `Duplicate word list ID: ${id}.`),
      ...Array.from(duplicateWordIds).map(id => `Duplicate word ID: ${id}.`),
      ...warnings
    ]
  };
}

function safeParse(payload: string): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function validDifficulty(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}
