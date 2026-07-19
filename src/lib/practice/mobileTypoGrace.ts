import type { WelshSpellingMode } from '../../data/wordLists';
import { validateLetter } from './validator';

export type MobileTypoGraceEvent =
  | 'mobile_adjacent_typo_detected'
  | 'mobile_adjacent_typo_corrected_backspace'
  | 'mobile_adjacent_typo_corrected_direct'
  | 'mobile_adjacent_typo_committed_wrong';

export type StoredMobileTypoGraceEvent = MobileTypoGraceEvent
  | 'mobile_adjacent_typo_grace_triggered'
  | 'mobile_adjacent_typo_corrected';

// Conservative QWERTY mobile-keyboard heuristic. Only immediate horizontal and
// diagonal A-Z neighbours are included; accented characters and other layouts
// intentionally continue through normal validation.
const QWERTY_ADJACENCY: Readonly<Record<string, readonly string[]>> = {
  q: ['w', 'a'],
  w: ['q', 'e', 'a', 's'],
  e: ['w', 'r', 's', 'd'],
  r: ['e', 't', 'd', 'f'],
  t: ['r', 'y', 'f', 'g'],
  y: ['t', 'u', 'g', 'h'],
  u: ['y', 'i', 'h', 'j'],
  i: ['u', 'o', 'j', 'k'],
  o: ['i', 'p', 'k', 'l'],
  p: ['o', 'l'],
  a: ['q', 'w', 's', 'z'],
  s: ['w', 'e', 'a', 'd', 'z', 'x'],
  d: ['e', 'r', 's', 'f', 'x', 'c'],
  f: ['r', 't', 'd', 'g', 'c', 'v'],
  g: ['t', 'y', 'f', 'h', 'v', 'b'],
  h: ['y', 'u', 'g', 'j', 'b', 'n'],
  j: ['u', 'i', 'h', 'k', 'n', 'm'],
  k: ['i', 'o', 'j', 'l', 'm'],
  l: ['o', 'p', 'k'],
  z: ['a', 's', 'x'],
  x: ['s', 'd', 'z', 'c'],
  c: ['d', 'f', 'x', 'v'],
  v: ['f', 'g', 'c', 'b'],
  b: ['g', 'h', 'v', 'n'],
  n: ['h', 'j', 'b', 'm'],
  m: ['j', 'k', 'n']
};

const WELSH_KEYBOARD_BASE_CHARACTERS: Readonly<Record<string, string>> = {
  á: 'a', à: 'a', â: 'a', ä: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ŵ: 'w', ŷ: 'y'
};

export function getKeyboardBaseCharacter(character: string) {
  const normalized = character.normalize('NFC').toLocaleLowerCase('en-GB');
  if (Array.from(normalized).length !== 1) return null;
  if (/^[a-z]$/.test(normalized)) return normalized;
  return WELSH_KEYBOARD_BASE_CHARACTERS[normalized] ?? null;
}

export function isAdjacentQwertyKey(attempted: string, expected: string) {
  const attemptedKey = getKeyboardBaseCharacter(attempted);
  const expectedKey = getKeyboardBaseCharacter(expected);
  if (!attemptedKey || !expectedKey) return false;
  if (attemptedKey === expectedKey) return false;
  return QWERTY_ADJACENCY[expectedKey]?.includes(attemptedKey) ?? false;
}

export function shouldOfferMobileTypoGrace({
  attempted,
  expected,
  mobileTouchInput,
  strictAssessmentMode,
  alreadyUsedAtPosition
}: {
  attempted: string;
  expected: string;
  mobileTouchInput: boolean;
  strictAssessmentMode: boolean;
  alreadyUsedAtPosition: boolean;
}) {
  return mobileTouchInput &&
    !strictAssessmentMode &&
    !alreadyUsedAtPosition &&
    isAdjacentQwertyKey(attempted, expected);
}

export function isDirectMobileTypoReplacement({
  rawInput,
  expected,
  mode
}: {
  rawInput: string;
  expected: string;
  mode: WelshSpellingMode;
}) {
  const normalizedInput = rawInput.normalize('NFC');
  const characters = Array.from(normalizedInput);
  return characters.length === 1 && validateLetter(characters[0], expected, mode);
}
