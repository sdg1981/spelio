import type { AdminWord, AdminWordList, AdminWordListCollection, AudioReviewStatus, AudioStatus, ElevenLabsAudioStatus, ElevenLabsGenerationMode, ImportValidationResult } from '../types';
import { DEFAULT_COLLECTION_ID } from '../types';
import { createPrimerContentFromDraft, normalizePrimerContent, toPrimerContentStorage } from '../../content/foundationsPrimer';
import { normalizeCollectionIntroContent, toCollectionIntroStorage } from '../../content/collectionIntro';
import type { WordListPrimerContent, WordListPrimerSoundItem } from '../../data/wordLists';

const validDialects = new Set(['Both', 'Mixed', 'North Wales', 'South Wales / Standard', 'Standard', 'Other']);
const validWordDialects = new Set(['Both', 'North Wales', 'South Wales / Standard', 'Standard', 'Other']);
const validAudioStatuses = new Set<AudioStatus>(['missing', 'queued', 'generating', 'ready', 'failed']);
const validElevenLabsAudioStatuses = new Set<ElevenLabsAudioStatus>(['missing', 'pending', 'generated', 'failed']);
const validElevenLabsGenerationModes = new Set<ElevenLabsGenerationMode>(['direct', 'direct_with_hint', 'azure_transform', 'context_extract']);
const validPreferredElevenLabsGenerationModes = new Set<ElevenLabsGenerationMode>(['direct', 'azure_transform']);
const validAudioReviewStatuses = new Set<AudioReviewStatus>(['unchecked', 'approved', 'needs_review', 'needs_regeneration']);
const validCollectionTypes = new Set(['spelio_core', 'curriculum', 'course', 'school', 'teacher', 'personal', 'custom']);
const validOwnerTypes = new Set(['spelio', 'school', 'teacher', 'user']);
const validListTypes = new Set(['main', 'support']);

export interface ImportValidationContext {
  existingCollectionIds?: string[];
  existingListIds?: string[];
  existingWordIds?: string[];
  existingPrimerContentByListId?: Record<string, WordListPrimerContent | null | undefined>;
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
  const existingPrimerContentByListId = Array.isArray(context) ? {} : context.existingPrimerContentByListId ?? {};
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
  const primerDrafts = isRecord(root.primerDrafts) ? root.primerDrafts : isRecord(root.primer_drafts) ? root.primer_drafts : {};
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
      const id = stringField(collection, 'id');
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

