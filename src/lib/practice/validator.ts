import type { WelshSpellingMode } from '../../data/wordLists';

const flexibleMap: Record<string, string> = {
  á: 'a', à: 'a', â: 'a', ä: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ŵ: 'w', ŷ: 'y'
};

const apostropheVariants = /['’‘`´ʻ]/g;
const dashVariants = /[-–—‑]/g;
const whitespace = /\s+/g;

export function normalizeForComparison(value: string): string {
  return value
    .replace(apostropheVariants, "'")
    .replace(dashVariants, '-')
    .toLowerCase()
    .trim()
    .replace(whitespace, ' ');
}

function applyWelshSpellingMode(value: string, mode: WelshSpellingMode) {
  if (mode === 'strict') return value;
  return Array.from(value).map(char => flexibleMap[char] ?? char).join('');
}

function normalise(value: string, mode: WelshSpellingMode) {
  return applyWelshSpellingMode(normalizeForComparison(value), mode);
}

export function validateLetter(input: string, expected: string, mode: WelshSpellingMode) {
  return normalise(input, mode) === normalise(expected, mode);
}

export function validateAnswer(input: string, expected: string, mode: WelshSpellingMode) {
  return normalise(input, mode) === normalise(expected, mode);
}
