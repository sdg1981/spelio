import { supabase } from '../../lib/supabaseClient';
import type { AdminCollectionOwnerType, AdminCollectionType, AdminStructureOption, AdminWord, AdminWordList, AdminWordListCollection, AudioStatus, ImportContentResult, ImportValidationResult } from '../types';
import { DEFAULT_COLLECTION_ID } from '../types';
import type { AdminRepository, AdminWordWithListName } from './adminRepository';
import type { AdminFocusFilters } from './filters';
import { validateImportPayload, type ImportPreview } from './importValidation';
import { createAudioQueueSnapshot, createAudioStoragePath, normalizeLegacyAudioStatus, synthesizeWelshMp3 } from '../services/audioGeneration';

type WordListRow = {
  id: string;
  slug?: string | null;
  collection_id?: string | null;
  name: string;
  name_cy?: string | null;
  description: string;
  description_cy?: string | null;
  language: string;
  source_language?: string | null;
  target_language?: string | null;
  dialect: string;
  stage_id: string | null;
  focus_category_id: string | null;
  difficulty: 1 | 2 | 3 | 4 | 5;
  order_index: number;
  next_list_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stages?: { name: string } | null;
  focus_categories?: { name: string } | null;
  word_list_collections?: { name: string } | null;
  words?: WordRow[];
};

type CollectionRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: AdminCollectionType;
  source_language: string;
  target_language: string;
  curriculum_key_stage: string | null;
  curriculum_area: string | null;
  owner_type: AdminCollectionOwnerType;
  owner_id: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type WordRow = {
  id: string;
  list_id: string;
  english_prompt: string;
  welsh_answer: string;
  accepted_alternatives: unknown;
  audio_url: string;
  audio_status: string;
  notes: string;
  usage_note: string;
  spelling_hint_id?: string | null;
  disable_pattern_hints?: boolean | null;
  dialect: AdminWord['dialect'];
  dialect_note: string;
  variant_group_id: string;
  order_index: number;
  difficulty: number;
  created_at: string;
  updated_at: string;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  }
  return supabase;
}

function assertDestructiveContentImportAllowed() {
  if (import.meta.env.VITE_ALLOW_ADMIN_CONTENT_IMPORT === 'true') return;
  throw new Error('Content import is disabled. Set VITE_ALLOW_ADMIN_CONTENT_IMPORT=true only for an intentional, reviewed import.');
}