    const listId = stringField(list, 'id');
    if (!listId) errors.push(`List ${listIndex + 1} is missing id.`);
    else if (listIds.has(listId)) duplicateListIds.add(listId);
    else listIds.add(listId);
  });

  rawLists.forEach((list, listIndex) => {
    if (!isRecord(list)) return;
    const listLabel = stringField(list, 'id') || `#${listIndex + 1}`;
    const listId = stringField(list, 'id');
    const listDifficulty = normalizeDifficulty(list.difficulty, 1);
    const sourceLanguage = stringField(list, 'sourceLanguage', 'source_language') || 'en';
    const targetLanguage = stringField(list, 'targetLanguage', 'target_language') || 'cy';
    const language = stringField(list, 'language') || targetLanguage || 'cy';
    const rawCollectionId = stringField(list, 'collectionId', 'collection_id');
    const collectionId = rawCollectionId || DEFAULT_COLLECTION_ID;
    const listDialect = stringField(list, 'dialect') || 'Mixed';

    if (!listId) return;
    if (!stringField(list, 'name')) errors.push(`List ${listLabel} is missing name.`);
    if (stringField(list, 'slug') && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(stringField(list, 'slug'))) {
      errors.push(`List ${listLabel} has invalid slug "${stringField(list, 'slug')}".`);
    }
    if (list.difficulty !== undefined && !validDifficulty(list.difficulty)) errors.push(`List ${listLabel} has invalid difficulty.`);
    if (hasField(list, 'order', 'order_index') && !validOrder(fieldValue(list, 'order', 'order_index'))) errors.push(`List ${listLabel} has invalid order.`);
    if (hasField(list, 'isActive', 'is_active') && typeof fieldValue(list, 'isActive', 'is_active') !== 'boolean') errors.push(`List ${listLabel} has invalid isActive.`);
    if (hasField(list, 'hiddenFromMainCatalogue', 'hidden_from_main_catalogue') && typeof fieldValue(list, 'hiddenFromMainCatalogue', 'hidden_from_main_catalogue') !== 'boolean') errors.push(`List ${listLabel} has invalid hiddenFromMainCatalogue.`);
    const rawPrimerContent = fieldValue(list, 'primerContent', 'primer_content');
    const primerContentFromDraft = rawPrimerContent === undefined ? createPrimerContentFromDraft(listId, primerDrafts[listId]) : null;
    const normalizedPrimerContent = mergeExistingWelshPrimerFields(
      rawPrimerContent ?? primerContentFromDraft,
      existingPrimerContentByListId[listId]
    );
    validatePrimerContent(rawPrimerContent ?? primerContentFromDraft, listLabel, errors);
    if (stringField(list, 'listType', 'list_type') && !validListTypes.has(stringField(list, 'listType', 'list_type'))) errors.push(`List ${listLabel} has invalid listType "${stringField(list, 'listType', 'list_type')}".`);
    if (!validLanguage(sourceLanguage)) errors.push(`List ${listLabel} has malformed sourceLanguage "${sourceLanguage}".`);
    if (!validLanguage(targetLanguage)) errors.push(`List ${listLabel} has malformed targetLanguage "${targetLanguage}".`);
    if (!validLanguage(language)) warnings.push(`List ${listLabel} has unusual language "${language}".`);
    if (stringField(list, 'dialect') && !validDialects.has(listDialect)) errors.push(`List ${listLabel} has invalid dialect "${listDialect}".`);
    if (rawCollectionId && !collectionIds.has(rawCollectionId)) {
      errors.push(`List ${listLabel} references collectionId "${rawCollectionId}", but that collection does not exist in the admin store or this import.`);
    }
    if (!rawCollectionId) importCollectionIds.add(DEFAULT_COLLECTION_ID);
    else importCollectionIds.add(rawCollectionId);

    const nextListId = stringField(list, 'nextListId', 'next_list_id');
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
      slug: stringField(list, 'slug') || slug(stringField(list, 'name') || listId),
      collectionId,
      collectionName: collectionName(collectionInputs.get(collectionId), collectionId),
      name: stringField(list, 'name'),
      nameCy: stringField(list, 'nameCy', 'name_cy'),
      description: stringField(list, 'description'),
      descriptionCy: stringField(list, 'descriptionCy', 'description_cy'),
      language,
      sourceLanguage,
      targetLanguage,
      dialect: listDialect as AdminWordList['dialect'],
      stageId: stringField(list, 'stageId', 'stage_id') || slug(stringField(list, 'stage')),
      stage: stringField(list, 'stage') || stringField(list, 'stageId', 'stage_id'),
      focusCategoryId: stringField(list, 'focusCategoryId', 'focus_category_id') || slug(stringField(list, 'focus')),
      focus: stringField(list, 'focus') || stringField(list, 'focusCategoryId', 'focus_category_id'),
      difficulty: listDifficulty as AdminWordList['difficulty'],
      order: numberField(list, listIndex + 1, 'order', 'order_index'),
      nextListId: nextListId || null,
      isActive: typeof fieldValue(list, 'isActive', 'is_active') === 'boolean' ? fieldValue(list, 'isActive', 'is_active') as boolean : true,
      isSupportList: stringField(list, 'listType', 'list_type') === 'support' || fieldValue(list, 'isSupportList', 'is_support_list') === true || fieldValue(list, 'hiddenFromMainCatalogue', 'hidden_from_main_catalogue') === true,
      listType: stringField(list, 'listType', 'list_type') === 'support' || fieldValue(list, 'isSupportList', 'is_support_list') === true ? 'support' : 'main',
      hiddenFromMainCatalogue: fieldValue(list, 'hiddenFromMainCatalogue', 'hidden_from_main_catalogue') === true || stringField(list, 'listType', 'list_type') === 'support' || fieldValue(list, 'isSupportList', 'is_support_list') === true,
      primerContent: normalizedPrimerContent,
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
    defaultedCollections: rawLists.filter(list => isRecord(list) && !stringField(list, 'collectionId', 'collection_id')).length ? 1 : 0,
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

function mergeExistingWelshPrimerFields(incoming: unknown, existing: WordListPrimerContent | null | undefined): WordListPrimerContent {
  const normalizedIncoming = toPrimerContentStorage(normalizePrimerContent(incoming));
  const normalizedExisting = normalizePrimerContent(existing);
  const existingSoundItemsByStableKey = new Map<string, WordListPrimerSoundItem>();
  normalizedExisting.soundItems.forEach(item => {
    if (item.id) existingSoundItemsByStableKey.set(`id:${item.id}`, item);
    if (item.key) existingSoundItemsByStableKey.set(`key:${item.key}`, item);
  });

  return {
    ...normalizedIncoming,
    titleCy: normalizedIncoming.titleCy || normalizedExisting.titleCy,
    bodyCy: normalizedIncoming.bodyCy || normalizedExisting.bodyCy,
    soundItems: normalizedIncoming.soundItems.map(item => {
      const existingItem = (item.id ? existingSoundItemsByStableKey.get(`id:${item.id}`) : undefined)
        ?? (item.key ? existingSoundItemsByStableKey.get(`key:${item.key}`) : undefined);
      return {
        ...item,
        labelCy: item.labelCy || existingItem?.labelCy || ''
      };
    })
  };
}

function validatePrimerContent(value: unknown, listLabel: string, errors: string[]) {
  if (value === undefined) return;
  if (value === null) return;
  if (!isRecord(value)) {
    errors.push(`List ${listLabel} primerContent must be an object when provided.`);
    return;
  }
  if (hasField(value, 'enabled') && typeof fieldValue(value, 'enabled') !== 'boolean') errors.push(`List ${listLabel} primerContent.enabled must be a boolean.`);
  const soundItems = fieldValue(value, 'soundItems', 'sound_items');
  if (soundItems !== undefined && !Array.isArray(soundItems)) {
    errors.push(`List ${listLabel} primerContent.soundItems must be an array.`);
    return;
  }
  if (!Array.isArray(soundItems)) return;
  soundItems.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`Primer sound item ${index + 1} in list ${listLabel} must be an object.`);
      return;
    }
    if (!stringField(item, 'label') && !stringField(item, 'id') && !stringField(item, 'key')) {
      errors.push(`Primer sound item ${index + 1} in list ${listLabel} is missing label or stable key.`);
    }
    const audioStatus = stringField(item, 'audioStatus', 'audio_status');
    if (audioStatus && !validAudioStatuses.has(audioStatus as AudioStatus)) errors.push(`Primer sound item ${index + 1} in list ${listLabel} has invalid audioStatus "${audioStatus}".`);
  });
}

