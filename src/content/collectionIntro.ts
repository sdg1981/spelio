import type { InterfaceLanguage } from '../i18n';
import type { PrimerAudioSource, PrimerAudioStatus, WordList, WordListCollection, WordListCollectionIntroContent } from '../data/wordLists';

export const WELSH_FOUNDATIONS_COLLECTION_ID = 'spelio_welsh_foundations';
export const COLLECTION_INTRO_SEEN_KEY_PREFIX = 'spelio-collection-intro:';

export type CollectionIntro = {
  collectionId: string;
  title: string;
  body: string;
  displayLanguage: 'en' | 'cy';
  audioUrl?: string;
  audioStatus: PrimerAudioStatus;
  audioSource: PrimerAudioSource;
  version: string;
  seenKey: string;
};

const DEFAULT_FOUNDATIONS_INTRO_VERSION = '2026-06-23';

const DEFAULT_FOUNDATIONS_INTRO: WordListCollectionIntroContent = {
  enabled: true,
  titleEn: 'Welcome to Welsh Spelling Foundations.',
  titleCy: 'Croeso i Sylfeini Sillafu Cymraeg.',
  bodyEn: [
    'Welsh spelling follows patterns.',
    "Over the next few short exercises, you'll begin to recognise some of the sounds and spelling patterns that appear throughout Welsh.",
    'Becoming familiar with these patterns can make Welsh spelling feel much more predictable.'
  ].join('\n\n'),
  bodyCy: [
    'Mae sillafu Cymraeg yn dilyn patrymau.',
    "Dros yr ymarferion byr hyn, byddwch yn dechrau adnabod rhai o'r seiniau a'r patrymau sillafu sy'n ymddangos drwy'r Gymraeg.",
    "Gall dod yn gyfarwydd â'r patrymau hyn wneud i sillafu Cymraeg deimlo'n llawer mwy rhagweladwy."
  ].join('\n\n'),
  audioUrlEn: '',
  audioStatusEn: 'missing',
  audioSourceEn: 'unknown',
  audioUrlCy: '',
  audioStatusCy: 'missing',
  audioSourceCy: 'unknown',
  version: DEFAULT_FOUNDATIONS_INTRO_VERSION,
  seenKey: ''
};

export function createEmptyCollectionIntroContent(): WordListCollectionIntroContent {
  return {
    enabled: false,
    titleEn: '',
    titleCy: '',
    bodyEn: '',
    bodyCy: '',
    audioUrlEn: '',
    audioStatusEn: 'missing',
    audioSourceEn: 'unknown',
    audioUrlCy: '',
    audioStatusCy: 'missing',
    audioSourceCy: 'unknown',
    version: '',
    seenKey: ''
  };
}

export function createDefaultFoundationsIntroContent(): WordListCollectionIntroContent {
  return { ...DEFAULT_FOUNDATIONS_INTRO };
}

export function normalizeCollectionIntroContent(value: unknown, collectionId = ''): WordListCollectionIntroContent {
  const fallback = collectionId === WELSH_FOUNDATIONS_COLLECTION_ID
    ? createDefaultFoundationsIntroContent()
    : createEmptyCollectionIntroContent();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const record = value as Record<string, unknown>;
  const titleEn = draftString(record.titleEn ?? record.title_en ?? record.introTitleEn ?? record.intro_title_en);
  const bodyEn = draftString(record.bodyEn ?? record.body_en ?? record.introBodyEn ?? record.intro_body_en);
  const normalized = {
    enabled: typeof record.enabled === 'boolean' ? record.enabled : record.introEnabled === false ? false : fallback.enabled,
    titleEn: titleEn || fallback.titleEn,
    titleCy: draftString(record.titleCy ?? record.title_cy ?? record.introTitleCy ?? record.intro_title_cy),
    bodyEn: bodyEn || fallback.bodyEn,
    bodyCy: draftString(record.bodyCy ?? record.body_cy ?? record.introBodyCy ?? record.intro_body_cy),
    audioUrlEn: draftString(record.audioUrlEn ?? record.audio_url_en ?? record.introAudioUrlEn ?? record.intro_audio_url_en ?? record.audioUrl ?? record.audio_url ?? record.introAudioUrl ?? record.intro_audio_url),
    audioStatusEn: normalizeIntroAudioStatus(record.audioStatusEn ?? record.audio_status_en ?? record.introAudioStatusEn ?? record.intro_audio_status_en ?? record.audioStatus ?? record.audio_status ?? record.introAudioStatus ?? record.intro_audio_status),
    audioSourceEn: normalizeIntroAudioSource(record.audioSourceEn ?? record.audio_source_en ?? record.introAudioSourceEn ?? record.intro_audio_source_en ?? record.audioSource ?? record.audio_source ?? record.introAudioSource ?? record.intro_audio_source),
    audioUrlCy: draftString(record.audioUrlCy ?? record.audio_url_cy ?? record.introAudioUrlCy ?? record.intro_audio_url_cy),
    audioStatusCy: normalizeIntroAudioStatus(record.audioStatusCy ?? record.audio_status_cy ?? record.introAudioStatusCy ?? record.intro_audio_status_cy),
    audioSourceCy: normalizeIntroAudioSource(record.audioSourceCy ?? record.audio_source_cy ?? record.introAudioSourceCy ?? record.intro_audio_source_cy),
    version: draftString(record.version ?? record.introVersion ?? record.intro_version) || fallback.version || DEFAULT_FOUNDATIONS_INTRO_VERSION,
    seenKey: draftString(record.seenKey ?? record.seen_key ?? record.introSeenKey ?? record.intro_seen_key)
  };
  return {
    ...normalized,
    seenKey: normalized.seenKey || createCollectionIntroSeenKey(collectionId, normalized.version)
  };
}

