export type MobileTypoGraceEvent =
  | 'mobile_adjacent_typo_grace_triggered'
  | 'mobile_adjacent_typo_corrected'
  | 'mobile_adjacent_typo_committed_wrong';

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

export function isAdjacentQwertyKey(attempted: string, expected: string) {
  const attemptedKey = attempted.toLocaleLowerCase('en-GB');
  const expectedKey = expected.toLocaleLowerCase('en-GB');
  if (!/^[a-z]$/.test(attemptedKey) || !/^[a-z]$/.test(expectedKey)) return false;
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
