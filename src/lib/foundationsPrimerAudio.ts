import { getPlayableAudioUrl } from './audioPlayback';

let currentPrimerAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;
const primerAudioCache = new Map<string, HTMLAudioElement>();
const preloadedPrimerAudioUrls = new Set<string>();

type PrimerSoundPlaybackItem = {
  audioText?: string;
  textToSpeak?: string;
  audioUrl?: string | null;
};

export function getStoredPrimerAudioUrl(item: PrimerSoundPlaybackItem) {
  return getPlayableAudioUrl(item.audioUrl);
}

export function preloadPrimerSounds(items: PrimerSoundPlaybackItem[]) {
  items.forEach(item => {
    const playableUrl = getStoredPrimerAudioUrl(item);
    if (!playableUrl || preloadedPrimerAudioUrls.has(playableUrl)) return;

    const audio = getCachedPrimerAudio(playableUrl);
    preloadedPrimerAudioUrls.add(playableUrl);
    try {
      audio.load();
    } catch {
      // Browsers can reject eager media loading. Playback will retry on click.
    }
  });
}

export async function playPrimerSound(item: PrimerSoundPlaybackItem) {
  const playableUrl = getStoredPrimerAudioUrl(item);
  if (playableUrl) {
    return playStoredPrimerAudioUrl(playableUrl);
  }

  const text = (item.textToSpeak || item.audioText || '').trim();
  if (!text) return false;

  const response = await fetch('/api/azure-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language: 'cy' })
  });

  if (!response.ok) return false;

  const blob = await response.blob();
  return playPrimerAudioBlob(blob);
}

export function clearPrimerAudioCacheForTests() {
  stopCurrentPrimerAudio();
  primerAudioCache.clear();
  preloadedPrimerAudioUrls.clear();
}

async function playStoredPrimerAudioUrl(playableUrl: string) {
  stopCurrentPrimerAudio();
  const audio = getCachedPrimerAudio(playableUrl);
  currentPrimerAudio = audio;
  try {
    audio.currentTime = 0;
  } catch {
    // Some browsers can throw while resetting an unloaded audio element.
  }
  audio.onended = () => {
    if (currentPrimerAudio === audio) currentPrimerAudio = null;
  };

  try {
    await audio.play();
    return true;
  } catch {
    if (currentPrimerAudio === audio) currentPrimerAudio = null;
    return false;
  }
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

async function playPrimerAudioBlob(blob: Blob) {
  stopCurrentPrimerAudio();
  const audio = new Audio();
  const objectUrl = URL.createObjectURL(blob);
  currentPrimerAudio = audio;
  currentObjectUrl = objectUrl;
  audio.preload = 'auto';
  audio.src = objectUrl;
  audio.onended = () => {
    if (currentPrimerAudio === audio) stopCurrentPrimerAudio();
  };

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

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}
