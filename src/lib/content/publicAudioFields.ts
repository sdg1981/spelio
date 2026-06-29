import type { PracticeWord } from '../../data/wordLists';

export type PublicWordAudioStatus = NonNullable<PracticeWord['audioStatus']>;

const validAudioStatuses: PublicWordAudioStatus[] = ['missing', 'queued', 'generating', 'ready', 'failed'];

export function normalizePublicWordAudioStatus(value: unknown): PublicWordAudioStatus {
  if (value === 'generated') return 'ready';
  return validAudioStatuses.includes(value as PublicWordAudioStatus) ? value as PublicWordAudioStatus : 'missing';
}

export function normalizePublicWordAudioFields(row: {
  audio_url?: unknown;
  audioUrl?: unknown;
  audio_status?: unknown;
  audioStatus?: unknown;
}) {
  const audioUrl = row.audio_url ?? row.audioUrl;

  return {
    audioUrl: typeof audioUrl === 'string' ? audioUrl : '',
    audioStatus: normalizePublicWordAudioStatus(row.audio_status ?? row.audioStatus)
  };
}
