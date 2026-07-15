export const TOUCH_KEYBOARD_STORAGE_KEY = 'spelio-touch-keyboard-hint-v1';

// Temporarily keep the custom keyboard out of learner use while native keyboard
// behaviour is validated on iPhone. The implementation and saved preference
// remain in place so this can be re-enabled after testing.
export const ENABLE_CUSTOM_KEYBOARD = false;

export const WELSH_DIGRAPH_KEYS = ['CH', 'DD', 'FF', 'NG', 'LL', 'PH', 'RH', 'TH'] as const;

export const TOUCH_KEYBOARD_ROWS = [
  WELSH_DIGRAPH_KEYS,
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['^', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '’']
] as const;

export const WELSH_ACCENT_VARIANTS: Record<string, readonly string[]> = {
  A: ['â', 'Â'],
  E: ['ê', 'Ê'],
  I: ['î', 'Î'],
  O: ['ô', 'Ô'],
  U: ['û', 'Û'],
  W: ['ŵ', 'Ŵ'],
  Y: ['ŷ', 'Ŷ']
};

export function answerNeedsWelshAccent(answer: string) {
  return /[âêîôûŵŷÂÊÎÔÛŴŶ]/.test(answer);
}

export type TouchKeyboardDetectionInput = {
  enabled: boolean;
  maxTouchPoints?: number;
  coarsePointer?: boolean;
  hoverNone?: boolean;
  forcedColors?: boolean;
};

export type TouchKeyboardAvailabilityInput = Omit<TouchKeyboardDetectionInput, 'enabled'>;

export function isCustomTouchKeyboardAvailable({
  maxTouchPoints = 0,
  coarsePointer = false,
  hoverNone = false,
  forcedColors = false
}: TouchKeyboardAvailabilityInput) {
  if (forcedColors) return false;
  return maxTouchPoints > 0 || coarsePointer || hoverNone;
}

export function shouldUseCustomTouchKeyboard({
  enabled,
  maxTouchPoints = 0,
  coarsePointer = false,
  hoverNone = false,
  forcedColors = false
}: TouchKeyboardDetectionInput) {
  if (!enabled) return false;
  return isCustomTouchKeyboardAvailable({ maxTouchPoints, coarsePointer, hoverNone, forcedColors });
}

export function shouldEnableCustomTouchKeyboard(input: TouchKeyboardDetectionInput) {
  return ENABLE_CUSTOM_KEYBOARD && shouldUseCustomTouchKeyboard(input);
}

function readCurrentTouchKeyboardEnvironment() {
  if (typeof window === 'undefined') return false;

  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const hoverNone = window.matchMedia('(hover: none)').matches;
  const forcedColors = window.matchMedia('(forced-colors: active)').matches;
  const maxTouchPoints = typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints ?? 0;

  return {
    maxTouchPoints,
    coarsePointer,
    hoverNone,
    forcedColors
  };
}

export function detectCustomTouchKeyboardAvailability() {
  if (!ENABLE_CUSTOM_KEYBOARD) return false;
  const environment = readCurrentTouchKeyboardEnvironment();
  if (!environment) return false;
  return isCustomTouchKeyboardAvailable(environment);
}

export function detectCustomTouchKeyboardEligibility(enabled: boolean) {
  const environment = readCurrentTouchKeyboardEnvironment();
  if (!environment) return false;
  return shouldEnableCustomTouchKeyboard({ enabled, ...environment });
}

export function hasSeenTouchKeyboardAccentHint(storage: Storage | null | undefined) {
  try {
    return storage?.getItem(TOUCH_KEYBOARD_STORAGE_KEY) === 'seen';
  } catch {
    return true;
  }
}

export function markTouchKeyboardAccentHintSeen(storage: Storage | null | undefined) {
  try {
    storage?.setItem(TOUCH_KEYBOARD_STORAGE_KEY, 'seen');
  } catch {
    // The hint is non-critical.
  }
}
