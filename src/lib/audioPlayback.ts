export { getPlayableAudioUrl, hasPlayableAudioUrl } from './practice/audioAvailability';
import { getPlayableAudioUrl } from './practice/audioAvailability';

export function logAudioPlaybackClick(source: string, audioUrl?: string | null) {
  logAudioPlaybackDiagnostic('click handler fired', { source, audioUrl });
}

export async function playAudioUrl(audioUrl?: string | null) {
  logAudioPlaybackDiagnostic('playback requested', { audioUrl });

  if (!audioUrl?.trim()) {
    logAudioPlaybackDiagnostic('URL validation failed', { audioUrl, reason: 'missing_or_empty' });
    return false;
  }

  const playableUrl = getPlayableAudioUrl(audioUrl);
  logAudioPlaybackDiagnostic('URL validation result', { audioUrl, playableUrl, passed: Boolean(playableUrl) });

  if (!playableUrl) {
    logAudioPlaybackDiagnostic('playback aborted', { audioUrl, reason: 'invalid_url' });
    return false;
  }

  try {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = playableUrl;
    audio.currentTime = 0;
    logAudioPlaybackDiagnostic('audio.play() called', { audioUrl: playableUrl });
    await audio.play();
    logAudioPlaybackDiagnostic('audio.play() resolved', { audioUrl: playableUrl });
    return true;
  } catch (error) {
    logAudioPlaybackDiagnostic('audio.play() rejected', { audioUrl: playableUrl, error });
    return false;
  }
}

function logAudioPlaybackDiagnostic(message: string, details: Record<string, unknown>) {
  // TODO: Remove temporary audio playback diagnostics before production if noisy.
  if (!import.meta.env.DEV) return;
  console.info(`[audioPlayback] ${message}`, details);
}