export const supabaseAdminRepository: AdminRepository = {
  authMode: 'emailPassword',

  async authenticateAdmin(credentials) {
    const client = requireSupabase();
    if (!credentials.email || !credentials.password) throw new Error('Enter your admin email and password.');
    const { error } = await client.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });
    if (error) throw error;
  },

  async listCollections() {
    const client = requireSupabase();
    const { data, error } = await client.from('word_list_collections').select('*').order('order_index', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapCollectionRow);
  },

  async getCollection(id: string) {
    const client = requireSupabase();
    const { data, error } = await client.from('word_list_collections').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapCollectionRow(data) : null;
  },

  async createCollection(collection: AdminWordListCollection) {
    const client = requireSupabase();
    const { data, error } = await client.from('word_list_collections').insert(toCollectionRow(collection)).select('*').single();
    if (error) throw error;
    return mapCollectionRow(data);
  },

  async saveCollection(collection: AdminWordListCollection) {
    const client = requireSupabase();
    const { data, error } = await client.from('word_list_collections').update(toCollectionRow(collection)).eq('id', collection.id).select('*').single();
    if (error) throw error;
    return mapCollectionRow(data);
  },

  async deleteCollection(id: string) {
    const client = requireSupabase();
    const { error } = await client.from('word_list_collections').delete().eq('id', id);
    if (error) throw error;
  },

  async listWordLists() {
    const client = requireSupabase();
    const { data, error } = await client
      .from('word_lists')
      .select('*, stages(name), focus_categories(name), word_list_collections(name), words(*)')
      .order('order_index', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapWordListRow);
  },

  async getWordList(id: string) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('word_lists')
      .select('*, stages(name), focus_categories(name), word_list_collections(name), words(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapWordListRow(data) : null;
  },

  async saveWordList(list: AdminWordList) {
    const client = requireSupabase();
    const { data, error } = await client.from('word_lists').update(toWordListRow(list)).eq('id', list.id).select('*, stages(name), focus_categories(name), word_list_collections(name), words(*)').single();
    if (error) throw error;
    return mapWordListRow(data);
  },

  async createWordList(list: AdminWordList) {
    const client = requireSupabase();
    const { data, error } = await client.from('word_lists').insert(toWordListRow(list)).select('*, stages(name), focus_categories(name), word_list_collections(name), words(*)').single();
    if (error) throw error;
    return mapWordListRow(data);
  },

  async deleteWordList(id: string) {
    const client = requireSupabase();
    const { error } = await client.from('word_lists').delete().eq('id', id);
    if (error) throw error;
  },

  async listWords(filters?: AdminFocusFilters) {
    const client = requireSupabase();
    let query = client.from('words').select('*, word_lists(name)').order('order_index', { ascending: true });
    if (filters?.listId) query = query.eq('list_id', filters.listId);
    if (filters?.audioStatus) query = query.eq('audio_status', filters.audioStatus);
    if (filters?.search) query = query.or(`english_prompt.ilike.%${filters.search}%,welsh_answer.ilike.%${filters.search}%`);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(row => ({ ...mapWordRow(row), listName: row.word_lists?.name ?? '' }));
  },

  async getWord(id: string) {
    const client = requireSupabase();
    const { data, error } = await client.from('words').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapWordRow(data) : null;
  },

  async saveWord(word: AdminWord) {
    const client = requireSupabase();
    const { data, error } = await client.from('words').update(toWordRow(word)).eq('id', word.id).select('*').single();
    if (error) throw error;
    return mapWordRow(data);
  },

  async createWord(word: AdminWord) {
    const client = requireSupabase();
    const { data, error } = await client.from('words').insert(toWordRow(word)).select('*').single();
    if (error) throw error;
    return mapWordRow(data);
  },

  async deleteWord(id: string) {
    const client = requireSupabase();
    const { error } = await client.from('words').delete().eq('id', id);
    if (error) throw error;
  },

  async reorderWords(listId: string, orderedWordIds: string[]) {
    const client = requireSupabase();
    // TODO: Move reordering behind a protected RPC/API endpoint so it can be atomic.
    const results = await Promise.all(orderedWordIds.map((id, index) => client.from('words').update({ order_index: index + 1 }).eq('id', id).eq('list_id', listId)));
    const failure = results.find(result => result.error);
    if (failure?.error) throw failure.error;
  },

  async getAudioQueue() {
    return createAudioQueueSnapshot(await this.listWords());
  },

  async queueAudioGeneration(wordIds: string[]) {
    const client = requireSupabase();
    if (!wordIds.length) return [];
    const { error } = await client
      .from('words')
      .update({ audio_status: 'queued' })
      .in('id', wordIds)
      .in('audio_status', ['missing', 'failed']);
    if (error) throw error;
    const queuedIds = new Set(wordIds);
    return (await this.listWords()).filter(word => queuedIds.has(word.id));
  },

  async generateAudioForWord(wordId: string) {
    const word = await this.getWord(wordId);
    if (!word) throw new Error('Word not found.');
    const previousAudioUrl = word.audioUrl;

    try {
      await this.saveWord({ ...word, audioStatus: 'generating' }).catch(error => {
        throw new Error(`Supabase save failed while marking audio as generating: ${readErrorMessage(error)}`);
      });
      const audio = await synthesizeWelshMp3(word.welshAnswer);
      const audioUrl = await this.uploadAudioFile(word, audio).catch(error => {
        throw new Error(`Supabase upload failed: ${readErrorMessage(error)}`);
      });
      const readyWord = await this.saveWord({ ...word, audioUrl, audioStatus: 'ready' }).catch(error => {
        throw new Error(`Supabase save failed after audio upload: ${readErrorMessage(error)}`);
      });
      return { word: readyWord, ok: true };
    } catch (error) {
      const generationError = error instanceof Error ? error.message : 'Audio generation failed.';
      const failedWord = await this.saveWord({ ...word, audioUrl: previousAudioUrl, audioStatus: 'failed' }).catch(saveError => {
        throw new Error(`${generationError}; Supabase save failed while marking audio as failed: ${readErrorMessage(saveError)}`);
      });
      return { word: failedWord, ok: false, error: generationError };
    }
  },

  async generateAudioBatch(wordIds: string[]) {
    // TODO: Move batch synthesis to a server-side job queue before production-scale generation.
    const results = [];
    for (const wordId of wordIds) {
      results.push(await this.generateAudioForWord(wordId));
    }
    return results;
  },

  async retryAudioGeneration(wordId: string) {
    return this.generateAudioForWord(wordId);
  },

  async uploadAudioFile(word: AdminWord, file: Blob) {
    const client = requireSupabase();
    const storageMode = (import.meta.env.VITE_AUDIO_STORAGE_MODE as string | undefined) ?? 'supabase';
    if (storageMode !== 'supabase') throw new Error('Only Supabase audio storage is configured.');
    if (file.size < 100) throw new Error('Audio upload was blocked because the generated file was unexpectedly small.');
    const path = createAudioStoragePath(word);
    const { error } = await client.storage
      .from('audio')
      .upload(path, file, { cacheControl: '3600', contentType: 'audio/mpeg', upsert: true });
    if (error) throw error;
    const { data } = client.storage.from('audio').getPublicUrl(path);
    if (!data.publicUrl) throw new Error('Audio upload did not return a public URL.');
    return data.publicUrl;
  },

  async previewImport(payload: unknown): Promise<ImportValidationResult> {
    assertDestructiveContentImportAllowed();
    const client = requireSupabase();
    const [collectionsResult, listsResult, wordsResult] = await Promise.all([
      client.from('word_list_collections').select('id'),
      client.from('word_lists').select('id'),
      client.from('words').select('id')
    ]);
    if (collectionsResult.error) throw collectionsResult.error;
    if (listsResult.error) throw listsResult.error;
    if (wordsResult.error) throw wordsResult.error;
    return validateImportPayload(payload, {
      existingCollectionIds: (collectionsResult.data ?? []).map(collection => collection.id),
      existingListIds: (listsResult.data ?? []).map(list => list.id),
      existingWordIds: (wordsResult.data ?? []).map(word => word.id)
    });
  },

  async importContent(payload: unknown): Promise<ImportContentResult> {
    assertDestructiveContentImportAllowed();
    const client = requireSupabase();
    // TODO: Move production imports behind a protected server/API route with transaction-like behaviour.
    const preview = await this.previewImport(payload) as ImportPreview;
    if (preview.errors.length) {
      return {
        success: false,
        collectionsUpserted: 0,
        listsUpserted: 0,
        wordsUpserted: 0,
        errors: preview.errors,
        warnings: preview.warnings
      };
    }

    const content = preview.content;

    if (content.collections.length) {
      const { error } = await client.from('word_list_collections').upsert(content.collections.map(toCollectionRow), { onConflict: 'id' });
      if (error) {
        return {
          success: false,
          collectionsUpserted: 0,
          listsUpserted: 0,
          wordsUpserted: 0,
          errors: [`Collection import failed: ${error.message}`],
          warnings: preview.warnings
        };
      }
    }

    if (content.lists.length) {
      const { error } = await client.from('word_lists').upsert(content.lists.map(toWordListRow), { onConflict: 'id' });
      if (error) {
        return {
          success: false,
          collectionsUpserted: content.collections.length,
          listsUpserted: 0,
          wordsUpserted: 0,
          errors: [`Word-list import failed: ${error.message}`],
          warnings: preview.warnings
        };
      }
    }

    if (content.words.length) {
      const { error } = await client.from('words').upsert(content.words.map(toWordRow), { onConflict: 'id' });
      if (error) {
        return {
          success: false,
          collectionsUpserted: content.collections.length,
          listsUpserted: content.lists.length,
          wordsUpserted: 0,
          errors: [`Word import failed: ${error.message}`],
          warnings: preview.warnings
        };
      }
    }

    return {
      success: true,
      collectionsUpserted: content.collections.length,
      listsUpserted: content.lists.length,
      wordsUpserted: content.words.length,
      errors: [],
      warnings: preview.warnings
    };
  },

  async validateImport(payload: unknown): Promise<ImportValidationResult> {
    return this.previewImport(payload);
  },

  async listStages() {
    return listStructure('stages');
  },

  async listFocusCategories() {
    return listStructure('focus_categories');
  },

  async listDialects() {
    const client = requireSupabase();
    const { data, error } = await client.from('dialect_options').select('id,label,order_index,is_active').order('order_index', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(row => ({ id: row.id, name: row.label, order: row.order_index, active: row.is_active }));
  }
};

