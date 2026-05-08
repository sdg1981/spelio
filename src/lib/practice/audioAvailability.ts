export type AudioStatus = 'missing' | 'queued' | 'generating' | 'ready' | 'failed';

export interface AudioAvailabilityInput {
  audioUrl?: string | null;
  audioStatus?: AudioStatus | null;
}

export function getPlayableAudioUrl(audioUrl?: string | null) {
  const candidate = audioUrl?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export function hasPlayableAudioUrl(audioUrl?: string | null) {
  return getPlayableAudioUrl(audioUrl) !== null;
}

export function isAudioUnavailableForPrompt(word: AudioAvailabilityInput, playbackFailed = false) {
  return (
    playbackFailed ||
    word.audioStatus === 'missing' ||
    word.audioStatus === 'failed' ||
    !hasPlayableAudioUrl(word.audioUrl)
  );
}

export function shouldShowEnglishPrompt(englishVisible: boolean, audioUnavailable: boolean) {
  return englishVisible || audioUnavailable;
}
