import foundationsContent from '../../data-exports/spelio_welsh_foundations_content.json';
import type { WordList, WordListPrimerContent, WordListPrimerSoundItem, PrimerAudioSource, PrimerAudioStatus } from '../data/wordLists';
import type { InterfaceLanguage } from '../i18n';

export type PrimerSoundItem = {
  id: string;
  key: string;
  label: string;
  labelCy?: string;
  audioText: string;
  textToSpeak: string;
  audioUrl?: string;
  audioStatus: PrimerAudioStatus;
  audioSource: PrimerAudioSource;
  order: number;
};

export type FoundationsPrimer = {
  listId: string;
  title: string;
  body: string;
  soundItems: PrimerSoundItem[];
};

type RawPrimerSoundItem = string | {
  id?: unknown;
  key?: unknown;
  label?: unknown;
  labelCy?: unknown;
  label_cy?: unknown;
  text?: unknown;
  textToSpeak?: unknown;
  text_to_speak?: unknown;
  audioText?: unknown;
  generationText?: unknown;
  generation_text?: unknown;
  audioUrl?: unknown;
  audio_url?: unknown;
  audioStatus?: unknown;
  audio_status?: unknown;
  audioSource?: unknown;
  audio_source?: unknown;
  order?: unknown;
  order_index?: unknown;
};

type RawPrimerDraft = {
  primerTitle?: unknown;
  primerTitleEn?: unknown;
  primerTitleCy?: unknown;
  primerBody?: unknown;
  primerBodyEn?: unknown;
  primerBodyCy?: unknown;
  primerSoundButtons?: unknown;
  primerSoundItems?: unknown;
};

const rawPrimerDrafts = (foundationsContent as { primerDrafts?: Record<string, RawPrimerDraft> }).primerDrafts ?? {};
const rawPrimerContentByListId = new Map(
  ((foundationsContent as { lists?: Array<{ id?: unknown; primerContent?: unknown; primer_content?: unknown }> }).lists ?? [])
    .map(list => [asString(list.id), normalizePrimerContent(list.primerContent ?? list.primer_content)] as const)
    .filter(([listId, primerContent]) => Boolean(listId) && isDatabasePrimerConfigured(primerContent))
);

const LEGACY_PRIMER_LIST_IDS: Record<string, string> = {
  foundation_patterns_mixed_confidence_1: 'foundation_patterns_mixed_confidence_1_revised',
  foundation_patterns_mixed_confidence_2: 'foundation_patterns_mixed_confidence_2_revised',
  foundation_patterns_mixed_confidence_3: 'foundation_patterns_mixed_confidence_3_revised',
  foundation_patterns_mixed_confidence_4: 'foundation_patterns_mixed_confidence_4_revised'
};

const PRIMER_AUDIO_TEXT_OVERRIDES: Record<string, string> = {
  D: 'da',
  DD: 'hedd',
  F: 'efo',
  FF: 'coffi',
  CH: 'bach',
  LL: 'lle',
  RH: 'rhad',
  TH: 'peth',
  C: 'cath',
  G: 'gardd',
  U: 'du',
  AI: 'tai',
  AE: 'cae',
  WY: 'mwyn',
  YW: 'yw',
  OE: 'oer',
  AU: 'haul',
  AW: 'mawr',
  'Y (FINAL SYLLABLE)': 'gwely',
  'Y (EARLIER SYLLABLE)': 'byd',
  'W AS A VOWEL': 'cwm',
  'W BEFORE A VOWEL': 'wedi'
};

export function getFoundationsPrimer(listOrId: string | Pick<WordList, 'id' | 'primerContent'>, interfaceLanguage: InterfaceLanguage = 'en'): FoundationsPrimer | null {
  const listId = typeof listOrId === 'string' ? listOrId : listOrId.id;
  if (typeof listOrId !== 'string' && isDatabasePrimerConfigured(listOrId.primerContent)) {
    return normalizeDatabasePrimer(listOrId.id, listOrId.primerContent, interfaceLanguage);
  }

  const fallbackListId = resolveFallbackPrimerListId(listId);
  const draft = rawPrimerDrafts[fallbackListId];
  if (!draft) {
    const primerContent = rawPrimerContentByListId.get(fallbackListId);
    return primerContent ? normalizeDatabasePrimer(listId, primerContent, interfaceLanguage) : null;
  }

  const title = pickLocalizedText(draft, 'primerTitle', interfaceLanguage);
  const body = pickLocalizedText(draft, 'primerBody', interfaceLanguage);
  if (!title || !body) return null;

  return {
    listId,
    title,
    body,
    soundItems: localizePrimerSoundItems(
      normalizeDraftSoundItems(draft.primerSoundItems ?? draft.primerSoundButtons),
      interfaceLanguage
    )
  };
}

