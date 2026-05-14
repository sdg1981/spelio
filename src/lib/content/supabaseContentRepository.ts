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

type AudioStatus = NonNullable<PracticeWord['audioStatus']>;

type CollectionRow = {
  id: string;
  slug: string | null;
  name: string | null;
  description: string | null;
  type: string | null;
  source_language: string | null;
  target_language: string | null;
  curriculum_key_stage: string | null;
  curriculum_area: string | null;
  owner_type: string | null;
  owner_id: string | null;
  order_index: number | null;
  is_active: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type WordListRow = {
  id: string;
  slug: string | null;
  collection_id: string | null;
  name: string | null;
  name_cy: string | null;
  description: string | null;
  description_cy: string | null;
  language: string | null;
  source_language: string | null;
  target_language: string | null;
  dialect: string | null;
  stage_id: string | null;
  focus_category_id: string | null;
  difficulty: number | null;
  order_index: number | null;
  next_list_id: string | null;
  is_active: boolean | null;
};

type WordRow = {
  id: string;
  list_id: string;
  english_prompt: string | null;
  welsh_answer: string | null;
  accepted_alternatives: unknown;
  audio_url: string | null;
  audio_status: string | null;
  usage_note: string | null;
  spelling_hint_id?: string | null;
  disable_pattern_hints?: boolean | null;
  dialect: string | null;
  dialect_note: string | null;
  variant_group_id: string | null;
  order_index: number | null;
  difficulty: number | null;
};

const validCollectionTypes: WordListCollectionType[] = ['spelio_core', 'curriculum', 'course', 'school', 'teacher', 'personal', 'custom'];
const validOwnerTypes: Exclude<WordListCollectionOwnerType, null>[] = ['spelio', 'school', 'teacher', 'user'];
const validDialects: Dialect[] = ['Both', 'Mixed', 'North Wales', 'South Wales / Standard', 'Standard', 'Other'];
const validAudioStatuses: AudioStatus[] = ['missing', 'queued', 'generating', 'ready', 'failed'];

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

function asAudioStatus(value: string | null): AudioStatus {
  return validAudioStatuses.includes(value as AudioStatus) ? value as AudioStatus : 'missing';
}

function asDifficulty(value: number | null): WordList['difficulty'] {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 ? value : 1;
}

function asAcceptedAlternatives(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function mapCollection(row: CollectionRow): WordListCollection {
  return {
    id: row.id,
    slug: row.slug ?? row.id,
    name: row.name ?? row.id,
    description: row.description ?? '',
    type: asCollectionType(row.type),
    sourceLanguage: row.source_language ?? 'en',
    targetLanguage: row.target_language ?? 'cy',
    curriculumKeyStage: row.curriculum_key_stage,
    curriculumArea: row.curriculum_area,
    ownerType: asOwnerType(row.owner_type),
    ownerId: row.owner_id,
    order: row.order_index ?? 0,
    isActive: row.is_active === true,
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
    audioUrl: row.audio_url ?? '',
    audioStatus: asAudioStatus(row.audio_status),
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
    name: row.name ?? row.id,
    nameCy: row.name_cy ?? '',
    description: row.description ?? '',
    descriptionCy: row.description_cy ?? '',
    language: 'Welsh',
    sourceLanguage,
    targetLanguage,
    dialect: asDialect(row.dialect),
    stage: row.stage_id ?? '',
    focus: row.focus_category_id ?? '',
    difficulty: asDifficulty(row.difficulty),
    order: row.order_index ?? 0,
    nextListId: row.next_list_id,
    isActive: row.is_active === true,
    words: words
      .map(word => mapWord(word, { ...row, source_language: sourceLanguage, target_language: targetLanguage }))
      .filter((word): word is PracticeWord => Boolean(word))
      .sort((a, b) => a.order - b.order)
  };
}

export async function loadSupabasePublicContent(): Promise<PublicContent> {
  const client = requireSupabase();

  const [collectionsResult, listsResult, wordsResult] = await Promise.all([
    client
      .from('word_list_collections')
      .select('id,slug,name,description,type,source_language,target_language,curriculum_key_stage,curriculum_area,owner_type,owner_id,order_index,is_active,created_at,updated_at')
      .eq('is_active', true)
      .order('order_index', { ascending: true }),
    client
      .from('word_lists')
      .select('id,slug,collection_id,name,name_cy,description,description_cy,language,source_language,target_language,dialect,stage_id,focus_category_id,difficulty,order_index,next_list_id,is_active')
      .eq('is_active', true)
      .order('order_index', { ascending: true }),
    client
      .from('words')
      .select('*')
      .order('order_index', { ascending: true })
  ]);

  if (collectionsResult.error) throw collectionsResult.error;
  if (listsResult.error) throw listsResult.error;
  if (wordsResult.error) throw wordsResult.error;

  const collections = (collectionsResult.data ?? []).map(row => mapCollection(row as CollectionRow));
  const collectionById = new Map(collections.map(collection => [collection.id, collection]));
  const activeLists = (listsResult.data ?? []) as WordListRow[];
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
    .sort((a, b) => a.order - b.order);

  if (!lists.length) {
    throw new Error('Supabase returned no active public word lists.');
  }

  return {
    lists,
    source: 'supabase'
  };
}
