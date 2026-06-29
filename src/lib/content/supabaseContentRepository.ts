import { isSupabaseConfigured, supabase } from '../supabaseClient';
import {
  DEFAULT_WORD_LIST_COLLECTION_ID,
  defaultWordListCollection,
  type Dialect,
  type PracticeWord,
  type WordList,
  type WordListCollection,
  type WordListCollectionOwnerType,
  type WordListCollectionType
} from '../../data/wordLists';
import type { PublicContent } from './staticContentRepository';
import { DEFAULT_AUDIO_PROVIDER, normalizeAudioReviewStatus, normalizeDefaultAudioProvider, normalizeElevenLabsAudioStatus, normalizeElevenLabsGenerationMode } from '../audioProvider';
import { createInterfaceAudioRegistry, normalizeInterfaceAudioClips } from '../interfaceAudio';
import { normalizePrimerContent } from '../../content/foundationsPrimer';
import { normalizeCollectionIntroContent } from '../../content/collectionIntro';
import { normalizePublicWordAudioFields } from './publicAudioFields';

type CollectionRow = {
  id: string;
  slug: string | null;
  name: string | null;
  name_cy?: string | null;
  description: string | null;
  description_cy?: string | null;
  type: string | null;
  source_language: string | null;
  target_language: string | null;
  curriculum_key_stage: string | null;
  curriculum_area: string | null;
  owner_type: string | null;
  owner_id: string | null;
  order_index: number | null;
  is_active: boolean | null;
  intro_content?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
};

type WordListRow = {
  id: string;
  slug: string | null;
  collection_id: string | null;
  icon_name?: string | null;
  name: string | null;
  name_cy: string | null;
  description: string | null;
  description_cy: string | null;
  language: string | null;
  source_language: string | null;
  target_language: string | null;
  dialect: string | null;
  stage_id: string | null;
  stages?: { name: string | null } | null;
  focus_category_id: string | null;
  difficulty: number | null;
  order_index: number | null;
  next_list_id: string | null;
  is_active: boolean | null;
  list_type?: string | null;
  hidden_from_main_catalogue?: boolean | null;
  primer_content?: unknown;
};

type WordRow = {
  id: string;
  list_id: string;
  english_prompt: string | null;
  welsh_answer: string | null;
  accepted_alternatives: unknown;
  audio_url: string | null;
  audio_status: string | null;
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
  usage_note: string | null;
  spelling_hint_id?: string | null;
  disable_pattern_hints?: boolean | null;
  dialect: string | null;
  dialect_note: string | null;
  variant_group_id: string | null;
  order_index: number | null;
  difficulty: number | null;
};

const WORD_LIST_SELECT_WITH_SLUG = 'id,slug,collection_id,icon_name,name,name_cy,description,description_cy,language,source_language,target_language,dialect,stage_id,stages(name),focus_category_id,difficulty,order_index,next_list_id,is_active,list_type,hidden_from_main_catalogue,primer_content';
const WORD_LIST_SELECT_WITH_OPTIONAL_METADATA_WITHOUT_SLUG = 'id,collection_id,icon_name,name,name_cy,description,description_cy,language,source_language,target_language,dialect,stage_id,stages(name),focus_category_id,difficulty,order_index,next_list_id,is_active,list_type,hidden_from_main_catalogue,primer_content';
const WORD_LIST_SELECT_LEGACY_MINIMAL = 'id,collection_id,name,name_cy,description,description_cy,language,source_language,target_language,dialect,stage_id,stages(name),focus_category_id,difficulty,order_index,next_list_id,is_active';

const validCollectionTypes: WordListCollectionType[] = ['spelio_core', 'curriculum', 'course', 'school', 'teacher', 'personal', 'custom'];
const validOwnerTypes: Exclude<WordListCollectionOwnerType, null>[] = ['spelio', 'school', 'teacher', 'user'];
const validDialects: Dialect[] = ['Both', 'Mixed', 'North Wales', 'South Wales / Standard', 'Standard', 'Other'];
function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  return supabase;
}

function asCollectionType(value: string | null): WordListCollectionType {
  return validCollectionTypes.includes(value as WordListCollectionType) ? value as WordListCollectionType : 'custom';
}

function asOwnerType(value: string | null): WordListCollectionOwnerType {
  return validOwnerTypes.includes(value as Exclude<WordListCollectionOwnerType, null>)
    ? value as Exclude<WordListCollectionOwnerType, null>
    : null;
}

function asDialect(value: string | null): Dialect {
  return validDialects.includes(value as Dialect) ? value as Dialect : 'Both';
}

