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
  label?: unknown;
  text?: unknown;
  audioText?: unknown;
  audioUrl?: unknown;
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

const PRIMER_AUDIO_TEXT_OVERRIDES: Record<string, string> = {
  D: 'da',
  DD: 'hedd',
  F: 'efo',
  FF: 'coffi',
  CH: 'bach',
  LL: 'lle',
  RH: 'rhif',
  TH: 'peth',
  C: 'cath',
  G: 'gardd',
  U: 'du',
  AI: 'tai',
  AE: 'cae',
  WY: 'wy',
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

  const draft = rawPrimerDrafts[listId];
  if (!draft) return null;

  const title = pickLocalizedText(draft, 'primerTitle', interfaceLanguage);
  const body = pickLocalizedText(draft, 'primerBody', interfaceLanguage);
  if (!title || !body) return null;

  return {
    listId,
    title,
    body,
    soundItems: normalizeSoundItems(draft.primerSoundItems ?? draft.primerSoundButtons)
  };
}

export function hasFoundationsPrimer(listOrId: string | Pick<WordList, 'id' | 'primerContent'>) {
  if (typeof listOrId !== 'string' && isDatabasePrimerConfigured(listOrId.primerContent)) return Boolean(normalizeDatabasePrimer(listOrId.id, listOrId.primerContent, 'en'));
  const listId = typeof listOrId === 'string' ? listOrId : listOrId.id;
  return Boolean(rawPrimerDrafts[listId]);
}

function pickLocalizedText(draft: RawPrimerDraft, baseKey: 'primerTitle' | 'primerBody', language: InterfaceLanguage) {
  const localizedKey = `${baseKey}${language === 'cy' ? 'Cy' : 'En'}` as keyof RawPrimerDraft;
  const localized = asNonEmptyString(draft[localizedKey]);
  return localized ?? asNonEmptyString(draft[baseKey]) ?? '';
}

function normalizeSoundItems(value: unknown): PrimerSoundItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    const normalized = normalizeSoundItem(item, index);
    return normalized ? [normalized] : [];
  });
}

function normalizeSoundItem(item: RawPrimerSoundItem, index: number): PrimerSoundItem | null {
  if (typeof item === 'string') {
    const label = item.trim();
    return label ? createPrimerSoundItem({ id: createSoundItemId(label, index), label, textToSpeak: getPrimerAudioText(label), order: index + 1 }) : null;
  }

  if (!item || typeof item !== 'object') return null;
  const label = asNonEmptyString(item.label);
  if (!label) return null;

  return createPrimerSoundItem({
    id: createSoundItemId(label, index),
    label,
    textToSpeak: asNonEmptyString(item.audioText) ?? asNonEmptyString(item.text) ?? getPrimerAudioText(label),
    audioUrl: asNonEmptyString(item.audioUrl) ?? '',
    order: index + 1
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
    titleEn: asString(record.titleEn ?? record.title_en),
    titleCy: asString(record.titleCy ?? record.title_cy),
    bodyEn: asString(record.bodyEn ?? record.body_en),
    bodyCy: asString(record.bodyCy ?? record.body_cy),
    soundItems: normalizeDatabaseSoundItems(record.soundItems ?? record.sound_items)
  };
}

export function createPrimerSoundItem(input: Partial<WordListPrimerSoundItem> & { label: string }): PrimerSoundItem {
  const label = input.label.trim();
  const id = (input.id || input.key || createSoundItemId(label || 'sound', input.order ? input.order - 1 : 0)).trim();
  const textToSpeak = (input.textToSpeak || getPrimerAudioText(label)).trim();
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
        textToSpeak: item.textToSpeak.trim() || getPrimerAudioText(item.label),
        audioUrl: item.audioUrl.trim(),
        audioStatus: normalizePrimerAudioStatus(item.audioStatus),
        audioSource: normalizePrimerAudioSource(item.audioSource),
        order: index + 1
      }))
      .filter(item => item.label)
  };
}

function normalizeDatabasePrimer(listId: string, content: WordListPrimerContent | null | undefined, interfaceLanguage: InterfaceLanguage): FoundationsPrimer | null {
  const primer = normalizePrimerContent(content);
  if (!primer.enabled) return null;
  const title = interfaceLanguage === 'cy' ? primer.titleCy || primer.titleEn : primer.titleEn || primer.titleCy;
  const body = interfaceLanguage === 'cy' ? primer.bodyCy || primer.bodyEn : primer.bodyEn || primer.bodyCy;
  if (!title || !body) return null;

  return {
    listId,
    title,
    body,
    soundItems: primer.soundItems
      .map((item, index) => createPrimerSoundItem({ ...item, order: item.order || index + 1 }))
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
  };
}

function isDatabasePrimerConfigured(content: WordListPrimerContent | null | undefined) {
  const primer = normalizePrimerContent(content);
  return (
    primer.enabled ||
    Boolean(primer.titleEn || primer.titleCy || primer.bodyEn || primer.bodyCy || primer.soundItems.length)
  );
}

function normalizeDatabaseSoundItems(value: unknown): WordListPrimerSoundItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    const label = asString(record.label);
    if (!label) return [];
    const id = asString(record.id) || asString(record.key) || createSoundItemId(label, index);
    return [{
      id,
      key: asString(record.key) || id,
      label,
      labelCy: asString(record.labelCy ?? record.label_cy),
      textToSpeak: asString(record.textToSpeak ?? record.text_to_speak ?? record.generationText ?? record.generation_text ?? record.audioText) || getPrimerAudioText(label),
      audioUrl: asString(record.audioUrl ?? record.audio_url),
      audioStatus: normalizePrimerAudioStatus(record.audioStatus ?? record.audio_status),
      audioSource: normalizePrimerAudioSource(record.audioSource ?? record.audio_source),
      order: numberOrFallback(record.order ?? record.order_index, index + 1)
    }];
  }).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
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
