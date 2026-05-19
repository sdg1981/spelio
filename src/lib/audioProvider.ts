import type { PracticeWord } from '../data/wordLists';

export type DefaultAudioProvider = 'azure' | 'elevenlabs';
export type ElevenLabsAudioStatus = 'missing' | 'pending' | 'generated' | 'failed';

export const DEFAULT_AUDIO_PROVIDER: DefaultAudioProvider = 'azure';

export interface AudioProviderWord {
  audioUrl?: string | null;
  audioStatus?: PracticeWord['audioStatus'] | null;
  elevenLabsAudioUrl?: string | null;
  elevenLabsAudioStatus?: ElevenLabsAudioStatus | null;
}

export function normalizeDefaultAudioProvider(value: unknown): DefaultAudioProvider {
  return value === 'elevenlabs' || value === 'ElevenLabs' ? 'elevenlabs' : 'azure';
}

export function normalizeElevenLabsAudioStatus(value: unknown): ElevenLabsAudioStatus {
  if (value === 'pending' || value === 'generated' || value === 'failed') return value;
  return 'missing';
}

export function getResolvedPracticeAudioUrl(
  word: AudioProviderWord,
  provider: DefaultAudioProvider = DEFAULT_AUDIO_PROVIDER
) {
  if (provider === 'elevenlabs' && hasGeneratedElevenLabsAudio(word)) {
    return word.elevenLabsAudioUrl?.trim() || null;
  }

  return word.audioUrl?.trim() || null;
}

export function hasGeneratedElevenLabsAudio(word: AudioProviderWord) {
  return word.elevenLabsAudioStatus === 'generated' && Boolean(word.elevenLabsAudioUrl?.trim());
}