function asWordDialect(value: string | null): PracticeWord['dialect'] {
  const dialect = asDialect(value);
  return dialect === 'Mixed' ? 'Both' : dialect;
}

function asDifficulty(value: number | null): WordList['difficulty'] {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 ? value : 1;
}

function normalizeElevenLabsExtractChunkCount(value: unknown): 1 | 2 | 3 {
  return value === 2 || value === 3 ? value : 1;
}

function normalizeElevenLabsExtractStartOffsetMs(value: unknown): 80 | 140 | 220 {
  return value === 140 || value === 220 ? value : 80;
}

function asAcceptedAlternatives(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function isMissingOptionalWordListColumnError(error: { code?: string; message?: string } | null) {
  return error?.code === '42703' && /\b(slug|icon_name|list_type|hidden_from_main_catalogue|primer_content)\b/.test(error.message ?? '');
}

function mapCollection(row: CollectionRow): WordListCollection {
  return {
    id: row.id,
    slug: row.slug ?? row.id,
    name: row.name ?? row.id,
    nameCy: row.name_cy ?? '',
    description: row.description ?? '',
    descriptionCy: row.description_cy ?? '',
    type: asCollectionType(row.type),
    sourceLanguage: row.source_language ?? 'en',
    targetLanguage: row.target_language ?? 'cy',
    curriculumKeyStage: row.curriculum_key_stage,
    curriculumArea: row.curriculum_area,
    ownerType: asOwnerType(row.owner_type),
    ownerId: row.owner_id,
    order: row.order_index ?? 0,
    isActive: row.is_active === true,
    introContent: normalizeCollectionIntroContent(row.intro_content, row.id),
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined
  };
}

function mapWord(row: WordRow, list: WordListRow): PracticeWord | null {
  if (!row.english_prompt || !row.welsh_answer) return null;

  return {
    id: row.id,
    listId: row.list_id,
    prompt: row.english_prompt,
    answer: row.welsh_answer,
    englishPrompt: row.english_prompt,
    welshAnswer: row.welsh_answer,
    sourceLanguage: list.source_language ?? 'en',
    targetLanguage: list.target_language ?? 'cy',
    acceptedAlternatives: asAcceptedAlternatives(row.accepted_alternatives),
    ...normalizePublicWordAudioFields(row),
    elevenLabsAudioUrl: row.elevenlabs_audio_url ?? '',
    elevenLabsAudioStatus: normalizeElevenLabsAudioStatus(row.elevenlabs_audio_status),
    elevenLabsGenerationMode: normalizeElevenLabsGenerationMode(row.elevenlabs_generation_mode),
    preferredElevenLabsGenerationMode: normalizeElevenLabsGenerationMode(row.preferred_elevenlabs_generation_mode),
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
    audioReviewStatus: normalizeAudioReviewStatus(row.audio_review_status),
    notes: '',
    order: row.order_index ?? 0,
    difficulty: row.difficulty ?? undefined,
    dialect: asWordDialect(row.dialect),
    dialectNote: row.dialect_note ?? '',
    usageNote: row.usage_note ?? '',
    spellingHintId: row.spelling_hint_id ?? '',
    disablePatternHints: row.disable_pattern_hints === true,
    variantGroupId: row.variant_group_id ?? ''
  };
}

function mapList(row: WordListRow, collection: WordListCollection, words: WordRow[]): WordList {
  const sourceLanguage = row.source_language ?? collection.sourceLanguage ?? 'en';
  const targetLanguage = row.target_language ?? collection.targetLanguage ?? 'cy';

  return {
    id: row.id,
    slug: row.slug ?? undefined,
    collectionId: row.collection_id ?? DEFAULT_WORD_LIST_COLLECTION_ID,
    collection,
    iconName: row.icon_name ?? '',
    name: row.name ?? row.id,
    nameCy: row.name_cy ?? '',
    description: row.description ?? '',
    descriptionCy: row.description_cy ?? '',
    language: 'Welsh',
    sourceLanguage,
    targetLanguage,
    dialect: asDialect(row.dialect),
    // Deprecated compatibility metadata only. Public recommendation fallback
    // uses nextListId, then collection/list order instead of stage buckets.
    stageId: row.stage_id ?? '',
    stage: row.stages?.name ?? row.stage_id ?? '',
    // Deprecated compatibility metadata only. Focus categories are not used for
    // Practice Library grouping, recommendations, or session generation.
    focus: row.focus_category_id ?? '',
    difficulty: asDifficulty(row.difficulty),
    order: row.order_index ?? 0,
    nextListId: row.next_list_id,
    isActive: row.is_active === true,
    isSupportList: row.list_type === 'support' || row.hidden_from_main_catalogue === true || row.collection_id === 'spelio_support_welsh' || row.id.startsWith('support_'),
    listType: row.list_type === 'support' ? 'support' : 'main',
    hiddenFromMainCatalogue: row.hidden_from_main_catalogue === true || row.list_type === 'support' || row.collection_id === 'spelio_support_welsh' || row.id.startsWith('support_'),
    primerContent: normalizePrimerContent(row.primer_content),
    words: words
      .map(word => mapWord(word, { ...row, source_language: sourceLanguage, target_language: targetLanguage }))
      .filter((word): word is PracticeWord => Boolean(word))
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
  };
}

export async function loadSupabasePublicContent(): Promise<PublicContent> {
  const client = requireSupabase();

  const [collectionsResult, initialListsResult, wordsResult, audioProviderResult, interfaceAudioResult] = await Promise.all([
    client
      .from('word_list_collections')
      .select('id,slug,name,name_cy,description,description_cy,type,source_language,target_language,curriculum_key_stage,curriculum_area,owner_type,owner_id,order_index,is_active,intro_content,created_at,updated_at')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .order('id', { ascending: true }),
    client
      .from('word_lists')
      .select(WORD_LIST_SELECT_WITH_SLUG)
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .order('id', { ascending: true }),
    client
      .from('words')
      .select('*')
      .order('order_index', { ascending: true })
      .order('id', { ascending: true }),
    client
      .from('admin_settings')
      .select('value')
      .eq('key', 'default_audio_provider')
      .maybeSingle(),
    client
      .from('admin_settings')
      .select('value')
      .eq('key', 'interface_audio_clips')
      .maybeSingle()
  ]);

  if (collectionsResult.error) throw collectionsResult.error;
  if (wordsResult.error) throw wordsResult.error;
  if (audioProviderResult.error) throw audioProviderResult.error;
  if (interfaceAudioResult.error) throw interfaceAudioResult.error;

  let listsData: unknown[] | null = initialListsResult.data;
  if (initialListsResult.error) {
    if (!isMissingOptionalWordListColumnError(initialListsResult.error)) throw initialListsResult.error;

    const retryListsResult = await client
      .from('word_lists')
      .select(WORD_LIST_SELECT_WITH_OPTIONAL_METADATA_WITHOUT_SLUG)
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .order('id', { ascending: true });

    if (retryListsResult.error) {
      if (!isMissingOptionalWordListColumnError(retryListsResult.error)) throw retryListsResult.error;

      const legacyListsResult = await client
        .from('word_lists')
        .select(WORD_LIST_SELECT_LEGACY_MINIMAL)
        .eq('is_active', true)
        .order('order_index', { ascending: true })
        .order('id', { ascending: true });

      if (legacyListsResult.error) throw legacyListsResult.error;
      listsData = legacyListsResult.data;
    } else {
      listsData = retryListsResult.data;
    }
  }

  const collections = (collectionsResult.data ?? []).map(row => mapCollection(row as CollectionRow));
  const collectionById = new Map(collections.map(collection => [collection.id, collection]));
  const activeLists = ((listsData ?? []) as WordListRow[])
    .filter(list => collectionById.has(list.collection_id ?? DEFAULT_WORD_LIST_COLLECTION_ID));
  const activeListIds = new Set(activeLists.map(list => list.id));
  const wordsByListId = new Map<string, WordRow[]>();

  for (const word of (wordsResult.data ?? []) as WordRow[]) {
    if (!activeListIds.has(word.list_id)) continue;
    wordsByListId.set(word.list_id, [...(wordsByListId.get(word.list_id) ?? []), word]);
  }

  const lists = activeLists
    .map(list => {
      const collection = collectionById.get(list.collection_id ?? DEFAULT_WORD_LIST_COLLECTION_ID) ?? defaultWordListCollection;
      return mapList(list, collection, wordsByListId.get(list.id) ?? []);
    })
    .filter(list => list.words.length > 0)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  if (!lists.length) {
    throw new Error('Supabase returned no active public word lists.');
  }

  return {
    lists,
    source: 'supabase',
    defaultAudioProvider: readDefaultAudioProvider(audioProviderResult.data?.value),
    interfaceAudioClips: createInterfaceAudioRegistry(normalizeInterfaceAudioClips(interfaceAudioResult.data?.value))
  };
}

function readDefaultAudioProvider(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_AUDIO_PROVIDER;
  return normalizeDefaultAudioProvider((value as { provider?: unknown }).provider);
}
