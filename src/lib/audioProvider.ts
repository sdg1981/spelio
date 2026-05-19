import type { PracticeWord } from '../data/wordLists';

export type DefaultAudioProvider = 'azure' | 'elevenlabs';
export type ElevenLabsAudioStatus = 'missing' | 'pending' | 'generated' | 'failed';
export type ElevenLabsGenerationMode = 'direct' | 'direct_with_hint' | 'azure_transform' | 'context_extract';
export type AudioReviewStatus = 'unchecked' | 'approved' | 'needs_review' | 'needs_regeneration';

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

export function normalizeElevenLabsGenerationMode(value: unknown): ElevenLabsGenerationMode {
  if (value === 'direct_with_hint') return 'direct_with_hint';
  if (value === 'context_extract') return 'context_extract';
  return value === 'azure_transform' ? 'azure_transform' : 'direct';
}

export function normalizeAudioReviewStatus(value: unknown): AudioReviewStatus {
  if (value === 'approved' || value === 'needs_review' || value === 'needs_regeneration') return value;
  return 'unchecked';
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
