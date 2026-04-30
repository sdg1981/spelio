const flexibleGroups: Record<string, string[]> = {
  a: ['a', 'á', 'à', 'â', 'ä'],
  e: ['e', 'é', 'è', 'ê', 'ë'],
  i: ['i', 'í', 'ì', 'î', 'ï'],
  o: ['o', 'ó', 'ò', 'ô', 'ö'],
  u: ['u', 'ú', 'ù', 'û', 'ü'],
  w: ['w', 'ŵ', 'ẃ', 'ẁ', 'ẅ'],
  y: ['y', 'ŷ', 'ý', 'ỳ', 'ÿ']
};

function normaliseCase(value: string) {
  return value.toLocaleLowerCase('cy');
}

export function matchesFlexible(input: string, target: string) {
  const typed = normaliseCase(input);
  const expected = normaliseCase(target);

  if (typed === expected) return true;

  for (const group of Object.values(flexibleGroups)) {
    if (group.includes(expected)) {
      return group.includes(typed);
    }
  }

  return typed === expected;
}
