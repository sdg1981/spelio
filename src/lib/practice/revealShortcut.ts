export const KEYBOARD_REVEAL_HOLD_DELAY_MS = 500;

export type RevealShortcutAction = 'reveal-next' | 'begin-peek-hold' | 'end-peek-hold';

export interface RevealShortcutResult {
  actions: RevealShortcutAction[];
  held: boolean;
  handled: boolean;
}

export function handleRevealShortcutKeyDown({
  code,
  repeat,
  held
}: {
  code: string;
  repeat: boolean;
  held: boolean;
}): RevealShortcutResult {
  if (code !== 'ArrowRight') return { actions: [], held, handled: false };
  if (repeat || held) return { actions: [], held: true, handled: true };
  return { actions: ['reveal-next', 'begin-peek-hold'], held: true, handled: true };
}

export function handleRevealShortcutKeyUp({
  code,
  held
}: {
  code: string;
  held: boolean;
}): RevealShortcutResult {
  if (code !== 'ArrowRight') return { actions: [], held, handled: false };
  if (!held) return { actions: [], held: false, handled: false };
  return { actions: held ? ['end-peek-hold'] : [], held: false, handled: true };
}