export function toCollectionIntroStorage(content: WordListCollectionIntroContent, collectionId = ''): WordListCollectionIntroContent {
  const normalized = normalizeCollectionIntroContent(content, collectionId);
  const version = normalized.version.trim() || DEFAULT_FOUNDATIONS_INTRO_VERSION;
  return {
    enabled: normalized.enabled === true,
    titleEn: normalized.titleEn.trim(),
    titleCy: normalized.titleCy.trim(),
    bodyEn: normalized.bodyEn.trim(),
    bodyCy: normalized.bodyCy.trim(),
    audioUrlEn: normalized.audioUrlEn.trim(),
    audioStatusEn: normalizeIntroAudioStatus(normalized.audioStatusEn),
    audioSourceEn: normalizeIntroAudioSource(normalized.audioSourceEn),
    audioUrlCy: normalized.audioUrlCy.trim(),
    audioStatusCy: normalizeIntroAudioStatus(normalized.audioStatusCy),
    audioSourceCy: normalizeIntroAudioSource(normalized.audioSourceCy),
    version,
    seenKey: normalized.seenKey.trim() || createCollectionIntroSeenKey(collectionId, version)
  };
}

export function getCollectionIntro(collection: Pick<WordListCollection, 'id' | 'introContent'> | null | undefined, interfaceLanguage: InterfaceLanguage): CollectionIntro | null {
  if (!collection) return null;
  const content = normalizeCollectionIntroContent(collection.introContent, collection.id);
  if (!content.enabled) return null;
  const hasCompleteWelshText = Boolean(content.titleCy.trim() && content.bodyCy.trim());
  const displayLanguage = interfaceLanguage === 'cy' && hasCompleteWelshText ? 'cy' : 'en';
  const title = displayLanguage === 'cy' ? content.titleCy.trim() : content.titleEn.trim() || content.titleCy.trim();
  const body = displayLanguage === 'cy' ? content.bodyCy.trim() : content.bodyEn.trim() || content.bodyCy.trim();
  if (!title || !body) return null;
  const audioUrl = displayLanguage === 'cy' ? content.audioUrlCy.trim() : content.audioUrlEn.trim();
  const audioStatus = displayLanguage === 'cy' ? content.audioStatusCy : content.audioStatusEn;
  const audioSource = displayLanguage === 'cy' ? content.audioSourceCy : content.audioSourceEn;
  return {
    collectionId: collection.id,
    title,
    body,
    displayLanguage,
    audioUrl: audioStatus === 'ready' ? audioUrl || undefined : undefined,
    audioStatus,
    audioSource,
    version: content.version,
    seenKey: content.seenKey || createCollectionIntroSeenKey(collection.id, content.version)
  };
}

export function getCollectionIntroForPracticeStart(list: WordList | null | undefined, interfaceLanguage: InterfaceLanguage) {
  return getCollectionIntro(list?.collection, interfaceLanguage);
}

export function getCollectionIntroAudioGenerationText(content: WordListCollectionIntroContent, language: 'en' | 'cy') {
  const normalized = normalizeCollectionIntroContent(content);
  const title = language === 'cy' ? normalized.titleCy : normalized.titleEn;
  const body = language === 'cy' ? normalized.bodyCy : normalized.bodyEn;
  return [title, body]
    .map(part => part.trim())
    .filter(Boolean)
    .join('\n\n');
}

export function hasSeenCollectionIntro(intro: Pick<CollectionIntro, 'seenKey'>) {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(intro.seenKey) === 'seen';
  } catch {
    return false;
  }
}

export function markCollectionIntroSeen(intro: Pick<CollectionIntro, 'seenKey'>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(intro.seenKey, 'seen');
  } catch {
    // Local storage can be unavailable in private or locked-down browsing modes.
  }
}

export function clearCollectionIntroSeenState(storage: Storage | null = typeof window === 'undefined' ? null : window.localStorage) {
  if (!storage) return;

  try {
    const keysToRemove: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(COLLECTION_INTRO_SEEN_KEY_PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach(key => storage.removeItem(key));
  } catch {
    // Local storage should never block resetting learner progress.
  }
}

function createCollectionIntroSeenKey(collectionId: string, version: string) {
  return `${COLLECTION_INTRO_SEEN_KEY_PREFIX}${collectionId || 'collection'}:${version || DEFAULT_FOUNDATIONS_INTRO_VERSION}`;
}

function normalizeIntroAudioStatus(value: unknown): PrimerAudioStatus {
  return value === 'queued' || value === 'generating' || value === 'ready' || value === 'failed' ? value : 'missing';
}

function normalizeIntroAudioSource(value: unknown): PrimerAudioSource {
  return value === 'azure' || value === 'elevenlabs' || value === 'manual' ? value : 'unknown';
}

function draftString(value: unknown) {
  return typeof value === 'string' ? value : '';
}
