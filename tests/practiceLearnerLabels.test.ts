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
const stylesSource = readFileSync('src/styles.css', 'utf8');
const settingsStart = practiceSource.indexOf("{t('settings.welshStyle')}");
const settingsEnd = practiceSource.indexOf("{t('settings.audioPrompts')}", settingsStart);
const welshStyleSettingsSource = practiceSource.slice(settingsStart, settingsEnd);

assert(settingsStart >= 0 && settingsEnd > settingsStart, 'The learner-facing Welsh style Settings controls should remain present.');
assert(
  welshStyleSettingsSource.includes("onClick={() => handleDialectPreferenceChange('south_standard')}"),
  'The South Wales display option should retain the existing south_standard stored value.'
);
assert(
  welshStyleSettingsSource.includes("{t('settings.southStandard')}"),
  'The South Wales display option should render through the learner-facing translation key.'
);
assert(
  !welshStyleSettingsSource.includes('South Wales / Standard'),
  'The public Settings interface should not contain the obsolete combined English label.'
);

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

const darkWordPillRule = stylesSource.match(
  /\.public-app\[data-theme="dark"\] \.practice-app \.word-pill\{([\s\S]*?)\}/
)?.[1] ?? '';
const darkWordPillHoverRule = stylesSource.match(
  /@media \(hover:hover\) and \(pointer:fine\)\{\s*\.public-app\[data-theme="dark"\] \.practice-app \.word-pill:hover\{([\s\S]*?)\}/
)?.[1] ?? '';

assert(
  darkWordPillRule.includes('background:var(--bg-surface-raised);'),
  'The dark practice pill should use an opaque semantic surface instead of revealing the practice shell through a translucent fill.'
);
assert(
  darkWordPillHoverRule.includes('background:var(--bg-surface-soft);') &&
    darkWordPillHoverRule.includes('transform:none;'),
  'The dark practice pill should have one fine-pointer hover surface without movement.'
);
assert(
  !darkWordPillHoverRule.includes('box-shadow') &&
    !stylesSource.includes('.practice-app .word-pill:hover svg') &&
    !stylesSource.includes('.practice-app .word-pill:hover .prompt-audio-icon') &&
    !stylesSource.includes('.practice-app .word-pill:hover .prompt-text'),
  'Dark practice pill hover should not animate a large shadow or give its icon and prompt conflicting child hover states.'
);
assert(
  stylesSource.includes('.practice-app .word-pill:focus-visible{') &&
    stylesSource.includes('outline-color:var(--focus-ring);'),
  'The practice pill should retain its visible keyboard focus treatment.'
);
assert(
  !stylesSource.includes('.practice-shell:hover') && !stylesSource.includes('.practice-app:hover'),
  'Hovering the practice pill must not change a practice shell or practice app ancestor surface.'
);

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

console.log('Practice replay icon, learner dialect label, and stored preference tests passed.');
