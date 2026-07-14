import type { PracticeWord } from '../data/wordLists';
import type { DefaultAudioProvider } from './audioProvider';
import { getResolvedPracticeAudioUrl } from './audioProvider';
import { createAudioPlaybackController, getPlayableAudioUrl } from './audioPlayback';
import { createWelshAzureTtsRequestPayload, getAzureTtsRoute } from './azureTtsRequest';
import { isAudioUnavailableForPrompt } from './practice/audioAvailability';

const primerAudioPlayback = createAudioPlaybackController();
const generatedPrimerAudioCache = new Map<string, string>();
const generatedPrimerAudioPromises = new Map<string, Promise<string | null>>();

type PrimerSoundPlaybackItem = {
  audioText?: string;
  textToSpeak?: string;
  audioUrl?: string | null;
  audioStatus?: string | null;
};

export function getStoredPrimerAudioUrl(item: PrimerSoundPlaybackItem) {
  if (item.audioStatus && item.audioStatus !== 'ready') return null;
  return getPlayableAudioUrl(item.audioUrl);
}

export function resolvePrimerSoundPracticeAudio<T extends PrimerSoundPlaybackItem>(
  item: T,
  words: PracticeWord[],
  provider: DefaultAudioProvider
): T {
  if (getStoredPrimerAudioUrl(item)) return item;

  const target = getPrimerSoundText(item).toLocaleLowerCase('cy');
  const matchingWord = words.find(word => (
    !isAudioUnavailableForPrompt(word, false, provider) &&
    (
      word.welshAnswer.trim().toLocaleLowerCase('cy') === target ||
      (word.acceptedAlternatives ?? []).some(alternative => alternative.trim().toLocaleLowerCase('cy') === target)
    )
  ));
  const practiceAudioUrl = getPlayableAudioUrl(getResolvedPracticeAudioUrl(matchingWord ?? {}, provider));
  if (!practiceAudioUrl) return item;

  return { ...item, audioUrl: practiceAudioUrl, audioStatus: 'ready' };
}

export async function preloadPrimerSounds(items: PrimerSoundPlaybackItem[]) {
  await Promise.all(items.map(async item => {
    const playableUrl = getStoredPrimerAudioUrl(item);
    if (playableUrl) return;

    const text = getPrimerSoundText(item);
    if (!text) return;

    await getCachedGeneratedPrimerAudio(text);
  }));
}

export async function playPrimerSound(item: PrimerSoundPlaybackItem) {
  const playableUrl = getStoredPrimerAudioUrl(item);
  if (playableUrl) return primerAudioPlayback.playSource(playableUrl);

  const text = getPrimerSoundText(item);
  if (!text) return false;

  const cached = generatedPrimerAudioCache.get(getGeneratedPrimerAudioCacheKey(text));
  if (cached) return primerAudioPlayback.playSource(cached);

  const source = await getCachedGeneratedPrimerAudio(text);
  return source ? primerAudioPlayback.playSource(source) : false;
}

export function clearPrimerAudioCacheForTests() {
  stopPrimerAudio();
  generatedPrimerAudioCache.forEach(objectUrl => URL.revokeObjectURL(objectUrl));
  generatedPrimerAudioCache.clear();
  generatedPrimerAudioPromises.clear();
}

export function stopPrimerAudio() {
  primerAudioPlayback.stop(true);
}

async function getCachedGeneratedPrimerAudio(text: string) {
  const cacheKey = getGeneratedPrimerAudioCacheKey(text);
  const cached = generatedPrimerAudioCache.get(cacheKey);
  if (cached) return cached;

  const pending = generatedPrimerAudioPromises.get(cacheKey);
  if (pending) return pending;

  const promise = fetchGeneratedPrimerAudio(text)
    .catch(() => null)
    .finally(() => {
      generatedPrimerAudioPromises.delete(cacheKey);
    });
  generatedPrimerAudioPromises.set(cacheKey, promise);
  return promise;
}

async function fetchGeneratedPrimerAudio(text: string) {
  if (typeof fetch !== 'function') return null;

  const response = await fetch(getAzureTtsRoute(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createWelshAzureTtsRequestPayload(text))
  });

  if (!response.ok) return null;

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  generatedPrimerAudioCache.set(getGeneratedPrimerAudioCacheKey(text), objectUrl);
  return objectUrl;
}

function getPrimerSoundText(item: PrimerSoundPlaybackItem) {
  return (item.textToSpeak || item.audioText || '').trim();
}

function getGeneratedPrimerAudioCacheKey(text: string) {
  return text.trim().toLocaleLowerCase('cy');
}
