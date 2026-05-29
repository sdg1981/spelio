import foundationsContent from '../../data-exports/spelio_welsh_foundations_content.json';
import type { InterfaceLanguage } from '../i18n';

export type PrimerSoundItem = {
  id: string;
  label: string;
  audioText: string;
  audioUrl?: string;
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

export function getFoundationsPrimer(listId: string, interfaceLanguage: InterfaceLanguage = 'en'): FoundationsPrimer | null {
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

export function hasFoundationsPrimer(listId: string) {
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
    return label ? { id: createSoundItemId(label, index), label, audioText: label } : null;
  }

  if (!item || typeof item !== 'object') return null;
  const label = asNonEmptyString(item.label);
  if (!label) return null;

  return {
    id: createSoundItemId(label, index),
    label,
    audioText: asNonEmptyString(item.audioText) ?? asNonEmptyString(item.text) ?? label,
    audioUrl: asNonEmptyString(item.audioUrl) ?? undefined
  };
}

function asNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function createSoundItemId(label: string, index: number) {
  return `${index}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}
