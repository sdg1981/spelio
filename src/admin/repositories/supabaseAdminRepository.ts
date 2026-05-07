import { supabase } from '../../lib/supabaseClient';
import type { AdminStructureOption, AdminWord, AdminWordList, AudioStatus, ImportValidationResult } from '../types';
import type { AdminRepository, AdminWordWithListName } from './adminRepository';
import type { AdminFocusFilters } from './filters';
import { validateImportPayload } from './importValidation';

type WordListRow = {
  id: string;
  name: string;
  description: string;
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
  words?: WordRow[];
};

type WordRow = {
  id: string;
  list_id: string;
  english_prompt: string;
  welsh_answer: string;
  accepted_alternatives: unknown;
  audio_url: string;
  audio_status: AudioStatus;
  notes: string;
  usage_note: string;
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

  async listWordLists() {
    const client = requireSupabase();
    const { data, error } = await client
      .from('word_lists')
      .select('*, stages(name), focus_categories(name), words(*)')
      .order('order_index', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapWordListRow);
  },

  async getWordList(id: string) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('word_lists')
      .select('*, stages(name), focus_categories(name), words(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapWordListRow(data) : null;
  },

  async saveWordList(list: AdminWordList) {
    const client = requireSupabase();
    const { data, error } = await client.from('word_lists').update(toWordListRow(list)).eq('id', list.id).select('*, stages(name), focus_categories(name), words(*)').single();
    if (error) throw error;
    return mapWordListRow(data);
  },

  async createWordList(list: AdminWordList) {
    const client = requireSupabase();
    const { data, error } = await client.from('word_lists').insert(toWordListRow(list)).select('*, stages(name), focus_categories(name), words(*)').single();
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

  async validateImport(payload: unknown): Promise<ImportValidationResult> {
    return validateImportPayload(payload);
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

function mapWordListRow(row: WordListRow): AdminWordList {
  const words = [...(row.words ?? [])].sort((a, b) => a.order_index - b.order_index).map(mapWordRow);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
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
    audioStatus: row.audio_status,
    notes: row.notes,
    usageNote: row.usage_note,
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
    name: list.name,
    description: list.description,
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