async function listStructure(table: 'stages' | 'focus_categories'): Promise<AdminStructureOption[]> {
  const client = requireSupabase();
  const { data, error } = await client.from(table).select('id,name,order_index,is_active').order('order_index', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(row => ({ id: row.id, name: row.name, order: row.order_index, active: row.is_active }));
}

function mapCollectionRow(row: CollectionRow): AdminWordListCollection {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    type: row.type,
    sourceLanguage: row.source_language,
    targetLanguage: row.target_language,
    curriculumKeyStage: row.curriculum_key_stage,
    curriculumArea: row.curriculum_area,
    ownerType: row.owner_type,
    ownerId: row.owner_id,
    order: row.order_index,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapWordListRow(row: WordListRow): AdminWordList {
  const words = [...(row.words ?? [])].sort((a, b) => a.order_index - b.order_index).map(mapWordRow);
  return {
    id: row.id,
    slug: row.slug ?? slugOrNull(row.name) ?? row.id,
    collectionId: row.collection_id ?? DEFAULT_COLLECTION_ID,
    collectionName: row.word_list_collections?.name ?? 'Spelio Core Welsh',
    name: row.name,
    nameCy: row.name_cy ?? '',
    description: row.description,
    descriptionCy: row.description_cy ?? '',
    language: row.language,
    sourceLanguage: row.source_language ?? 'en',
    targetLanguage: row.target_language ?? 'cy',
    dialect: row.dialect as AdminWordList['dialect'],
    stageId: row.stage_id ?? '',
    stage: row.stages?.name ?? row.stage_id ?? '',
    focusCategoryId: row.focus_category_id ?? '',
    focus: row.focus_categories?.name ?? row.focus_category_id ?? '',
    difficulty: row.difficulty,
    order: row.order_index,
    nextListId: row.next_list_id,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    words
  };
}

function mapWordRow(row: WordRow): AdminWord {
  return {
    id: row.id,
    listId: row.list_id,
    englishPrompt: row.english_prompt,
    welshAnswer: row.welsh_answer,
    acceptedAlternatives: Array.isArray(row.accepted_alternatives) ? row.accepted_alternatives.map(String) : [],
    audioUrl: row.audio_url,
    audioStatus: normalizeLegacyAudioStatus(row.audio_status),
    notes: row.notes,
    usageNote: row.usage_note,
    spellingHintId: row.spelling_hint_id ?? '',
    disablePatternHints: row.disable_pattern_hints === true,
    dialect: row.dialect,
    dialectNote: row.dialect_note,
    variantGroupId: row.variant_group_id,
    order: row.order_index,
    difficulty: row.difficulty,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toWordListRow(list: AdminWordList) {
  return {
    id: list.id,
    slug: list.slug,
    collection_id: list.collectionId || DEFAULT_COLLECTION_ID,
    name: list.name,
    name_cy: list.nameCy || null,
    description: list.description,
    description_cy: list.descriptionCy || null,
    language: list.language,
    source_language: list.sourceLanguage || 'en',
    target_language: list.targetLanguage || 'cy',
    dialect: list.dialect,
    stage_id: list.stageId || null,
    focus_category_id: list.focusCategoryId || null,
    difficulty: list.difficulty,
    order_index: list.order,
    next_list_id: list.nextListId,
    is_active: list.isActive
  };
}

function toCollectionRow(collection: AdminWordListCollection) {
  return {
    id: collection.id,
    slug: collection.slug,
    name: collection.name,
    description: collection.description,
    type: collection.type,
    source_language: collection.sourceLanguage,
    target_language: collection.targetLanguage,
    curriculum_key_stage: collection.curriculumKeyStage || null,
    curriculum_area: collection.curriculumArea || null,
    owner_type: collection.ownerType,
    owner_id: collection.ownerId || null,
    order_index: collection.order,
    is_active: collection.isActive
  };
}

function toWordRow(word: AdminWord) {
  return {
    id: word.id,
    list_id: word.listId,
    english_prompt: word.englishPrompt,
    welsh_answer: word.welshAnswer,
    accepted_alternatives: word.acceptedAlternatives,
    audio_url: word.audioUrl,
    audio_status: word.audioStatus,
    notes: word.notes,
    usage_note: word.usageNote,
    spelling_hint_id: word.spellingHintId?.trim() || null,
    disable_pattern_hints: word.disablePatternHints === true,
    dialect: word.dialect,
    dialect_note: word.dialectNote,
    variant_group_id: word.variantGroupId,
    order_index: word.order,
    difficulty: word.difficulty
  };
}

function slugOrNull(value: string) {
  return value ? value.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null;
}

function readErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