function normalizeWord(word: RawWord, list: AdminWordList, wordIndex: number, errors: string[], warnings: string[], now: string): AdminWord | null {
  const wordId = stringField(word, 'id');
  const label = wordId || `#${wordIndex + 1} in list ${list.id}`;
  const englishPrompt = stringField(word, 'englishPrompt', 'english_prompt') || stringField(word, 'prompt');
  const welshAnswer = stringField(word, 'welshAnswer', 'welsh_answer') || stringField(word, 'answer');
  const audioStatus = stringField(word, 'audioStatus', 'audio_status') || 'missing';
  const elevenLabsAudioStatus = stringField(word, 'elevenLabsAudioStatus', 'elevenlabs_audio_status') || 'missing';
  const elevenLabsGenerationMode = stringField(word, 'elevenLabsGenerationMode', 'elevenlabs_generation_mode') || 'direct';
  const preferredElevenLabsGenerationMode = stringField(word, 'preferredElevenLabsGenerationMode', 'preferred_elevenlabs_generation_mode') || 'direct';
  const audioReviewStatus = stringField(word, 'audioReviewStatus', 'audio_review_status') || 'unchecked';
  const dialect = stringField(word, 'dialect') || 'Both';
  const listId = stringField(word, 'listId', 'list_id');

  if (!wordId) errors.push(`Word ${wordIndex + 1} in list ${list.id} is missing id.`);
  if (!englishPrompt) errors.push(`Word ${label} is missing prompt/englishPrompt.`);
  if (!welshAnswer) errors.push(`Word ${label} is missing answer/welshAnswer.`);
  if (listId && listId !== list.id) errors.push(`Word ${label} belongs to ${listId} but is nested in ${list.id}.`);
  if (word.acceptedAlternatives !== undefined && !Array.isArray(word.acceptedAlternatives)) errors.push(`Word ${label} acceptedAlternatives must be an array.`);
  if (!validAudioStatuses.has(audioStatus as AudioStatus)) errors.push(`Word ${label} has invalid audioStatus "${audioStatus}".`);
  if (!validElevenLabsAudioStatuses.has(elevenLabsAudioStatus as ElevenLabsAudioStatus)) errors.push(`Word ${label} has invalid elevenLabsAudioStatus "${elevenLabsAudioStatus}".`);
  if (!validElevenLabsGenerationModes.has(elevenLabsGenerationMode as ElevenLabsGenerationMode)) errors.push(`Word ${label} has invalid elevenLabsGenerationMode "${elevenLabsGenerationMode}".`);
  if (!validPreferredElevenLabsGenerationModes.has(preferredElevenLabsGenerationMode as ElevenLabsGenerationMode)) errors.push(`Word ${label} has invalid preferredElevenLabsGenerationMode "${preferredElevenLabsGenerationMode}".`);
  if (!validAudioReviewStatuses.has(audioReviewStatus as AudioReviewStatus)) errors.push(`Word ${label} has invalid audioReviewStatus "${audioReviewStatus}".`);
  if (stringField(word, 'dialect') && !validWordDialects.has(dialect)) errors.push(`Word ${label} has invalid dialect "${dialect}".`);
  if (word.difficulty !== undefined && !validDifficulty(word.difficulty)) errors.push(`Word ${label} has invalid difficulty.`);
  if (hasField(word, 'order', 'order_index') && !validOrder(fieldValue(word, 'order', 'order_index'))) errors.push(`Word ${label} has invalid order.`);
  if (hasField(word, 'variantGroupId', 'variant_group_id') && fieldValue(word, 'variantGroupId', 'variant_group_id') !== null && typeof fieldValue(word, 'variantGroupId', 'variant_group_id') !== 'string') {
    errors.push(`Word ${label} variantGroupId must be a string, empty, or null.`);
  }
  if (hasField(word, 'spellingHintId', 'spelling_hint_id') && fieldValue(word, 'spellingHintId', 'spelling_hint_id') !== null && typeof fieldValue(word, 'spellingHintId', 'spelling_hint_id') !== 'string') {
    errors.push(`Word ${label} spellingHintId must be a string, empty, or null.`);
  }
  if (hasField(word, 'disablePatternHints', 'disable_pattern_hints') && typeof fieldValue(word, 'disablePatternHints', 'disable_pattern_hints') !== 'boolean') {
    errors.push(`Word ${label} disablePatternHints must be a boolean when provided.`);
  }
  if (!wordId || !englishPrompt || !welshAnswer || !validAudioStatuses.has(audioStatus as AudioStatus) || !validElevenLabsAudioStatuses.has(elevenLabsAudioStatus as ElevenLabsAudioStatus) || !validElevenLabsGenerationModes.has(elevenLabsGenerationMode as ElevenLabsGenerationMode) || !validPreferredElevenLabsGenerationModes.has(preferredElevenLabsGenerationMode as ElevenLabsGenerationMode) || !validAudioReviewStatuses.has(audioReviewStatus as AudioReviewStatus)) return null;

  const rawAcceptedAlternatives = fieldValue(word, 'acceptedAlternatives', 'accepted_alternatives');
  const acceptedAlternatives = Array.isArray(rawAcceptedAlternatives) ? rawAcceptedAlternatives.map(String) : [];
  const usageNote = stringField(word, 'usageNote', 'usage_note');
  const dialectNote = stringField(word, 'dialectNote', 'dialect_note');

  if (!stringField(word, 'audioUrl', 'audio_url') || audioStatus === 'missing') warnings.push(`Word ${label} is missing audio.`);
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
    audioUrl: stringField(word, 'audioUrl', 'audio_url'),
    audioStatus: audioStatus as AudioStatus,
    elevenLabsAudioUrl: stringField(word, 'elevenLabsAudioUrl', 'elevenlabs_audio_url'),
    elevenLabsAudioStatus: elevenLabsAudioStatus as ElevenLabsAudioStatus,
    elevenLabsGenerationMode: elevenLabsGenerationMode as ElevenLabsGenerationMode,
    preferredElevenLabsGenerationMode: preferredElevenLabsGenerationMode as ElevenLabsGenerationMode,
    elevenLabsPronunciationHint: stringField(word, 'elevenLabsPronunciationHint', 'elevenlabs_pronunciation_hint'),
    elevenLabsPronunciationHintUsed: fieldValue(word, 'elevenLabsPronunciationHintUsed', 'elevenlabs_pronunciation_hint_used') === true,
    elevenLabsPronunciationHintText: stringField(word, 'elevenLabsPronunciationHintText', 'elevenlabs_pronunciation_hint_text'),
    elevenLabsContextPhrase: stringField(word, 'elevenLabsContextPhrase', 'elevenlabs_context_phrase'),
    elevenLabsExtractMode: fieldValue(word, 'elevenLabsExtractMode', 'elevenlabs_extract_mode') === 'final_chunk' ? 'final_chunk' : 'none',
    elevenLabsExtractChunkCount: normalizeElevenLabsExtractChunkCount(fieldValue(word, 'elevenLabsExtractChunkCount', 'elevenlabs_extract_chunk_count')),
    elevenLabsExtractStartOffsetMs: normalizeElevenLabsExtractStartOffsetMs(fieldValue(word, 'elevenLabsExtractStartOffsetMs', 'elevenlabs_extract_start_offset_ms')),
    elevenLabsExtractionUsed: fieldValue(word, 'elevenLabsExtractionUsed', 'elevenlabs_extraction_used') === true,
    elevenLabsContextPhraseUsed: stringField(word, 'elevenLabsContextPhraseUsed', 'elevenlabs_context_phrase_used'),
    elevenLabsGeneratedAt: stringField(word, 'elevenLabsGeneratedAt', 'elevenlabs_generated_at'),
    elevenLabsModel: stringField(word, 'elevenLabsModel', 'elevenlabs_model'),
    elevenLabsVoiceId: stringField(word, 'elevenLabsVoiceId', 'elevenlabs_voice_id'),
    elevenLabsLanguageOverride: stringField(word, 'elevenLabsLanguageOverride', 'elevenlabs_language_override'),
    elevenLabsPrompt: stringField(word, 'elevenLabsPrompt', 'elevenlabs_prompt'),
    audioReviewStatus: audioReviewStatus as AudioReviewStatus,
    notes: stringField(word, 'notes'),
    order: numberField(word, wordIndex + 1, 'order', 'order_index'),
    difficulty: normalizeDifficulty(word.difficulty, list.difficulty),
    dialect: dialect as AdminWord['dialect'],
    dialectNote,
    usageNote,
    spellingHintId: stringField(word, 'spellingHintId', 'spelling_hint_id'),
    disablePatternHints: fieldValue(word, 'disablePatternHints', 'disable_pattern_hints') === true,
    variantGroupId: stringField(word, 'variantGroupId', 'variant_group_id'),
    createdAt: now,
    updatedAt: now
  };
}

