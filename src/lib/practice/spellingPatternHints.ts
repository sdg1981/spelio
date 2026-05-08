import type { InterfaceLanguage, TranslationKey } from '../../i18n';
import { createPracticeAnswer, normalizeForComparison } from './validator';

export type SpellingPatternHintId =
  | 'cy.dd.softTh'
  | 'cy.f.vSound'
  | 'cy.ff.fSound'
  | 'cy.ll.awareness'
  | 'cy.ch.awareness'
  | 'cy.rh.awareness'
  | 'cy.ng.awareness'
  | 'cy.ngh.awareness'
  | 'cy.wy.awareness'
  | 'cy.ae.awareness'
  | 'cy.ai.awareness'
  | 'cy.au.awareness'
  | 'cy.ei.awareness'
  | 'cy.eu.awareness'
  | 'cy.oe.awareness'
  | 'cy.w.vowel'
  | 'cy.y.vowel'
  | 'cy.rareLetter.k'
  | 'cy.rareLetter.q'
  | 'cy.rareLetter.x'
  | 'cy.rareLetter.z';

export interface SpellingPatternHint {
  id: SpellingPatternHintId;
  translationKey: TranslationKey;
  source: 'word' | 'generic';
}

export interface SpellingPatternHintWordFields {
  spellingHintId?: string | null;
  disablePatternHints?: boolean | null;
}

export interface GetSpellingPatternHintInput {
  targetAnswer: string;
  currentInputPosition: number;
  attempted: string;
  word?: SpellingPatternHintWordFields | null;
  interfaceLanguage: InterfaceLanguage;
}

interface HintRegistryEntry {
  id: SpellingPatternHintId;
  translationKey: TranslationKey;
}

const hintRegistryEntries: HintRegistryEntry[] = [
  { id: 'cy.dd.softTh', translationKey: 'spellingHints.cy.dd.softTh' },
  { id: 'cy.f.vSound', translationKey: 'spellingHints.cy.f.vSound' },
  { id: 'cy.ff.fSound', translationKey: 'spellingHints.cy.ff.fSound' },
  { id: 'cy.ll.awareness', translationKey: 'spellingHints.cy.ll.awareness' },
  { id: 'cy.ch.awareness', translationKey: 'spellingHints.cy.ch.awareness' },
  { id: 'cy.rh.awareness', translationKey: 'spellingHints.cy.rh.awareness' },
  { id: 'cy.ng.awareness', translationKey: 'spellingHints.cy.ng.awareness' },
  { id: 'cy.ngh.awareness', translationKey: 'spellingHints.cy.ngh.awareness' },
  { id: 'cy.wy.awareness', translationKey: 'spellingHints.cy.wy.awareness' },
  { id: 'cy.ae.awareness', translationKey: 'spellingHints.cy.ae.awareness' },
  { id: 'cy.ai.awareness', translationKey: 'spellingHints.cy.ai.awareness' },
  { id: 'cy.au.awareness', translationKey: 'spellingHints.cy.au.awareness' },
  { id: 'cy.ei.awareness', translationKey: 'spellingHints.cy.ei.awareness' },
  { id: 'cy.eu.awareness', translationKey: 'spellingHints.cy.eu.awareness' },
  { id: 'cy.oe.awareness', translationKey: 'spellingHints.cy.oe.awareness' },
  { id: 'cy.w.vowel', translationKey: 'spellingHints.cy.w.vowel' },
  { id: 'cy.y.vowel', translationKey: 'spellingHints.cy.y.vowel' },
  { id: 'cy.rareLetter.k', translationKey: 'spellingHints.cy.rareLetter.k' },
  { id: 'cy.rareLetter.q', translationKey: 'spellingHints.cy.rareLetter.q' },
  { id: 'cy.rareLetter.x', translationKey: 'spellingHints.cy.rareLetter.x' },
  { id: 'cy.rareLetter.z', translationKey: 'spellingHints.cy.rareLetter.z' }
];

export const spellingPatternHintRegistry = new Map(
  hintRegistryEntries.map(entry => [entry.id, entry])
);

