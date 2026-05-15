import { isSupabaseConfigured, supabase } from './supabaseClient';
import { CUSTOM_LIST_TITLE } from './customListValidation';
import type { PracticeWord, WordList } from '../data/wordLists';
export {
  CUSTOM_LIST_ROUTE_PREFIX,
  getCustomListCanonicalUrl,
  getCustomListPath,
  getCustomListSharePath,
  getCustomListShareUrl,
  getCustomPublicIdFromPath,
  getCustomSharePublicIdFromPath
} from './customListRoutes';
export {
  CUSTOM_LIST_ENGLISH_MAX_LENGTH,
  CUSTOM_LIST_INITIAL_ROWS,
  CUSTOM_LIST_MAX_ROWS,
  CUSTOM_LIST_TITLE,
  CUSTOM_LIST_WELSH_MAX_LENGTH,
  createEmptyCustomListRows,
  getVisibleCustomListRowCount,
  normaliseCustomListEntries,
  validateCustomListRows,
  type CustomListEntryInput,
  type CustomListValidationError,
  type CustomListValidationErrorCode,
  type CustomListValidationResult
} from './customListValidation';


export type CustomListRow = {
  id: string;
  public_id: string;
  title: string | null;
  source_language: string | null;
  target_language: string | null;
  status: string | null;
  moderation_status: string | null;
  expires_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  custom_words?: CustomWordRow[];
};

export type CustomWordRow = {
  id: string;
  custom_list_id: string;
  welsh_answer: string | null;
  english_prompt: string | null;
  audio_url: string | null;
  audio_status: string | null;
  order_index: number | null;
  created_at?: string | null;
};

export type CustomListLoadResult =
  | { state: 'ready'; list: WordList; publicId: string; expiresAt: string | null }
  | { state: 'expired' }
  | { state: 'not-found' }
  | { state: 'error'; error: string };

export async function loadCustomWordList(publicId: string): Promise<CustomListLoadResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { state: 'error', error: 'Supabase is not configured.' };
  }

  const { data, error } = await supabase
    .from('custom_word_lists')
    .select('id,public_id,title,source_language,target_language,status,moderation_status,expires_at,created_at,updated_at,custom_words(id,custom_list_id,welsh_answer,english_prompt,audio_url,audio_status,order_index,created_at)')
    .eq('public_id', publicId)
    .maybeSingle();

  if (error) return { state: 'error', error: error.message };
  if (!data) return { state: 'not-found' };

  const row = data as CustomListRow;
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return { state: 'expired' };
  if (row.status !== 'ready') return { state: 'not-found' };

  const words = (row.custom_words ?? [])
    .map(word => mapCustomWord(word, row))
    .filter((word): word is PracticeWord => Boolean(word))
    .sort((a, b) => a.order - b.order);

  if (!words.length || words.some(word => !word.audioUrl || word.audioStatus !== 'ready')) {
    return { state: 'not-found' };
  }

  return {
    state: 'ready',
    publicId,
    expiresAt: row.expires_at,
    list: {
      id: `custom:${row.public_id}`,
      slug: row.public_id,
      collectionId: 'temporary_custom_lists',
      collection: {
        id: 'temporary_custom_lists',
        slug: 'temporary-custom-lists',
        name: 'Temporary custom lists',
        description: '',
        type: 'custom',
        sourceLanguage: row.source_language ?? 'en',
        targetLanguage: row.target_language ?? 'cy',
        ownerType: null,
        order: 0,
        isActive: true
      },
      name: row.title ?? CUSTOM_LIST_TITLE,
      nameCy: '',
      description: CUSTOM_LIST_TITLE,
      descriptionCy: '',
      language: 'Welsh',
      sourceLanguage: row.source_language ?? 'en',
      targetLanguage: row.target_language ?? 'cy',
      dialect: 'Both',
      stage: 'Custom',
      focus: 'Custom',
      difficulty: 1,
      order: 0,
      nextListId: null,
      isActive: true,
      words
    }
  };
}

function mapCustomWord(row: CustomWordRow, list: CustomListRow): PracticeWord | null {
  const welshAnswer = row.welsh_answer?.trim();
  if (!welshAnswer || !row.audio_url || row.audio_status !== 'ready') return null;
  const englishPrompt = row.english_prompt?.trim() || '';
  const prompt = englishPrompt || welshAnswer;

  return {
    id: `custom:${list.public_id}:${row.id}`,
    listId: `custom:${list.public_id}`,
    prompt,
    answer: welshAnswer,
    englishPrompt: prompt,
    welshAnswer,
    sourceLanguage: list.source_language ?? 'en',
    targetLanguage: list.target_language ?? 'cy',
    acceptedAlternatives: [],
    audioUrl: row.audio_url,
    audioStatus: 'ready',
    notes: '',
    order: row.order_index ?? 0,
    difficulty: 1,
    dialect: 'Both',
    dialectNote: '',
    usageNote: '',
    spellingHintId: '',
    disablePatternHints: true,
    variantGroupId: ''
  };
}
