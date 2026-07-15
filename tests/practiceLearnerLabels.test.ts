import { translate } from '../src/i18n';
import { normaliseStorage } from '../src/lib/practice/storage';

declare function require(name: string): {
  existsSync(path: string): boolean;
  readFileSync(path: string, encoding: string): string;
};

const { existsSync, readFileSync } = require('fs');

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

const practiceSource = readFileSync('src/components/Practice.tsx', 'utf8');

assert(existsSync('public/replay-audio.svg'), 'The supplied replay-audio SVG should remain in Vite public assets.');
assert(practiceSource.includes('src="/replay-audio.svg"'), 'The practice word/audio pill should use the Vite public path for the supplied replay icon.');
assert(
  practiceSource.includes("aria-label={t('practice.replayCurrentWordAudio')}"),
  'The practice word/audio pill should retain an explicit accessible replay name.'
);

const wordPillHandlerStart = practiceSource.indexOf('function handleWordPillClick');
const wordPillHandlerEnd = practiceSource.indexOf('\n  if (!hasWords || !currentWord)', wordPillHandlerStart);
const wordPillHandler = practiceSource.slice(wordPillHandlerStart, wordPillHandlerEnd);
assert(wordPillHandler.includes('playAudio();'), 'Activating the practice pill should still call the existing audio playback behavior.');
assert(practiceSource.includes('onClick={handleWordPillClick}'), 'The whole practice word/audio pill should remain wired to the existing replay handler.');

assertEqual(translate('en', 'settings.southStandard'), 'South Wales', 'English Settings should use the revised South Wales label.');
assertEqual(translate('cy', 'settings.southStandard'), 'De Cymru', 'Welsh Settings should use the revised De Cymru label.');
assertEqual(translate('en', 'practice.southStandardForm'), 'South Wales form', 'Generated English dialect labels should use South Wales.');
assertEqual(translate('cy', 'practice.southStandardForm'), 'Ffurf De Cymru', 'Generated Welsh dialect labels should use De Cymru.');

const enSource = readFileSync('src/i18n/en.ts', 'utf8');
const cySource = readFileSync('src/i18n/cy.ts', 'utf8');
assert(!enSource.includes("southStandard: 'South Wales / Standard'"), 'English learner Settings copy should not retain the old combined label.');
assert(!cySource.includes("southStandard: 'De Cymru / Safonol'"), 'Welsh learner Settings copy should not retain the old combined label.');

const restored = normaliseStorage({ settings: { dialectPreference: 'south_standard' } });
assertEqual(restored.settings.dialectPreference, 'south_standard', 'The stored South Wales dialectPreference value should remain unchanged.');

const sessionEngineSource = readFileSync('src/lib/practice/sessionEngine.ts', 'utf8');
assert(
  sessionEngineSource.includes("word.dialect === 'South Wales / Standard' || word.dialect === 'Standard'"),
  'South Wales selection should continue supporting existing South Wales / Standard and distinct Standard metadata.'
);

console.log('Practice replay icon and learner dialect label tests passed.');
