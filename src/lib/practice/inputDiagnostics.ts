import { normalizeForComparison } from './validator';

export type PracticeInputDiagnosticEntry = {
  elapsedMs: number;
  eventType: string;
  inputType?: string;
  isComposing?: boolean;
  dataCodePoints?: string;
  hiddenValueLength?: number;
  hiddenCharacterCount?: number;
  previousBufferLength?: number;
  currentBufferLength?: number;
  acknowledgedBufferLength?: number;
  derivedSuffixCodePoints?: string;
  bufferUpdateKind?: string;
  logicalCharacterEmitted?: boolean;
  source?: string;
  answerIndexBefore?: number;
  answerIndexAfter?: number;
  expectedCodePoints?: string;
  enteredCodePoints?: string;
  normalizedExpectedCodePoints?: string;
  normalizedEnteredCodePoints?: string;
  decision?: string;
  redXTriggered?: boolean;
  printableKeydown?: 'suppressed' | 'processed';
  cycleId?: number | null;
  wordId?: string;
  resolvedVariantId?: string;
};

export function isPracticeInputDiagnosticsEnabled(search: string) {
  return new URLSearchParams(search).get('input-debug') === '1';
}

export function toUnicodeCodePoints(value: string | null | undefined) {
  if (!value) return '';
  return Array.from(value.normalize('NFC'))
    .map(character => `U+${character.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')}`)
    .join(' ');
}

export function toNormalizedUnicodeCodePoints(value: string | null | undefined) {
  return toUnicodeCodePoints(normalizeForComparison(value ?? ''));
}

export function safeCharacterCount(value: string) {
  return Array.from(value.normalize('NFC')).length;
}
