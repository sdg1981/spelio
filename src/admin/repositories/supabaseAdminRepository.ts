import { supabase } from '../../lib/supabaseClient';
import type { AdminCollectionOwnerType, AdminCollectionType, AdminStructureOption, AdminWord, AdminWordList, AdminWordListCollection, AudioReviewStatus, AudioStatus, DefaultAudioProvider, ElevenLabsAudioStatus, ElevenLabsGenerationMode, ImportContentResult, ImportValidationResult } from '../types';
import { DEFAULT_COLLECTION_ID } from '../types';
import type { AdminRepository, AdminWordWithListName } from './adminRepository';
import type { AdminFocusFilters } from './filters';
import { validateImportPayload, type ImportPreview } from './importValidation';
import { createAudioQueueSnapshot, createAudioStoragePath, createElevenLabsAudioStoragePath, normalizeElevenLabsExtractChunkCount, normalizeElevenLabsExtractStartOffsetMs, normalizeLegacyAudioStatus, synthesizeElevenLabsContextExtractMp3, synthesizeElevenLabsWelshMp3, synthesizeWelshMp3, transformAzureMp3WithElevenLabs } from '../services/audioGeneration';
import { DEFAULT_AUDIO_PROVIDER, normalizeAudioReviewStatus, normalizeDefaultAudioProvider, normalizeElevenLabsAudioStatus, normalizeElevenLabsGenerationMode } from '../../lib/audioProvider';
import { normalizeInterfaceAudioClips } from '../../lib/interfaceAudio';

