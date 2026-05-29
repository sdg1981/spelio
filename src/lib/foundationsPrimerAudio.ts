import { playAudioUrl } from './audioPlayback';

let currentPrimerAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;

export async function playPrimerSound(item: { audioText: string; audioUrl?: string | null }) {
  if (item.audioUrl) {
    return playAudioUrl(item.audioUrl);
  }

  const response = await fetch('/api/azure-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: item.audioText, language: 'cy' })
  });

  if (!response.ok) return false;

  const blob = await response.blob();
  return playPrimerAudioBlob(blob);
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