function normalizeElevenLabsExtractChunkCount(value: unknown): 1 | 2 | 3 {
  return value === 2 || value === 3 ? value : 1;
}

function normalizeElevenLabsExtractStartOffsetMs(value: unknown): 80 | 140 | 220 {
  return value === 140 || value === 220 ? value : 80;
}

function validateCollection(collection: RawCollection, id: string, errors: string[], warnings: string[]) {
  if (!stringField(collection, 'name')) errors.push(`Collection ${id} is missing name.`);
  const type = stringField(collection, 'type');
  if (type && !validCollectionTypes.has(type)) errors.push(`Collection ${id} has invalid type "${type}".`);
  const ownerType = fieldValue(collection, 'ownerType', 'owner_type') === null ? '' : stringField(collection, 'ownerType', 'owner_type');
  if (ownerType && !validOwnerTypes.has(ownerType)) errors.push(`Collection ${id} has invalid ownerType "${ownerType}".`);
  if (hasField(collection, 'order', 'order_index') && !validOrder(fieldValue(collection, 'order', 'order_index'))) errors.push(`Collection ${id} has invalid order.`);
  if (hasField(collection, 'isActive', 'is_active') && typeof fieldValue(collection, 'isActive', 'is_active') !== 'boolean') errors.push(`Collection ${id} has invalid isActive.`);
  if (hasField(collection, 'sourceLanguage', 'source_language') && !validLanguage(stringField(collection, 'sourceLanguage', 'source_language'))) warnings.push(`Collection ${id} has unusual sourceLanguage.`);
  if (hasField(collection, 'targetLanguage', 'target_language') && !validLanguage(stringField(collection, 'targetLanguage', 'target_language'))) warnings.push(`Collection ${id} has unusual targetLanguage.`);
  validateCollectionIntroContent(fieldValue(collection, 'introContent', 'intro_content'), id, errors);
}