type CustomWordListRow = {
  id: string;
  public_id: string;
  created_at: string;
  expires_at: string;
  status: string;
  moderation_status: string;
  custom_words?: Array<{ audio_status: string | null }>;
};

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
  list_type?: string | null;
  hidden_from_main_catalogue?: boolean | null;
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
  elevenlabs_audio_url?: string | null;
  elevenlabs_audio_status?: string | null;
  elevenlabs_generation_mode?: string | null;
  preferred_elevenlabs_generation_mode?: string | null;
  elevenlabs_pronunciation_hint?: string | null;
  elevenlabs_pronunciation_hint_used?: boolean | null;
  elevenlabs_pronunciation_hint_text?: string | null;
  elevenlabs_context_phrase?: string | null;
  elevenlabs_extract_mode?: string | null;
  elevenlabs_extract_chunk_count?: number | null;
  elevenlabs_extract_start_offset_ms?: number | null;
  elevenlabs_extraction_used?: boolean | null;
  elevenlabs_context_phrase_used?: string | null;
  elevenlabs_generated_at?: string | null;
  elevenlabs_model?: string | null;
  elevenlabs_voice_id?: string | null;
  elevenlabs_language_override?: string | null;
  elevenlabs_prompt?: string | null;
  audio_review_status?: string | null;
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

  async generateElevenLabsAudioForWord(wordId: string, mode: ElevenLabsGenerationMode = 'direct') {
    const word = await this.getWord(wordId);
    if (!word) throw new Error('Word not found.');
    const pronunciationHint = word.elevenLabsPronunciationHint.trim();
    const contextPhrase = word.elevenLabsContextPhrase.trim();
    const actualMode: ElevenLabsGenerationMode = mode === 'direct' && pronunciationHint
      ? 'direct_with_hint'
      : mode === 'direct_with_hint' && !pronunciationHint
        ? 'direct'
        : mode;
    if (mode === 'azure_transform' && (!word.audioUrl.trim() || word.audioStatus !== 'ready')) {
      throw new Error('Generate Azure audio before creating an ElevenLabs version.');
    }
    if (mode === 'context_extract' && !contextPhrase) {
      throw new Error('Add a context phrase before generating context-extracted ElevenLabs audio.');
    }
    const previousElevenLabsAudioUrl = word.elevenLabsAudioUrl;

    try {
      await this.saveWord({ ...word, elevenLabsGenerationMode: actualMode, elevenLabsAudioStatus: 'pending' }).catch(error => {
        throw new Error(`Supabase save failed while marking ElevenLabs audio as pending: ${readErrorMessage(error)}`);
      });
      const directText = pronunciationHint || word.welshAnswer;
      const audio = mode === 'azure_transform'
        ? await transformAzureMp3WithElevenLabs(word.audioUrl)
        : mode === 'context_extract'
          ? await synthesizeElevenLabsContextExtractMp3(contextPhrase, word.elevenLabsExtractChunkCount, word.elevenLabsExtractStartOffsetMs)
          : await synthesizeElevenLabsWelshMp3(directText);
      const elevenLabsAudioUrl = await this.uploadElevenLabsAudioFile(word, audio.blob).catch(error => {
        throw new Error(`Supabase upload failed: ${readErrorMessage(error)}`);
      });
      const readyWord = await this.saveWord({
        ...word,
        elevenLabsAudioUrl,
        elevenLabsAudioStatus: 'generated',
        elevenLabsGenerationMode: actualMode,
        elevenLabsPronunciationHintUsed: actualMode === 'direct_with_hint',
        elevenLabsPronunciationHintText: actualMode === 'direct_with_hint' ? pronunciationHint : '',
        elevenLabsContextPhraseUsed: actualMode === 'context_extract' ? contextPhrase : '',
        elevenLabsExtractionUsed: audio.diagnostics.extractionUsed,
        elevenLabsExtractMode: actualMode === 'context_extract' ? audio.diagnostics.extractMode : word.elevenLabsExtractMode,
        elevenLabsExtractChunkCount: actualMode === 'context_extract' ? audio.diagnostics.extractChunkCount : word.elevenLabsExtractChunkCount,
        elevenLabsExtractStartOffsetMs: actualMode === 'context_extract' ? audio.diagnostics.extractStartOffsetMs : word.elevenLabsExtractStartOffsetMs,
        elevenLabsGeneratedAt: new Date().toISOString(),
        elevenLabsModel: audio.diagnostics.model,
        elevenLabsVoiceId: audio.diagnostics.voiceId,
        elevenLabsLanguageOverride: audio.diagnostics.languageOverride,
        elevenLabsPrompt: audio.diagnostics.prompt
      }).catch(error => {
        throw new Error(`Supabase save failed after ElevenLabs audio upload: ${readErrorMessage(error)}`);
      });
      return { word: readyWord, ok: true };
    } catch (error) {
      const generationError = error instanceof Error ? error.message : 'ElevenLabs audio generation failed.';
      const failedWord = await this.saveWord({ ...word, elevenLabsAudioUrl: previousElevenLabsAudioUrl, elevenLabsAudioStatus: 'failed', elevenLabsGenerationMode: actualMode }).catch(saveError => {
        throw new Error(`${generationError}; Supabase save failed while marking ElevenLabs audio as failed: ${readErrorMessage(saveError)}`);
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

  async uploadElevenLabsAudioFile(word: AdminWord, file: Blob) {
    const client = requireSupabase();
    const storageMode = (import.meta.env.VITE_AUDIO_STORAGE_MODE as string | undefined) ?? 'supabase';
    if (storageMode !== 'supabase') throw new Error('Only Supabase audio storage is configured.');
    if (file.size < 100) throw new Error('ElevenLabs upload was blocked because the generated file was unexpectedly small.');
    const path = createElevenLabsAudioStoragePath(word);
    const { error } = await client.storage
      .from('audio')
      .upload(path, file, { cacheControl: '3600', contentType: 'audio/mpeg', upsert: true });
    if (error) throw error;
    const { data } = client.storage.from('audio').getPublicUrl(path);
    if (!data.publicUrl) throw new Error('ElevenLabs upload did not return a public URL.');
    return data.publicUrl;
  },

  async getAudioSettings() {
    const client = requireSupabase();
    const [providerResult, interfaceAudioResult] = await Promise.all([
      client.from('admin_settings').select('value').eq('key', 'default_audio_provider').maybeSingle(),
      client.from('admin_settings').select('value').eq('key', 'interface_audio_clips').maybeSingle()
    ]);
    if (providerResult.error) throw providerResult.error;
    if (interfaceAudioResult.error) throw interfaceAudioResult.error;
    return {
      defaultAudioProvider: readDefaultAudioProvider(providerResult.data?.value),
      interfaceAudioClips: normalizeInterfaceAudioClips(interfaceAudioResult.data?.value)
    };
  },

  async saveAudioSettings(settings) {
    const client = requireSupabase();
    const defaultAudioProvider = normalizeDefaultAudioProvider(settings.defaultAudioProvider);
    const interfaceAudioClips = normalizeInterfaceAudioClips(settings.interfaceAudioClips);
    const [providerResult, interfaceAudioResult] = await Promise.all([
      client
        .from('admin_settings')
        .upsert({ key: 'default_audio_provider', value: { provider: defaultAudioProvider } }, { onConflict: 'key' })
        .select('value')
        .single(),
      client
        .from('admin_settings')
        .upsert({ key: 'interface_audio_clips', value: { clips: interfaceAudioClips } }, { onConflict: 'key' })
        .select('value')
        .single()
    ]);
    if (providerResult.error) throw providerResult.error;
    if (interfaceAudioResult.error) throw interfaceAudioResult.error;
    return {
      defaultAudioProvider: readDefaultAudioProvider(providerResult.data?.value),
      interfaceAudioClips: normalizeInterfaceAudioClips(interfaceAudioResult.data?.value)
    };
  },

  async listCustomWordLists() {
    const client = requireSupabase();
    const { data, error } = await client
      .from('custom_word_lists')
      .select('id,public_id,created_at,expires_at,status,moderation_status,custom_words(audio_status)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []).map(mapCustomWordListRow);
  },

  async cleanupExpiredCustomWordLists() {
    const client = requireSupabase();
    const { data, error } = await client.rpc('cleanup_expired_custom_word_lists');
    if (error) throw error;
    return typeof data === 'number' ? data : 0;
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
    isSupportList: row.list_type === 'support' || row.hidden_from_main_catalogue === true || row.collection_id === 'spelio_support_welsh' || row.id.startsWith('support_'),
    listType: row.list_type === 'support' ? 'support' : 'main',
    hiddenFromMainCatalogue: row.hidden_from_main_catalogue === true || row.list_type === 'support' || row.collection_id === 'spelio_support_welsh' || row.id.startsWith('support_'),
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
    elevenLabsAudioUrl: row.elevenlabs_audio_url ?? '',
    elevenLabsAudioStatus: normalizeElevenLabsAudioStatus(row.elevenlabs_audio_status) as ElevenLabsAudioStatus,
    elevenLabsGenerationMode: normalizeElevenLabsGenerationMode(row.elevenlabs_generation_mode) as ElevenLabsGenerationMode,
    preferredElevenLabsGenerationMode: normalizeElevenLabsGenerationMode(row.preferred_elevenlabs_generation_mode) as ElevenLabsGenerationMode,
    elevenLabsPronunciationHint: row.elevenlabs_pronunciation_hint ?? '',
    elevenLabsPronunciationHintUsed: row.elevenlabs_pronunciation_hint_used === true,
    elevenLabsPronunciationHintText: row.elevenlabs_pronunciation_hint_text ?? '',
    elevenLabsContextPhrase: row.elevenlabs_context_phrase ?? '',
    elevenLabsExtractMode: row.elevenlabs_extract_mode === 'final_chunk' ? 'final_chunk' : 'none',
    elevenLabsExtractChunkCount: normalizeElevenLabsExtractChunkCount(row.elevenlabs_extract_chunk_count),
    elevenLabsExtractStartOffsetMs: normalizeElevenLabsExtractStartOffsetMs(row.elevenlabs_extract_start_offset_ms),
    elevenLabsExtractionUsed: row.elevenlabs_extraction_used === true,
    elevenLabsContextPhraseUsed: row.elevenlabs_context_phrase_used ?? '',
    elevenLabsGeneratedAt: row.elevenlabs_generated_at ?? '',
    elevenLabsModel: row.elevenlabs_model ?? '',
    elevenLabsVoiceId: row.elevenlabs_voice_id ?? '',
    elevenLabsLanguageOverride: row.elevenlabs_language_override ?? '',
    elevenLabsPrompt: row.elevenlabs_prompt ?? '',
    audioReviewStatus: normalizeAudioReviewStatus(row.audio_review_status) as AudioReviewStatus,
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
    is_active: list.isActive,
    list_type: list.listType ?? (list.isSupportList ? 'support' : 'main'),
    hidden_from_main_catalogue: list.hiddenFromMainCatalogue === true || list.isSupportList === true || list.listType === 'support'
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

function mapCustomWordListRow(row: CustomWordListRow) {
  const words = row.custom_words ?? [];
  return {
    id: row.id,
    publicId: row.public_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    status: row.status,
    moderationStatus: row.moderation_status,
    wordCount: words.length,
    audioReady: words.filter(word => word.audio_status === 'ready').length,
    audioFailed: words.filter(word => word.audio_status === 'failed').length,
    shareUrl: `/custom-list/${row.public_id}/share`
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
    elevenlabs_audio_url: word.elevenLabsAudioUrl,
    elevenlabs_audio_status: word.elevenLabsAudioStatus,
    elevenlabs_generation_mode: word.elevenLabsGenerationMode,
    preferred_elevenlabs_generation_mode: word.preferredElevenLabsGenerationMode,
    elevenlabs_pronunciation_hint: word.elevenLabsPronunciationHint || null,
    elevenlabs_pronunciation_hint_used: word.elevenLabsPronunciationHintUsed,
    elevenlabs_pronunciation_hint_text: word.elevenLabsPronunciationHintText || null,
    elevenlabs_context_phrase: word.elevenLabsContextPhrase || null,
    elevenlabs_extract_mode: word.elevenLabsExtractMode,
    elevenlabs_extract_chunk_count: word.elevenLabsExtractChunkCount,
    elevenlabs_extract_start_offset_ms: word.elevenLabsExtractStartOffsetMs,
    elevenlabs_extraction_used: word.elevenLabsExtractionUsed,
    elevenlabs_context_phrase_used: word.elevenLabsContextPhraseUsed || null,
    elevenlabs_generated_at: word.elevenLabsGeneratedAt || null,
    elevenlabs_model: word.elevenLabsModel || null,
    elevenlabs_voice_id: word.elevenLabsVoiceId || null,
    elevenlabs_language_override: word.elevenLabsLanguageOverride || null,
    elevenlabs_prompt: word.elevenLabsPrompt || null,
    audio_review_status: word.audioReviewStatus,
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

function readDefaultAudioProvider(value: unknown): DefaultAudioProvider {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_AUDIO_PROVIDER;
  return normalizeDefaultAudioProvider((value as { provider?: unknown }).provider);
}
