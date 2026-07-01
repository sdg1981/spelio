import { getResolvedPracticeAudioUrl, type DefaultAudioProvider, type ElevenLabsAudioStatus } from '../audioProvider';
import type { Translate } from '../../i18n';

export type AudioStatus = 'missing' | 'queued' | 'generating' | 'ready' | 'failed';

export interface AudioAvailabilityInput {
  audioUrl?: string | null;
  audioStatus?: AudioStatus | null;
  elevenLabsAudioUrl?: string | null;
  elevenLabsAudioStatus?: ElevenLabsAudioStatus | null;
}

const RECALL_PAUSE_BASE_DELAY_MS = 2500;
const RECALL_PAUSE_MAX_DELAY_MS = 3400;
const RECALL_PAUSE_WORD_DELAY_MS = 150;
const RECALL_PAUSE_CHARACTER_DELAY_MS = 40;
const RECALL_PAUSE_CHARACTER_THRESHOLD = 8;
const POST_ANSWER_ENGLISH_CONFIRMATION_BASE_DELAY_MS = 1200;
const POST_ANSWER_ENGLISH_CONFIRMATION_WORD_DELAY_MS = 150;
const POST_ANSWER_ENGLISH_CONFIRMATION_MAX_DELAY_MS = 2000;

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

export function isBrowserOffline(navigatorLike: Pick<Navigator, 'onLine'> | undefined = typeof navigator === 'undefined' ? undefined : navigator) {
  return navigatorLike?.onLine === false;
}

export function getAudioUnavailableStatusText(t: Translate, navigatorLike?: Pick<Navigator, 'onLine'>) {
  return isBrowserOffline(navigatorLike) ? t('practice.audioUnavailableOffline') : t('practice.audioUnavailable');
}

export function shouldAllowAudioPlayback(_audioPrompts: boolean, _forceAudioAvailable = false) {
  return true;
}

export function isAudioUnavailableForPrompt(word: AudioAvailabilityInput, playbackFailed = false, provider?: DefaultAudioProvider) {
  const resolvedAudioUrl = getResolvedPracticeAudioUrl(word, provider);
  const usingElevenLabs = provider === 'elevenlabs' && resolvedAudioUrl === word.elevenLabsAudioUrl?.trim();
  return (
    playbackFailed ||
    !hasPlayableAudioUrl(resolvedAudioUrl) ||
    (!usingElevenLabs && (word.audioStatus === 'missing' || word.audioStatus === 'failed'))
  );
}

export function shouldShowEnglishPrompt(englishVisible: boolean, audioUnavailable: boolean) {
  return englishVisible || audioUnavailable;
}

export function shouldDelayEnglishPrompt(
  settings: { recallPause: boolean; audioPrompts: boolean; englishVisible: boolean },
  word: AudioAvailabilityInput,
  playbackFailed = false,
  provider?: DefaultAudioProvider
) {
  return (
    settings.recallPause === true &&
    settings.audioPrompts === true &&
    settings.englishVisible === true &&
    !isAudioUnavailableForPrompt(word, playbackFailed, provider)
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

export function shouldShowPostAnswerEnglishConfirmation({
  englishVisible,
  practiceTestMode,
  audioUnavailable
}: {
  englishVisible: boolean;
  practiceTestMode: boolean;
  audioUnavailable: boolean;
}) {
  return !englishVisible && !practiceTestMode && !audioUnavailable;
}

export function getPostAnswerEnglishConfirmationDelayMs(prompt: string) {
  const promptWordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const wordDelay = Math.max(0, promptWordCount - 1) * POST_ANSWER_ENGLISH_CONFIRMATION_WORD_DELAY_MS;
  const delay = POST_ANSWER_ENGLISH_CONFIRMATION_BASE_DELAY_MS + wordDelay;

  return Math.min(POST_ANSWER_ENGLISH_CONFIRMATION_MAX_DELAY_MS, Math.max(POST_ANSWER_ENGLISH_CONFIRMATION_BASE_DELAY_MS, delay));
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
