export {};

declare function require(name: string): {
  readFileSync?: (path: string, encoding: string) => string;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};

const documentShellSource = readFileSync('index.html', 'utf8');
const practiceSource = readFileSync('src/components/Practice.tsx', 'utf8');
const stylesSource = readFileSync('src/styles.css', 'utf8');

const viewportTags = documentShellSource.match(/<meta\s+name=["']viewport["'][^>]*>/g) ?? [];
assert(viewportTags.length === 1, 'Document shell should contain exactly one viewport meta tag.');
assert(viewportTags[0].includes('viewport-fit=cover'), 'Document viewport should expose iOS safe-area insets.');

assert(
  practiceSource.includes('<header className="practice-header">') &&
    practiceSource.includes('<Progress value={value} count={count} />') &&
    practiceSource.includes('<PracticeTopNav onBackHome={onBackHome} />'),
  'Practice progress and navigation controls should share the safe-area-aware header container.'
);

assert(
  stylesSource.includes('--practice-safe-area-top:env(safe-area-inset-top, 0px);') &&
    /\.practice-header\{[\s\S]*?padding-top:var\(--practice-safe-area-top\);/.test(stylesSource),
  'Practice header should use the iOS safe-area inset with a zero fallback.'
);

assert(
  /\.practice-app \.practice-shell\{[\s\S]*?padding:calc\(220px \+ var\(--practice-safe-area-top\)\)/.test(stylesSource) &&
    /@media \(max-width:767px\)\{[\s\S]*?\.practice-app \.practice-shell\{[\s\S]*?padding:calc\(106px \+ var\(--practice-safe-area-top\)\)/.test(stylesSource) &&
    stylesSource.includes('padding-top:calc(92px + var(--practice-safe-area-top));') &&
    stylesSource.includes('padding-top:calc(188px + var(--practice-safe-area-top));') &&
    stylesSource.includes('padding-top:calc(176px + var(--practice-safe-area-top));'),
  'Practice content should retain its short-phone, mobile, tablet, and desktop spacing below the safe-area-aware header.'
);

assert(
  /\.practice-home-back\{[\s\S]*?width:44px;[\s\S]*?height:44px;/.test(stylesSource) &&
    /\.practice-home-logo button\{[\s\S]*?width:44px;[\s\S]*?height:44px;/.test(stylesSource),
  'Practice home controls should keep at least 44px touch targets.'
);
