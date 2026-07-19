import {
  ENABLE_CUSTOM_KEYBOARD,
  TOUCH_KEYBOARD_ROWS,
  WELSH_ACCENT_VARIANTS,
  answerNeedsWelshAccent,
  isCustomTouchKeyboardAvailable,
  shouldEnableCustomTouchKeyboard,
  shouldUseCustomTouchKeyboard
} from '../src/lib/practice/touchKeyboard';
import {
  createInitialPracticeLetters,
  findNextInputIndex,
  processPracticeInput
} from '../src/lib/practice/inputFlow';

declare function require(name: string): {
  readFileSync?: (path: string, encoding: string) => string;
};

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function committedValue(letters: Array<{ value: string }>) {
  return letters.map(letter => letter.value || '_').join('');
}

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const practiceSource = readFileSync('src/components/Practice.tsx', 'utf8');
const appSource = readFileSync('src/App.tsx', 'utf8');
const stylesSource = readFileSync('src/styles.css', 'utf8');

assertEqual(
  practiceSource.includes('const shouldShowCustomKeyboard = ENABLE_CUSTOM_KEYBOARD &&'),
  true,
  'The learner render path must retain a direct feature-flag guard.'
);
assertEqual(
  (appSource.match(/<Practice\b/g) ?? []).length,
  1,
  'All learner-facing practice launches should share the single guarded Practice render path.'
);
assertEqual(
  practiceSource.includes('return createPortal(settingsOverlay, document.body);'),
  true,
  'Settings should mount directly under document.body instead of remaining inside a public-page stacking context.'
);
assertEqual(
  /\.settings-overlay\{[\s\S]*?position:fixed;[\s\S]*?inset:0;[\s\S]*?width:100%;[\s\S]*?height:100vh;[\s\S]*?min-height:100vh;/.test(stylesSource),
  true,
  'Settings backdrop should use fixed full-viewport bounds with a legacy viewport fallback.'
);
assertEqual(
  /@supports \(height:100dvh\)\{[\s\S]*?\.settings-overlay\{[\s\S]*?height:100dvh;[\s\S]*?min-height:100dvh;/.test(stylesSource),
  true,
  'Settings overlay should prefer the dynamic viewport when the browser supports it.'
);
assertEqual(
  /--public-navigation-layer-max:(\d+);[\s\S]*?--public-modal-layer:(\d+);/.test(stylesSource) &&
    Number(stylesSource.match(/--public-modal-layer:(\d+);/)?.[1]) >
      Number(stylesSource.match(/--public-navigation-layer-max:(\d+);/)?.[1]),
  true,
  'The documented public modal layer should exceed every public header and navigation layer.'
);
assertEqual(
  /\.settings-overlay\{[\s\S]*?env\(safe-area-inset-top, 0px\)[\s\S]*?env\(safe-area-inset-right, 0px\)[\s\S]*?env\(safe-area-inset-bottom, 0px\)[\s\S]*?env\(safe-area-inset-left, 0px\)[\s\S]*?\}/.test(stylesSource) &&
    !stylesSource.includes('max-height:calc(100svh - 2rem)'),
  true,
  'Safe-area insets should create inner dialog clearance once, without shrinking or re-insetting the viewport backdrop.'
);
assertEqual(
  stylesSource.includes('.settings-modal{display:flex;flex-direction:column;max-height:100%;overflow:hidden;padding:0;}'),
  true,
  'Settings should size its flex shell to the safe usable overlay area.'
);
assertEqual(
  /\.settings-modal-body\{[^}]*flex:1 1 auto;[^}]*min-height:0;[^}]*overflow-y:auto;/.test(stylesSource),
  true,
  'Settings choices should scroll independently between the fixed header and footer.'
);
assertEqual(
  /\.settings-modal-footer\{[^}]*flex:0 0 auto;/.test(stylesSource),
  true,
  'Settings Close action should remain outside the scrolling choices.'
);
assertEqual(
  practiceSource.includes("const appRoot = document.getElementById('root');") &&
    practiceSource.includes('appRoot.inert = true;') &&
    practiceSource.includes('appRoot.inert = rootWasInert;'),
  true,
  'Underlying public controls should become inert and inaccessible only while Settings is open.'
);
assertEqual(
  practiceSource.includes("documentElement.style.overflow = 'hidden';") &&
    practiceSource.includes("body.style.position = 'fixed';") &&
    practiceSource.includes('Object.assign(body.style, previousBodyStyles);') &&
    practiceSource.includes('window.scrollTo(0, scrollY);'),
  true,
  'Settings should lock background scrolling and restore the original page position on close.'
);
assertEqual(
  practiceSource.includes('className="modal-close" onClick={onClose}') &&
    practiceSource.includes('<button className="settings-close-button" onClick={onClose}>'),
  true,
  'Both existing Settings close controls should keep their close handlers.'
);
assertEqual(
  practiceSource.includes("document.addEventListener('keydown', handleKeyDown)") &&
    practiceSource.includes("if (event.key === 'Escape')") &&
    practiceSource.includes("if (event.key !== 'Tab') return;"),
  true,
  'Settings should keep keyboard focus inside the active dialog and close on Escape.'
);
assertEqual(
  practiceSource.includes("typeof document !== 'undefined' && document.activeElement instanceof HTMLElement") &&
    practiceSource.includes('openerRef.current?.focus({ preventScroll: true })'),
  true,
  'Settings should capture its opener before making the public root inert and restore focus on close.'
);

{
  assertEqual(
    ENABLE_CUSTOM_KEYBOARD,
    false,
    'The custom keyboard feature flag should keep native device input as the learner default.'
  );
  assertEqual(
    shouldEnableCustomTouchKeyboard({ enabled: true, maxTouchPoints: 5, coarsePointer: true }),
    false,
    'A saved custom-keyboard preference must not override the disabled feature flag.'
  );
  assertEqual(
    shouldUseCustomTouchKeyboard({ enabled: true, maxTouchPoints: 5, coarsePointer: true }),
    true,
    'Custom keyboard should be eligible on touch devices.'
  );
  assertEqual(
    isCustomTouchKeyboardAvailable({ maxTouchPoints: 5, coarsePointer: true }),
    true,
    'Keyboard preference should be available on touch devices even if the user currently prefers native input.'
  );
  assertEqual(
    shouldUseCustomTouchKeyboard({ enabled: true, maxTouchPoints: 0, coarsePointer: false, hoverNone: false }),
    false,
    'Custom keyboard should not be eligible on desktop-style devices.'
  );
  assertEqual(
    isCustomTouchKeyboardAvailable({ maxTouchPoints: 0, coarsePointer: false, hoverNone: false }),
    false,
    'Keyboard preference should not be shown on desktop-style devices.'
  );
  assertEqual(
    shouldUseCustomTouchKeyboard({ enabled: false, maxTouchPoints: 5, coarsePointer: true }),
    false,
    'User fallback setting should disable the custom keyboard.'
  );
  assertEqual(
    isCustomTouchKeyboardAvailable({ maxTouchPoints: 5, coarsePointer: true, forcedColors: true }),
    false,
    'Keyboard preference should not be shown when custom keyboard fallback is required.'
  );
  assertEqual(
    shouldUseCustomTouchKeyboard({ enabled: true, maxTouchPoints: 5, coarsePointer: true, forcedColors: true }),
    false,
    'Forced colors should use the native keyboard fallback path.'
  );
}

{
  assertEqual(TOUCH_KEYBOARD_ROWS[0].join(' '), 'CH DD FF NG LL PH RH TH', 'Welsh digraph row should remain fixed.');
  assertEqual(TOUCH_KEYBOARD_ROWS[3][0], '^', 'Accent affordance should be on the final row.');
  assertEqual(TOUCH_KEYBOARD_ROWS[3][8], '’', 'Curly apostrophe should be available for Welsh phrase input.');
}

{
  const result = processPracticeInput({
    targetAnswer: 'chwarae',
    letters: createInitialPracticeLetters('chwarae'),
    rawInput: 'CH',
    mode: 'flexible'
  });

  assertEqual(committedValue(result.letters).slice(0, 2), 'ch', 'Digraph taps should feed both letters through existing validation.');
  assertEqual(findNextInputIndex('chwarae', result.letters), 2, 'Digraph input should advance by the valid sequence length.');
}

{
  const answer = 'e-chwarae';
  const result = processPracticeInput({
    targetAnswer: answer,
    letters: createInitialPracticeLetters(answer),
    rawInput: 'eCHwarae',
    mode: 'flexible'
  });

  assertEqual(result.completed, true, 'Digraph taps should use the same validation path safely after fixed hyphen punctuation.');
  assertEqual(committedValue(result.letters), answer, 'Digraph input after a fixed hyphen should preserve the canonical hyphenated answer.');
}

{
  const result = processPracticeInput({
    targetAnswer: 'coffi',
    letters: createInitialPracticeLetters('coffi'),
    rawInput: 'CH',
    mode: 'flexible'
  });

  assertEqual(committedValue(result.letters), 'c____', 'A digraph with only the first valid character should not corrupt later slots.');
  assertEqual(result.wrongFeedback?.inputPosition, 1, 'The second digraph character should fail at the current slot.');
}

{
  const answer = 'dw i’n';
  const result = processPracticeInput({
    targetAnswer: answer,
    letters: createInitialPracticeLetters(answer),
    rawInput: 'dwi’n',
    mode: 'flexible'
  });

  assertEqual(result.completed, true, 'Curly apostrophe input should complete phrase answers.');
  assertEqual(committedValue(result.letters), answer, 'Curly apostrophe input should commit the target phrase.');
}

{
  const answer = 'Dŵr';
  const result = processPracticeInput({
    targetAnswer: answer,
    letters: createInitialPracticeLetters(answer),
    rawInput: `D${WELSH_ACCENT_VARIANTS.W[0]}r`,
    mode: 'strict'
  });

  assertEqual(answerNeedsWelshAccent(answer), true, 'Accent hint should know when the current answer needs Welsh accents.');
  assertEqual(result.completed, true, 'Accent chooser input should feed strict accented validation.');
}

{
  const answer = 'chŵn';
  const result = processPracticeInput({
    targetAnswer: answer,
    letters: createInitialPracticeLetters(answer),
    rawInput: answer,
    mode: 'strict'
  });

  assertEqual(result.completed, true, 'Native keyboard input should accept Welsh digraphs and accented characters together.');
  assertEqual(committedValue(result.letters), answer, 'Native keyboard input should preserve the canonical Welsh answer.');
}

console.log('touch keyboard tests passed');
