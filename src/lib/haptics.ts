const INCORRECT_HAPTIC_DURATION_MS = 10;

export function triggerIncorrectHaptic(soundEffectsEnabled: boolean) {
  if (!soundEffectsEnabled) return;

  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    navigator.vibrate(INCORRECT_HAPTIC_DURATION_MS);
  } catch {
    // Haptics are a non-critical progressive enhancement.
  }
}
