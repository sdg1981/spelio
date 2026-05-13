export type AudioStatus = 'missing' | 'queued' | 'generating' | 'ready' | 'failed';

export interface AudioAvailabilityInput {
  audioUrl?: string | null;
  audioStatus?: AudioStatus | null;
}

const RECALL_PAUSE_BASE_DELAY_MS = 2500;
const RECALL_PAUSE_MAX_DELAY_MS = 3400;
const RECALL_PAUSE_WORD_DELAY_MS = 150;
const RECALL_PAUSE_CHARACTER_DELAY_MS = 40;
const RECALL_PAUSE_CHARACTER_THRESHOLD = 8;

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

export function shouldDelayEnglishPrompt(
  settings: { recallPause: boolean; audioPrompts: boolean; englishVisible: boolean },
  word: AudioAvailabilityInput,
  playbackFailed = false
) {
  return (
    settings.recallPause === true &&
    settings.audioPrompts === true &&
    settings.englishVisible === true &&
    !isAudioUnavailableForPrompt(word, playbackFailed)
  );
}

export function getEnglishPromptDisplayState({
  basePromptVisible,
  shouldDelay,
  delayedVisible,
  peeking = false
}: {
  basePromptVisible: boolean;
  shouldDelay: boolean;
  delayedVisible: boolean;
  peeking?: boolean;
}) {
  const visible = (basePromptVisible && (!shouldDelay || delayedVisible)) || peeking;
  return {
    visible,
    reserved: basePromptVisible && shouldDelay && !delayedVisible && !peeking
  };
}

export function getRecallPauseDelayMs({
  prompt,
  answer
}: {
  prompt: string;
  answer: string;
}) {
  const promptWordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const answerCharacterCount = answer.replace(/\s/g, '').length;
  const wordDelay = Math.max(0, promptWordCount - 1) * RECALL_PAUSE_WORD_DELAY_MS;
  const characterDelay = Math.max(0, answerCharacterCount - RECALL_PAUSE_CHARACTER_THRESHOLD) * RECALL_PAUSE_CHARACTER_DELAY_MS;
  const delay = RECALL_PAUSE_BASE_DELAY_MS + wordDelay + characterDelay;

  return Math.min(RECALL_PAUSE_MAX_DELAY_MS, Math.max(RECALL_PAUSE_BASE_DELAY_MS, delay));
}
