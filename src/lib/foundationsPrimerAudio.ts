import { getPlayableAudioUrl } from './audioPlayback';
import { createWelshAzureTtsRequestPayload, getAzureTtsRoute } from './azureTtsRequest';

let currentPrimerAudio: HTMLAudioElement | null = null;
const primerAudioCache = new Map<string, HTMLAudioElement>();
const generatedPrimerAudioCache = new Map<string, { audio: HTMLAudioElement; objectUrl: string }>();
const generatedPrimerAudioPromises = new Map<string, Promise<HTMLAudioElement | null>>();
const preloadedPrimerAudioUrls = new Set<string>();
const preloadedPrimerTextKeys = new Set<string>();

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

export function preloadPrimerSounds(items: PrimerSoundPlaybackItem[]) {
  items.forEach(item => {
    const playableUrl = getStoredPrimerAudioUrl(item);
    if (playableUrl) {
      if (preloadedPrimerAudioUrls.has(playableUrl)) return;

      const audio = getCachedPrimerAudio(playableUrl);
      preloadedPrimerAudioUrls.add(playableUrl);
      try {
        audio.load();
      } catch {
        // Browsers can reject eager media loading. Playback will retry on click.
      }
      return;
    }

    const text = getPrimerSoundText(item);
    const cacheKey = getGeneratedPrimerAudioCacheKey(text);
    if (!text || preloadedPrimerTextKeys.has(cacheKey)) return;

    preloadedPrimerTextKeys.add(cacheKey);
    void getCachedGeneratedPrimerAudio(text);
  });
}

export async function playPrimerSound(item: PrimerSoundPlaybackItem) {
  const playableUrl = getStoredPrimerAudioUrl(item);
  if (playableUrl) {
    return playStoredPrimerAudioUrl(playableUrl);
  }

  const text = getPrimerSoundText(item);
  if (!text) return false;

  const audio = await getCachedGeneratedPrimerAudio(text);
  return audio ? playPrimerAudioElement(audio) : false;
}

export function clearPrimerAudioCacheForTests() {
  stopCurrentPrimerAudio();
  primerAudioCache.clear();
  generatedPrimerAudioCache.forEach(({ objectUrl }) => URL.revokeObjectURL(objectUrl));
  generatedPrimerAudioCache.clear();
  generatedPrimerAudioPromises.clear();
  preloadedPrimerAudioUrls.clear();
  preloadedPrimerTextKeys.clear();
}

async function playStoredPrimerAudioUrl(playableUrl: string) {
  const audio = getCachedPrimerAudio(playableUrl);
  return playPrimerAudioElement(audio);
}

function getCachedPrimerAudio(playableUrl: string) {
  const cached = primerAudioCache.get(playableUrl);
  if (cached) return cached;

  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = playableUrl;
  primerAudioCache.set(playableUrl, audio);
  return audio;
}

async function getCachedGeneratedPrimerAudio(text: string) {
  const cacheKey = getGeneratedPrimerAudioCacheKey(text);
  const cached = generatedPrimerAudioCache.get(cacheKey);
  if (cached) return cached.audio;

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
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = objectUrl;
  generatedPrimerAudioCache.set(getGeneratedPrimerAudioCacheKey(text), { audio, objectUrl });

  try {
    audio.load();
  } catch {
    // Playback on click will retry if eager loading was rejected.
  }

  return audio;
}

async function playPrimerAudioElement(audio: HTMLAudioElement) {
  stopCurrentPrimerAudio();
  currentPrimerAudio = audio;
  audio.onended = () => {
    if (currentPrimerAudio === audio) currentPrimerAudio = null;
  };
  try {
    audio.currentTime = 0;
  } catch {
    // Some browsers can throw while resetting an unloaded audio element.
  }

  try {
    await audio.play();
    return true;
  } catch {
    if (currentPrimerAudio === audio) stopCurrentPrimerAudio();
    return false;
  }
}

function stopCurrentPrimerAudio() {
  if (currentPrimerAudio) {
    currentPrimerAudio.pause();
    currentPrimerAudio = null;
  }
}

function getPrimerSoundText(item: PrimerSoundPlaybackItem) {
  return (item.textToSpeak || item.audioText || '').trim();
}

function getGeneratedPrimerAudioCacheKey(text: string) {
  return text.trim().toLocaleLowerCase('cy');
}
