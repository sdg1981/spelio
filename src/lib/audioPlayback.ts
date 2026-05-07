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

export async function playAudioUrl(audioUrl?: string | null) {
  const playableUrl = getPlayableAudioUrl(audioUrl);
  if (!playableUrl) {
    logAudioPlaybackError('Missing or invalid audio URL.', audioUrl);
    return false;
  }

  try {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = playableUrl;
    audio.currentTime = 0;
    await audio.play();
    return true;
  } catch (error) {
    logAudioPlaybackError(error, playableUrl);
    return false;
  }
}

function logAudioPlaybackError(error: unknown, audioUrl?: string | null) {
  if (!import.meta.env.DEV) return;
  console.error('[audioPlayback] Could not play audio.', { audioUrl, error });
}