export function hasFoundationsPrimer(listOrId: string | Pick<WordList, 'id' | 'primerContent'>) {
  if (typeof listOrId !== 'string' && isDatabasePrimerConfigured(listOrId.primerContent)) return Boolean(normalizeDatabasePrimer(listOrId.id, listOrId.primerContent, 'en'));
  const listId = typeof listOrId === 'string' ? listOrId : listOrId.id;
  const fallbackListId = resolveFallbackPrimerListId(listId);
  return Boolean(rawPrimerDrafts[fallbackListId] || rawPrimerContentByListId.has(fallbackListId));
}

function resolveFallbackPrimerListId(listId: string) {
  return rawPrimerDrafts[listId] || rawPrimerContentByListId.has(listId)
    ? listId
    : LEGACY_PRIMER_LIST_IDS[listId] ?? listId;
}

function pickLocalizedText(draft: RawPrimerDraft, baseKey: 'primerTitle' | 'primerBody', language: InterfaceLanguage) {
  const localizedKey = `${baseKey}${language === 'cy' ? 'Cy' : 'En'}` as keyof RawPrimerDraft;
  const localized = asNonEmptyString(draft[localizedKey]);
  return localized ?? asNonEmptyString(draft[baseKey]) ?? '';
}

export function createPrimerContentFromDraft(listId: string, draftValue: unknown): WordListPrimerContent | null {
  if (!draftValue || typeof draftValue !== 'object' || Array.isArray(draftValue)) return null;
  const draft = draftValue as RawPrimerDraft;
  return toPrimerContentStorage({
    enabled: true,
    titleEn: pickLocalizedText(draft, 'primerTitle', 'en'),
    titleCy: asString(draft.primerTitleCy),
    bodyEn: pickLocalizedText(draft, 'primerBody', 'en'),
    bodyCy: asString(draft.primerBodyCy),
    soundItems: normalizeDraftSoundItems(draft.primerSoundItems ?? draft.primerSoundButtons).map((item, index) => ({
      ...item,
      id: item.id || item.key || createSoundItemId(item.label || `${listId}-sound`, index),
      key: item.key || item.id || createSoundItemId(item.label || `${listId}-sound`, index),
      audioUrl: item.audioUrl || '',
      order: item.order || index + 1
    }))
  });
}

function normalizeDraftSoundItems(value: unknown): PrimerSoundItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    const normalized = normalizeDraftSoundItem(item, index);
    return normalized ? [normalized] : [];
  });
}

function normalizeDraftSoundItem(item: RawPrimerSoundItem, index: number): PrimerSoundItem | null {
  if (typeof item === 'string') {
    const label = item.trim();
    return label ? createPrimerSoundItem({ id: createSoundItemId(label, index), label, textToSpeak: getPrimerAudioText(label), order: index + 1 }) : null;
  }

  if (!item || typeof item !== 'object') return null;
  const label = asNonEmptyString(item.label);
  if (!label) return null;

  return createPrimerSoundItem({
    id: asString(item.id) || asString(item.key) || createSoundItemId(label, index),
    key: asString(item.key) || asString(item.id) || createSoundItemId(label, index),
    label,
    labelCy: asString(item.labelCy ?? item.label_cy),
    textToSpeak: asNonEmptyString(item.textToSpeak ?? item.text_to_speak ?? item.generationText ?? item.generation_text ?? item.audioText ?? item.text) ?? getPrimerAudioText(label),
    audioUrl: asString(item.audioUrl ?? item.audio_url),
    audioStatus: normalizePrimerAudioStatus(item.audioStatus ?? item.audio_status),
    audioSource: normalizePrimerAudioSource(item.audioSource ?? item.audio_source),
    order: numberOrFallback(item.order ?? item.order_index, index + 1)
  });
}

export function getPrimerAudioText(label: string) {
  return PRIMER_AUDIO_TEXT_OVERRIDES[label.trim().toUpperCase()] ?? label.trim();
}

export function createEmptyPrimerContent(): WordListPrimerContent {
  return {
    enabled: false,
    titleEn: '',
    titleCy: '',
    bodyEn: '',
    bodyCy: '',
    soundItems: []
  };
}

export function normalizePrimerContent(value: unknown): WordListPrimerContent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return createEmptyPrimerContent();
  const record = value as Record<string, unknown>;
  return {
    enabled: record.enabled === true,
    titleEn: asDraftString(record.titleEn ?? record.title_en ?? record.primerTitleEn ?? record.primer_title_en ?? record.primerTitle ?? record.primer_title),
    titleCy: asDraftString(record.titleCy ?? record.title_cy ?? record.primerTitleCy ?? record.primer_title_cy),
    bodyEn: asDraftString(record.bodyEn ?? record.body_en ?? record.primerBodyEn ?? record.primer_body_en ?? record.primerBody ?? record.primer_body),
    bodyCy: asDraftString(record.bodyCy ?? record.body_cy ?? record.primerBodyCy ?? record.primer_body_cy),
    soundItems: normalizeDatabaseSoundItems(record.soundItems ?? record.sound_items ?? record.primerSoundItems ?? record.primer_sound_items ?? record.primerSoundButtons ?? record.primer_sound_buttons)
  };
}

