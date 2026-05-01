import type { WelshSpellingMode } from '../../data/wordLists';

const flexibleMap: Record<string, string> = {
  á: 'a', à: 'a', â: 'a', ä: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ŵ: 'w', ŷ: 'y'
};

function normalise(char: string, mode: WelshSpellingMode) {
  const lower = char.toLowerCase();
  if (mode === 'strict') return lower;
  return flexibleMap[lower] ?? lower;
}

export function validateLetter(input: string, expected: string, mode: WelshSpellingMode) {
  return normalise(input, mode) === normalise(expected, mode);
}
