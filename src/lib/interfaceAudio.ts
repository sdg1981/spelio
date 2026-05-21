import type { InterfaceLanguage } from '../i18n';
import { getPlayableAudioUrl } from './audioPlayback';

export type InterfaceAudioStatus = 'missing' | 'ready' | 'failed';
export type InterfaceAudioProvider = 'azure' | 'elevenlabs' | 'manual' | 'unknown';
export type InterfaceAudioClipKey = 'practice_struggle_assist';

export interface InterfaceAudioClip {
  key: InterfaceAudioClipKey;
  language: InterfaceLanguage;
  text: string;
  audioUrl: string;
  audioStatus: InterfaceAudioStatus;
  provider: InterfaceAudioProvider;
  updatedAt: string;
}

export type InterfaceAudioClipRegistry = Partial<Record<InterfaceAudioClipKey, Partial<Record<InterfaceLanguage, InterfaceAudioClip>>>>;

export const PRACTICE_STRUGGLE_ASSIST_AUDIO_KEY: InterfaceAudioClipKey = 'practice_struggle_assist';

export const PRACTICE_STRUGGLE_ASSIST_SCRIPTS: Record<InterfaceLanguage, string> = {
  en: 'You can replay the word, or reveal a letter if you need a little help.',
  cy: 'Gallwch wrando eto, neu ddatgelu llythyren os oes angen help bach.'
};

export function createDefaultInterfaceAudioClips(updatedAt = ''): InterfaceAudioClip[] {
  return (Object.keys(PRACTICE_STRUGGLE_ASSIST_SCRIPTS) as InterfaceLanguage[]).map(language => ({
    key: PRACTICE_STRUGGLE_ASSIST_AUDIO_KEY,
    language,
    text: PRACTICE_STRUGGLE_ASSIST_SCRIPTS[language],
    audioUrl: '',
    audioStatus: 'missing',
    provider: 'manual',
    updatedAt
  }));
}

export function normalizeInterfaceAudioStatus(value: unknown): InterfaceAudioStatus {
  return value === 'ready' || value === 'failed' ? value : 'missing';
}

export function normalizeInterfaceAudioProvider(value: unknown): InterfaceAudioProvider {
  if (value === 'azure' || value === 'elevenlabs' || value === 'manual') return value;
  return 'unknown';
}

export function normalizeInterfaceAudioClips(value: unknown): InterfaceAudioClip[] {
  const rows = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && Array.isArray((value as { clips?: unknown }).clips)
      ? (value as { clips: unknown[] }).clips
      : [];
  const clips: InterfaceAudioClip[] = [];

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const source = row as Record<string, unknown>;
    if (source.key !== PRACTICE_STRUGGLE_ASSIST_AUDIO_KEY) continue;
    const language = source.language === 'cy' ? 'cy' : source.language === 'en' ? 'en' : null;
    if (!language) continue;

    const audioUrl = typeof source.audioUrl === 'string'
      ? source.audioUrl
      : typeof source.audio_url === 'string'
        ? source.audio_url
        : '';
    const updatedAt = typeof source.updatedAt === 'string'
      ? source.updatedAt
      : typeof source.updated_at === 'string'
        ? source.updated_at
        : '';

    clips.push({
      key: PRACTICE_STRUGGLE_ASSIST_AUDIO_KEY,
      language,
      text: typeof source.text === 'string' && source.text.trim()
        ? source.text
        : PRACTICE_STRUGGLE_ASSIST_SCRIPTS[language],
      audioUrl,
      audioStatus: normalizeInterfaceAudioStatus(source.audioStatus ?? source.audio_status),
      provider: normalizeInterfaceAudioProvider(source.provider),
      updatedAt
    });
  }

  return mergeInterfaceAudioClipsWithDefaults(clips);
}

export function createInterfaceAudioRegistry(clips: InterfaceAudioClip[]): InterfaceAudioClipRegistry {
  return clips.reduce<InterfaceAudioClipRegistry>((registry, clip) => {
    const keyRegistry = registry[clip.key] ?? {};
    keyRegistry[clip.language] = clip;
    registry[clip.key] = keyRegistry;
    return registry;
  }, {});
}

export function resolveInterfaceAudioClip(
  registry: InterfaceAudioClipRegistry,
  key: InterfaceAudioClipKey,
  language: InterfaceLanguage
) {
  return registry[key]?.[language] ?? registry[key]?.en ?? null;
}

export function getPlayableInterfaceAudioUrl(clip: InterfaceAudioClip | null | undefined) {
  if (!clip || clip.audioStatus !== 'ready') return null;
  return getPlayableAudioUrl(clip.audioUrl);
}

function mergeInterfaceAudioClipsWithDefaults(clips: InterfaceAudioClip[]) {
  const byLanguage = new Map(clips.map(clip => [clip.language, clip]));
  for (const fallback of createDefaultInterfaceAudioClips()) {
    if (!byLanguage.has(fallback.language)) byLanguage.set(fallback.language, fallback);
  }
  return Array.from(byLanguage.values());
}