function normalizeCollection(collection: RawCollection | undefined, id: string, now: string): AdminWordListCollection {
  const sourceLanguage = stringField(collection, 'sourceLanguage', 'source_language') || 'en';
  const targetLanguage = stringField(collection, 'targetLanguage', 'target_language') || 'cy';
  const isDefault = id === DEFAULT_COLLECTION_ID;
  return {
    id,
    slug: stringField(collection, 'slug') || slug(id),
    name: stringField(collection, 'name') || (isDefault ? 'Spelio Core Welsh' : id),
    nameCy: stringField(collection, 'nameCy', 'name_cy') || (isDefault ? 'Spelio Cymraeg Craidd' : ''),
    description: stringField(collection, 'description') || (isDefault ? 'Core Welsh spelling practice lists for the Spelio MVP.' : ''),
    descriptionCy: stringField(collection, 'descriptionCy', 'description_cy') || (isDefault ? 'Rhestrau ymarfer sillafu Cymraeg craidd ar gyfer MVP Spelio.' : ''),
    type: (stringField(collection, 'type') || (isDefault ? 'spelio_core' : 'custom')) as AdminWordListCollection['type'],
    sourceLanguage,
    targetLanguage,
    curriculumKeyStage: nullableString(fieldValue(collection, 'curriculumKeyStage', 'curriculum_key_stage')),
    curriculumArea: nullableString(fieldValue(collection, 'curriculumArea', 'curriculum_area')),
    ownerType: (fieldValue(collection, 'ownerType', 'owner_type') === null ? null : stringField(collection, 'ownerType', 'owner_type') || (isDefault ? 'spelio' : null)) as AdminWordListCollection['ownerType'],
    ownerId: nullableString(fieldValue(collection, 'ownerId', 'owner_id')),
    order: numberField(collection, isDefault ? 1 : 0, 'order', 'order_index'),
    isActive: typeof fieldValue(collection, 'isActive', 'is_active') === 'boolean' ? fieldValue(collection, 'isActive', 'is_active') as boolean : true,
    introContent: toCollectionIntroStorage(normalizeCollectionIntroContent(fieldValue(collection, 'introContent', 'intro_content'), id), id),
    createdAt: now,
    updatedAt: now
  };
}