const awarenessChunks = [
  ['ngh', 'cy.ngh.awareness'],
  ['ll', 'cy.ll.awareness'],
  ['ch', 'cy.ch.awareness'],
  ['rh', 'cy.rh.awareness'],
  ['ng', 'cy.ng.awareness'],
  ['wy', 'cy.wy.awareness'],
  ['ae', 'cy.ae.awareness'],
  ['ai', 'cy.ai.awareness'],
  ['au', 'cy.au.awareness'],
  ['ei', 'cy.ei.awareness'],
  ['eu', 'cy.eu.awareness'],
  ['oe', 'cy.oe.awareness']
] as const;

const wVowelChunks = ['aw', 'ew', 'iw', 'ow', 'uw', 'yw'] as const;
const yVowelChunks = ['wy', 'yw', 'ay', 'ey', 'oy', 'uy'] as const;

function createHint(id: SpellingPatternHintId, source: SpellingPatternHint['source']): SpellingPatternHint | null {
  const entry = spellingPatternHintRegistry.get(id);
  return entry ? { id: entry.id, translationKey: entry.translationKey, source } : null;
}

function normaliseHintId(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && spellingPatternHintRegistry.has(trimmed as SpellingPatternHintId)
    ? trimmed as SpellingPatternHintId
    : null;
}

function normaliseInput(value: string) {
  return normalizeForComparison(createPracticeAnswer(value));
}

function charAt(value: string, position: number) {
  return position >= 0 && position < value.length ? value[position] : '';
}

function chunkRanges(target: string, chunk: string) {
  const ranges: Array<{ start: number; end: number }> = [];
  let start = target.indexOf(chunk);

  while (start >= 0) {
    ranges.push({ start, end: start + chunk.length });
    start = target.indexOf(chunk, start + 1);
  }

  return ranges;
}

function positionWithinChunk(target: string, chunk: string, position: number) {
  return chunkRanges(target, chunk).some(range => position >= range.start && position < range.end);
}

function positionNearChunk(target: string, chunk: string, position: number) {
  return chunkRanges(target, chunk).some(range => position >= range.start - 1 && position < range.end);
}

function targetHasSingleFAt(target: string, position: number) {
  return charAt(target, position) === 'f' && !positionWithinChunk(target, 'ff', position);
}

function isDifferentFromTarget(target: string, position: number, attempted: string) {
  const expected = charAt(target, position);
  return Boolean(expected && attempted && attempted !== expected);
}

export function getSpellingPatternHint(input: GetSpellingPatternHintInput): SpellingPatternHint | null {
  const wordHintId = normaliseHintId(input.word?.spellingHintId);
  if (wordHintId) return createHint(wordHintId, 'word');
  if (input.word?.disablePatternHints) return null;

  const target = normaliseInput(input.targetAnswer);
  const attempted = normaliseInput(input.attempted);
  const position = Math.max(0, Math.min(input.currentInputPosition, Math.max(target.length - 1, 0)));

  void input.interfaceLanguage;

  if (!target || !attempted) return null;

  if (positionNearChunk(target, 'dd', position) && ['t', 'd', 'th'].includes(attempted)) {
    return createHint('cy.dd.softTh', 'generic');
  }

  if (positionWithinChunk(target, 'ff', position) && attempted !== 'f') {
    return createHint('cy.ff.fSound', 'generic');
  }

  if (attempted === 'v' && targetHasSingleFAt(target, position)) {
    return createHint('cy.f.vSound', 'generic');
  }

  for (const [chunk, hintId] of awarenessChunks) {
    if (positionWithinChunk(target, chunk, position) && isDifferentFromTarget(target, position, attempted)) {
      return createHint(hintId, 'generic');
    }
  }

  if (
    charAt(target, position) === 'w'
    && wVowelChunks.some(chunk => positionWithinChunk(target, chunk, position))
    && isDifferentFromTarget(target, position, attempted)
  ) {
    return createHint('cy.w.vowel', 'generic');
  }

  if (
    charAt(target, position) === 'y'
    && yVowelChunks.some(chunk => positionWithinChunk(target, chunk, position))
    && isDifferentFromTarget(target, position, attempted)
  ) {
    return createHint('cy.y.vowel', 'generic');
  }

  if (['k', 'q', 'x', 'z'].includes(attempted) && isDifferentFromTarget(target, position, attempted)) {
    return createHint(`cy.rareLetter.${attempted}` as SpellingPatternHintId, 'generic');
  }

  return null;
}
