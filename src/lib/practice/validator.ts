import { matchesFlexible } from './diacritics';
import type { WelshSpellingMode } from '../../data/wordLists';

export function validateLetter(input: string, expected: string, mode: WelshSpellingMode) {
  if (mode === 'strict') {
    return input === expected;
  }

  return matchesFlexible(input, expected);
}