function validateCollectionIntroContent(value: unknown, collectionId: string, errors: string[]) {
  if (value === undefined || value === null) return;
  if (!isRecord(value)) {
    errors.push(`Collection ${collectionId} introContent must be an object when provided.`);
    return;
  }
  if (hasField(value, 'enabled') && typeof fieldValue(value, 'enabled') !== 'boolean') errors.push(`Collection ${collectionId} introContent.enabled must be a boolean.`);
  const audioStatusEn = stringField(value, 'audioStatusEn', 'audio_status_en', 'introAudioStatusEn', 'intro_audio_status_en', 'audioStatus', 'audio_status', 'introAudioStatus', 'intro_audio_status');
  const audioStatusCy = stringField(value, 'audioStatusCy', 'audio_status_cy', 'introAudioStatusCy', 'intro_audio_status_cy');
  if (audioStatusEn && !validAudioStatuses.has(audioStatusEn as AudioStatus)) errors.push(`Collection ${collectionId} introContent has invalid audioStatusEn "${audioStatusEn}".`);
  if (audioStatusCy && !validAudioStatuses.has(audioStatusCy as AudioStatus)) errors.push(`Collection ${collectionId} introContent has invalid audioStatusCy "${audioStatusCy}".`);
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

function fieldValue(record: RawCollection | RawList | RawWord | undefined, ...keys: string[]) {
  if (!record) return undefined;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  }
  return undefined;
}

function hasField(record: RawCollection | RawList | RawWord | undefined, ...keys: string[]) {
  if (!record) return false;
  return keys.some(key => Object.prototype.hasOwnProperty.call(record, key));
}

function stringField(record: RawCollection | RawList | RawWord | undefined, ...keys: string[]) {
  return stringValue(fieldValue(record, ...keys));
}

function nullableString(value: unknown) {
  const normalized = stringValue(value);
  return normalized || null;
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function numberField(record: RawCollection | RawList | RawWord | undefined, fallback: number, ...keys: string[]) {
  return numberValue(fieldValue(record, ...keys), fallback);
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
  return stringField(collection, 'name') || (id === DEFAULT_COLLECTION_ID ? 'Spelio Core Welsh' : id);
}

function noteContainsAnswer(note: string, answer: string) {
  return answer.trim().length > 1 && note.toLowerCase().includes(answer.trim().toLowerCase());
}