export function createPrimerSoundItem(input: Partial<WordListPrimerSoundItem>): PrimerSoundItem {
  const label = (input.label ?? '').trim();
  const id = (input.id || input.key || createSoundItemId(label || 'sound', input.order ? input.order - 1 : 0)).trim();
  const textToSpeak = input.textToSpeak === undefined ? getPrimerAudioText(label) : input.textToSpeak.trim();
  return {
    id,
    key: (input.key || id).trim(),
    label,
    labelCy: input.labelCy?.trim() || undefined,
    audioText: textToSpeak,
    textToSpeak,
    audioUrl: input.audioUrl?.trim() || undefined,
    audioStatus: normalizePrimerAudioStatus(input.audioStatus),
    audioSource: normalizePrimerAudioSource(input.audioSource),
    order: typeof input.order === 'number' && Number.isFinite(input.order) ? input.order : 0
  };
}

export function toPrimerContentStorage(content: WordListPrimerContent): WordListPrimerContent {
  return {
    enabled: content.enabled === true,
    titleEn: content.titleEn.trim(),
    titleCy: content.titleCy.trim(),
    bodyEn: content.bodyEn.trim(),
    bodyCy: content.bodyCy.trim(),
    soundItems: content.soundItems
      .map((item, index) => ({
        id: item.id.trim() || item.key.trim() || createSoundItemId(item.label, index),
        key: item.key.trim() || item.id.trim() || createSoundItemId(item.label, index),
        label: item.label.trim(),
        labelCy: item.labelCy?.trim() || '',
        textToSpeak: item.textToSpeak.trim(),
        audioUrl: item.audioUrl?.trim() || '',
        audioStatus: normalizePrimerAudioStatus(item.audioStatus),
        audioSource: normalizePrimerAudioSource(item.audioSource),
        order: index + 1
      }))
  };
}

function normalizeDatabasePrimer(listId: string, content: WordListPrimerContent | null | undefined, interfaceLanguage: InterfaceLanguage): FoundationsPrimer | null {
  const primer = normalizePrimerContent(content);
  if (!primer.enabled) return null;
  const title = interfaceLanguage === 'cy' ? primer.titleCy.trim() || primer.titleEn.trim() : primer.titleEn.trim() || primer.titleCy.trim();
  const body = interfaceLanguage === 'cy' ? primer.bodyCy.trim() || primer.bodyEn.trim() : primer.bodyEn.trim() || primer.bodyCy.trim();
  if (!title || !body) return null;

  return {
    listId,
    title,
    body,
    soundItems: localizePrimerSoundItems(primer.soundItems, interfaceLanguage)
      .filter(item => item.label.trim())
      .map((item, index) => createPrimerSoundItem({ ...item, order: item.order || index + 1 }))
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
  };
}

function isDatabasePrimerConfigured(content: WordListPrimerContent | null | undefined) {
  const primer = normalizePrimerContent(content);
  return (
    primer.enabled ||
    Boolean(primer.titleEn.trim() || primer.titleCy.trim() || primer.bodyEn.trim() || primer.bodyCy.trim() || primer.soundItems.length)
  );
}

function normalizeDatabaseSoundItems(value: unknown): WordListPrimerSoundItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    const label = asDraftString(record.label);
    const id = asDraftString(record.id) || asDraftString(record.key) || createSoundItemId(label.trim() || 'sound', index);
    if (!label && !id) return [];
    return [{
      id,
      key: asDraftString(record.key) || id,
      label,
      labelCy: asDraftString(record.labelCy ?? record.label_cy),
      textToSpeak: asDraftString(record.textToSpeak ?? record.text_to_speak ?? record.generationText ?? record.generation_text ?? record.audioText) || getPrimerAudioText(label),
      audioUrl: asDraftString(record.audioUrl ?? record.audio_url),
      audioStatus: normalizePrimerAudioStatus(record.audioStatus ?? record.audio_status),
      audioSource: normalizePrimerAudioSource(record.audioSource ?? record.audio_source),
      order: numberOrFallback(record.order ?? record.order_index, index + 1)
    }];
  }).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}

function localizePrimerSoundItems<T extends { label: string; labelCy?: string }>(items: T[], interfaceLanguage: InterfaceLanguage): T[] {
  return items.map(item => {
    const localizedLabel = interfaceLanguage === 'cy' ? item.labelCy?.trim() || item.label : item.label;
    return {
      ...item,
      label: localizedLabel
    };
  });
}

function normalizePrimerAudioStatus(value: unknown): PrimerAudioStatus {
  return value === 'queued' || value === 'generating' || value === 'ready' || value === 'failed' ? value : 'missing';
}

function normalizePrimerAudioSource(value: unknown): PrimerAudioSource {
  return value === 'azure' || value === 'elevenlabs' || value === 'manual' ? value : 'unknown';
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asDraftString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function numberOrFallback(value: unknown, fallback: number) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function asNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function createSoundItemId(label: string, index: number) {
  return `${index}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}
