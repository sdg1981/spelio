import { getEndScreenProgressSummary } from '../src/lib/practice/endScreenState';

declare function require(name: string): {
  readFileSync(path: string, encoding: string): string;
};

const { readFileSync } = require('fs');

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

assertEqual(
  getEndScreenProgressSummary('Total progress: 10 spellings learned', null),
  'Total progress: 10 spellings learned',
  'Normal end screens should keep the total progress summary.'
);

assertEqual(
  getEndScreenProgressSummary('Total progress: 10 spellings learned', {
    listId: 'support_accents',
    returnTo: '/spelling-basics/accents'
  }),
  null,
  'Detached support end screens should hide total progress summaries.'
);

assertEqual(
  getEndScreenProgressSummary(null, {
    listId: 'support_ff',
    returnTo: '/spelling-basics/ff'
  }),
  null,
  'Detached support end screens should tolerate already-empty summaries.'
);

const endSource = readFileSync('src/components/End.tsx', 'utf8');
const stylesSource = readFileSync('src/styles.css', 'utf8');
const darkEndPrimaryRule = stylesSource.match(
  /\.public-app\[data-theme="dark"\] \.end-primary\{([\s\S]*?)\}/
)?.[1] ?? '';
const darkEndPrimaryHoverRule = stylesSource.match(
  /\.public-app\[data-theme="dark"\] \.end-primary:hover\{([\s\S]*?)\}/
)?.[1] ?? '';
const coarseEndPrimaryHoverRule = stylesSource.match(
  /@media \(hover:none\), \(pointer:coarse\)\{\s*\.public-app\[data-theme="dark"\] \.end-primary:hover\{([\s\S]*?)\}/
)?.[1] ?? '';

assert(
  darkEndPrimaryRule.includes('background:var(--accent);') &&
    !/background:[^;]*(?:rgba|linear-gradient)/.test(darkEndPrimaryRule) &&
    stylesSource.includes('@media (hover:hover) and (pointer:fine){\n  .public-app[data-theme="dark"] .end-primary{'),
  'The dark end-screen primary action should use an opaque semantic surface.'
);
assert(
  darkEndPrimaryRule.includes('box-shadow:0 14px 24px') &&
    darkEndPrimaryRule.includes('transition:background-color .16s ease-out,box-shadow .12s ease-out;'),
  'The dark end-screen primary action should use a restrained shadow and transition only explicit paint properties.'
);
assert(
  darkEndPrimaryHoverRule.includes('transform:none;') &&
    darkEndPrimaryHoverRule.includes('background:var(--accent-hover);') &&
    darkEndPrimaryHoverRule.includes('box-shadow:0 14px 24px'),
  'Fine-pointer hover should change only the end-screen button surface while keeping its position and shadow bounds stable.'
);
assert(
  coarseEndPrimaryHoverRule.includes('transform:none;') &&
    coarseEndPrimaryHoverRule.includes('background:linear-gradient(180deg,var(--accent-hover),var(--accent));') &&
    coarseEndPrimaryHoverRule.includes('box-shadow:0 18px 30px'),
  'Touch and coarse-pointer devices should not retain the desktop end-screen hover treatment.'
);
assert(
  /\.public-app\[data-theme="dark"\] \.end-primary:focus-visible\{[\s\S]*?var\(--accent-red-focus-soft\)/.test(stylesSource),
  'The dark end-screen primary action should keep a clear keyboard focus ring.'
);
assert(
  !stylesSource.includes('.end-primary:hover span') &&
    !stylesSource.includes('.end-primary:hover svg') &&
    !stylesSource.includes('.end-shell:hover') &&
    !stylesSource.includes('.end-bg:hover') &&
    !stylesSource.includes('.end-score-ring:hover') &&
    !stylesSource.includes('.end-recommendation:hover'),
  'End-screen primary hover must not introduce child-specific or ancestor surface states.'
);
assert(
  endSource.includes('<PrimaryButton className="end-primary" onClick={handlePrimary}>{primaryTitle}</PrimaryButton>') &&
    endSource.includes(': onContinue;') &&
    endSource.includes('? onReview') &&
    endSource.includes('? onChangeLists') &&
    endSource.includes('? onMilestoneContinue'),
  'Every end-screen primary label should retain the shared button and its existing continuation, review, list, and milestone handlers.'
);
assert(
  /\.public-app\[data-theme="dark"\]:is\([\s\S]*?\.public-app-end-background[\s\S]*?\) :is\(\.how-page,\.practice-app,\.end-bg\)\{[\s\S]*?min-height:100vh;[\s\S]*?background:var\(--bg-app\);/.test(stylesSource),
  'Every normal, shared-list, custom-list, support, and milestone end state should inherit the continuous semantic dark canvas.'
);
assert(
  /\.public-app\[data-theme="dark"\]:is\([\s\S]*?\.public-app-end-background[\s\S]*?\) :is\(\.foundations-primer-footer,\.end-action-list\)\{[\s\S]*?background:transparent;[\s\S]*?background-image:none;/.test(stylesSource) &&
    !/\.end-v2-shell\{[^}]*?(?:max-height|overflow:hidden)/.test(stylesSource),
  'The end action region should stay on the page canvas and taller end states should remain naturally scrollable.'
);

console.log('support end screen tests passed');
