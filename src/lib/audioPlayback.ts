export { getPlayableAudioUrl, hasPlayableAudioUrl } from './practice/audioAvailability';
import { getPlayableAudioUrl } from './practice/audioAvailability';

export type AudioPlaybackController = ReturnType<typeof createAudioPlaybackController>;
export type AudioPlaybackEndReason = 'ended' | 'failed' | 'interrupted';

export function createAudioPlaybackController() {
  let currentAudio: HTMLAudioElement | null = null;
  let currentSource: string | null = null;
  let currentPlaybackId = 0;
  let currentOnEnd: ((reason: AudioPlaybackEndReason) => void) | null = null;

  function finishCurrentPlayback(reason: AudioPlaybackEndReason, playbackId = currentPlaybackId) {
    if (playbackId !== currentPlaybackId) return;
    const onEnd = currentOnEnd;
    currentOnEnd = null;
    onEnd?.(reason);
  }

  function stop(releaseAudio = false) {
    const audio = currentAudio;
    finishCurrentPlayback('interrupted');
    currentPlaybackId += 1;
    if (!audio) return;

    try {
      audio.onpause = null;
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

  function playSource(source: string, onEnd?: (reason: AudioPlaybackEndReason) => void) {
    try {
      let audio = currentAudio;
      if (audio) {
        audio.onpause = null;
        finishCurrentPlayback('interrupted');
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

      const playbackId = currentPlaybackId + 1;
      currentPlaybackId = playbackId;
      currentOnEnd = onEnd ?? null;
      audio.onended = () => finishCurrentPlayback('ended', playbackId);
      audio.onerror = () => {
        reportAudioPlaybackFailure('media_error', audio, source);
        finishCurrentPlayback('failed', playbackId);
      };
      audio.onpause = () => finishCurrentPlayback('interrupted', playbackId);

      try {
        audio.currentTime = 0;
      } catch {
        // Playback can continue from the browser's available start position.
      }

      // Keep this call in the same stack as playSource so mobile WebKit sees the
      // initiating tap. Rejection is converted to a non-blocking false result.
      return audio.play().then(
        () => true,
        error => {
          reportAudioPlaybackFailure('play_rejected', audio, source, error);
          finishCurrentPlayback('failed', playbackId);
          return false;
        }
      );
    } catch (error) {
      reportAudioPlaybackFailure('play_threw', currentAudio, source, error);
      const hasRegisteredEndHandler = currentOnEnd !== null;
      finishCurrentPlayback('failed');
      if (!hasRegisteredEndHandler) onEnd?.('failed');
      return Promise.resolve(false);
    }
  }

  function playUrl(audioUrl?: string | null) {
    const playableUrl = getPlayableAudioUrl(audioUrl);
    return playableUrl ? playSource(playableUrl) : Promise.resolve(false);
  }

  return { playSource, playUrl, stop };
}

function reportAudioPlaybackFailure(
  stage: 'media_error' | 'play_rejected' | 'play_threw',
  audio: HTMLAudioElement | null,
  source: string,
  error?: unknown
) {
  console.warn('[audioPlayback] Playback failed.', {
    stage,
    source,
    error: error instanceof Error ? { name: error.name, message: error.message } : error ? String(error) : undefined,
    mediaError: audio?.error ? { code: audio.error.code, message: audio.error.message } : undefined,
    networkState: audio?.networkState,
    readyState: audio?.readyState,
    currentSrc: audio?.currentSrc
  });
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
