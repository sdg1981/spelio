export { getPlayableAudioUrl, hasPlayableAudioUrl } from './practice/audioAvailability';
import { getPlayableAudioUrl } from './practice/audioAvailability';

export type AudioPlaybackController = ReturnType<typeof createAudioPlaybackController>;

export function createAudioPlaybackController() {
  let currentAudio: HTMLAudioElement | null = null;
  let currentSource: string | null = null;

  function stop(releaseAudio = false) {
    const audio = currentAudio;
    if (!audio) return;

    try {
      audio.pause();
    } catch {
      // Audio cleanup is best-effort.
    }
    try {
      audio.currentTime = 0;
    } catch {
      // Some browsers can reject seeking while media metadata is unavailable.
    }

    if (releaseAudio) {
      audio.removeAttribute?.('src');
      try {
        audio.load();
      } catch {
        // Audio cleanup is best-effort.
      }
      currentAudio = null;
      currentSource = null;
    }
  }

  function playSource(source: string) {
    try {
      let audio = currentAudio;
      if (audio) {
        audio.pause();
        try {
          audio.currentTime = 0;
        } catch {
          // Restart should still attempt playback even if seeking fails.
        }
      }

      if (!audio || currentSource !== source) {
        stop(true);
        audio = new Audio();
        audio.preload = 'auto';
        audio.src = source;
        currentAudio = audio;
        currentSource = source;
      }

      try {
        audio.currentTime = 0;
      } catch {
        // Playback can continue from the browser's available start position.
      }

      // Keep this call in the same stack as playSource so mobile WebKit sees the
      // initiating tap. Rejection is converted to a non-blocking false result.
      return audio.play().then(
        () => true,
        () => false
      );
    } catch {
      return Promise.resolve(false);
    }
  }

  function playUrl(audioUrl?: string | null) {
    const playableUrl = getPlayableAudioUrl(audioUrl);
    return playableUrl ? playSource(playableUrl) : Promise.resolve(false);
  }

  return { playSource, playUrl, stop };
}

const sharedAudioPlayback = createAudioPlaybackController();

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
    logAudioPlaybackDiagnostic('audio.play() called', { audioUrl: playableUrl });
    const played = await sharedAudioPlayback.playSource(playableUrl);
    if (!played) {
      logAudioPlaybackDiagnostic('audio.play() rejected', { audioUrl: playableUrl });
      return false;
    }
    logAudioPlaybackDiagnostic('audio.play() resolved', { audioUrl: playableUrl });
    return true;
  } catch (error) {
    logAudioPlaybackDiagnostic('audio.play() rejected', { audioUrl: playableUrl, error });
    return false;
  }
}

function logAudioPlaybackDiagnostic(message: string, details: Record<string, unknown>) {
  // TODO: Remove temporary audio playback diagnostics before production if noisy.
  if (!isDevelopmentAudioDiagnosticsEnabled()) return;
  console.info(`[audioPlayback] ${message}`, details);
}

function isDevelopmentAudioDiagnosticsEnabled() {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}
