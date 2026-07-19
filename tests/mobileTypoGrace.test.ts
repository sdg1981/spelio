import { getKeyboardBaseCharacter, isAdjacentQwertyKey, isDirectMobileTypoReplacement, shouldOfferMobileTypoGrace } from '../src/lib/practice/mobileTypoGrace';
import { detectTypoGracePlatform, summarizeTypoGraceAggregates } from '../src/lib/practice/typoGraceAnalyticsModel';
import { createInitialPracticeLetters, findNextInputIndex, processPracticeInput } from '../src/lib/practice/inputFlow';
import { createPracticeAnswer, validateLetter } from '../src/lib/practice/validator';

declare function require(name: string): { readFileSync?: (path: string, encoding: string) => string };
const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
}

function assertIncludes(source: string, fragment: string, message: string) {
  assertEqual(source.includes(fragment), true, message);
}

assertEqual(isAdjacentQwertyKey('s', 'w'), true, 'A diagonal neighbour should be eligible.');
assertEqual(isAdjacentQwertyKey('E', 'w'), true, 'QWERTY adjacency should be case-insensitive.');
assertEqual(isAdjacentQwertyKey('p', 'q'), false, 'A distant key must not be eligible.');
assertEqual(isAdjacentQwertyKey('w', 'w'), false, 'A key must never be adjacent to itself.');
assertEqual(isAdjacentQwertyKey('ŵ', 'w'), false, 'Accent-to-base normalization must not make the same physical key adjacent to itself.');
assertEqual(isAdjacentQwertyKey('c', 'ch'), false, 'Welsh digraphs must continue through ordinary per-character validation.');

const supportedKeyboardBases = {
  á: 'a', à: 'a', â: 'a', ä: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ŵ: 'w', ŷ: 'y'
} as const;
for (const [accented, base] of Object.entries(supportedKeyboardBases)) {
  assertEqual(getKeyboardBaseCharacter(accented), base, `${accented} should resolve to its physical QWERTY key.`);
  assertEqual(getKeyboardBaseCharacter(accented.toLocaleUpperCase('cy')), base, `${accented.toLocaleUpperCase('cy')} should resolve like its lowercase form.`);
}
assertEqual(getKeyboardBaseCharacter('o\u0302'), 'o', 'A decomposed accented character should resolve like its precomposed form.');
assertEqual(getKeyboardBaseCharacter('ab'), null, 'Unsupported multi-character input should not receive adjacency classification.');
assertEqual(isAdjacentQwertyKey('i', 'ô'), true, 'Expected ô should use the physical o key for adjacency.');
assertEqual(isAdjacentQwertyKey('i', 'o\u0302'), true, 'Decomposed ô should use the same physical o key.');
assertEqual(isAdjacentQwertyKey('a', 'ô'), false, 'A clearly non-adjacent key should remain an immediate error for ô.');
for (const neighbour of ['q', 'e', 'a', 's']) {
  assertEqual(isAdjacentQwertyKey(neighbour, 'ŵ'), true, `Expected ŵ should use w adjacency for ${neighbour}.`);
}
for (const neighbour of ['t', 'u', 'g', 'h']) {
  assertEqual(isAdjacentQwertyKey(neighbour, 'ŷ'), true, `Expected ŷ should use y adjacency for ${neighbour}.`);
}

const eligibilityBase = { attempted: 's', expected: 'w', mobileTouchInput: true, strictAssessmentMode: false, alreadyUsedAtPosition: false };
assertEqual(shouldOfferMobileTypoGrace(eligibilityBase), true, 'An adjacent mobile touch should receive grace.');
assertEqual(shouldOfferMobileTypoGrace({ ...eligibilityBase, mobileTouchInput: false }), false, 'Desktop input must remain strict.');
assertEqual(shouldOfferMobileTypoGrace({ ...eligibilityBase, strictAssessmentMode: true }), false, 'Strict assessment mode must disable grace.');
assertEqual(shouldOfferMobileTypoGrace({ ...eligibilityBase, alreadyUsedAtPosition: true }), false, 'Grace must be offered only once per position.');
assertEqual(shouldOfferMobileTypoGrace({ ...eligibilityBase, attempted: 'p' }), false, 'Non-adjacent mobile errors must remain immediate.');
assertEqual(shouldOfferMobileTypoGrace({ ...eligibilityBase, attempted: 'i', expected: 'ô' }), true, 'Mobile i should trigger pending grace when ô is expected.');
assertEqual(shouldOfferMobileTypoGrace({ ...eligibilityBase, attempted: 'a', expected: 'ô' }), false, 'Mobile a should remain immediately wrong when ô is expected.');
assertEqual(isDirectMobileTypoReplacement({ rawInput: 'h', expected: 'h', mode: 'strict' }), true, 'The expected character should directly replace a pending adjacent typo.');
assertEqual(isDirectMobileTypoReplacement({ rawInput: 'k', expected: 'h', mode: 'strict' }), false, 'A second incorrect character must not directly replace a pending typo.');
assertEqual(isDirectMobileTypoReplacement({ rawInput: 'hh', expected: 'h', mode: 'strict' }), false, 'Only one newly typed character can directly replace a pending typo.');
assertEqual(isDirectMobileTypoReplacement({ rawInput: 'ô', expected: 'ô', mode: 'strict' }), true, 'Strict mode should directly replace a pending typo with the correct accent.');
assertEqual(isDirectMobileTypoReplacement({ rawInput: 'o', expected: 'ô', mode: 'strict' }), false, 'Strict mode must not treat the unaccented base key as a correct replacement.');
assertEqual(isDirectMobileTypoReplacement({ rawInput: 'o', expected: 'ô', mode: 'flexible' }), true, 'Flexible mode should preserve its accepted unaccented direct replacement.');
assertEqual(isDirectMobileTypoReplacement({ rawInput: 'o\u0302', expected: 'ô', mode: 'strict' }), true, 'A decomposed correct accent should directly replace consistently.');
assertEqual(validateLetter('o', 'ô', 'strict'), false, 'Strict correctness must still reject a missing accent.');
assertEqual(validateLetter('o', 'ô', 'flexible'), true, 'Flexible correctness must still accept its supported unaccented equivalent.');

const correct = processPracticeInput({ targetAnswer: 'wel', letters: createInitialPracticeLetters('wel'), rawInput: 'w', mode: 'strict' });
assertEqual(findNextInputIndex('wel', correct.letters), 1, 'A correct mobile character should still advance immediately.');
assertEqual(correct.wrongFeedback, null, 'An exact expected character must finish normal validation before typo grace is considered.');
assertEqual(
  shouldOfferMobileTypoGrace({ ...eligibilityBase, attempted: 'w', expected: 'w' }),
  false,
  'An exact expected character must never be eligible for typo grace.'
);
const wrong = processPracticeInput({ targetAnswer: 'wel', letters: createInitialPracticeLetters('wel'), rawInput: 'p', mode: 'strict' });
assertEqual(wrong.wrongFeedback?.inputPosition, 0, 'A non-adjacent wrong character should retain immediate feedback.');
const accented = processPracticeInput({ targetAnswer: 'dŵr', letters: createInitialPracticeLetters('dŵr'), rawInput: 'dŵr', mode: 'strict' });
assertEqual(accented.completed, true, 'Strict accented Welsh input must still complete normally.');
const decomposedAnswer = createPracticeAnswer('ffo\u0302n');
const decomposedInput = processPracticeInput({ targetAnswer: decomposedAnswer, letters: createInitialPracticeLetters(decomposedAnswer), rawInput: 'ffo\u0302n', mode: 'strict' });
assertEqual(decomposedInput.completed, true, 'Decomposed Unicode input should complete as the same accented spelling.');
const digraph = processPracticeInput({ targetAnswer: 'chwarae', letters: createInitialPracticeLetters('chwarae'), rawInput: 'ch', mode: 'strict' });
assertEqual(findNextInputIndex('chwarae', digraph.letters), 2, 'Welsh digraph typing must still advance one authoritative character at a time.');

assertEqual(detectTypoGracePlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)'), 'ios', 'iPhone should use the broad iOS dimension.');
assertEqual(detectTypoGracePlatform('Mozilla/5.0 (Linux; Android 15)'), 'android', 'Android should use the broad Android dimension.');
const summary = summarizeTypoGraceAggregates([
  { eventName: 'mobile_adjacent_typo_detected', platform: 'ios', practiceContext: 'foundations', strictMode: false, count: 4 },
  { eventName: 'mobile_adjacent_typo_corrected_backspace', platform: 'ios', practiceContext: 'foundations', strictMode: false, count: 2 },
  { eventName: 'mobile_adjacent_typo_corrected_direct', platform: 'ios', practiceContext: 'foundations', strictMode: false, count: 1 },
  { eventName: 'mobile_adjacent_typo_committed_wrong', platform: 'android', practiceContext: 'practice_library', strictMode: false, count: 1 }
]);
assertEqual(summary.detected, 4, 'Admin totals should sum detected adjacent typos.');
assertEqual(summary.correctedBackspace, 2, 'Admin totals should distinguish Backspace corrections.');
assertEqual(summary.correctedDirect, 1, 'Admin totals should distinguish direct replacements.');
assertEqual(summary.corrected, 3, 'Admin totals should sum both correction paths.');
assertEqual(summary.committedWrong, 1, 'Admin totals should sum committed errors.');
assertEqual(summary.correctionRate, 75, 'Admin correction rate should include both correction paths.');
assertEqual(summary.byPlatform.ios.detected, 4, 'Admin platform breakdown should preserve broad iOS totals.');

const legacySummary = summarizeTypoGraceAggregates([
  { eventName: 'mobile_adjacent_typo_grace_triggered', platform: 'android', practiceContext: 'other', strictMode: false, count: 2 },
  { eventName: 'mobile_adjacent_typo_corrected', platform: 'android', practiceContext: 'other', strictMode: false, count: 1 }
]);
assertEqual(legacySummary.detected, 2, 'Existing detected counters should remain visible after the counter split.');
assertEqual(legacySummary.correctedBackspace, 1, 'Existing correction counters should map to the former Backspace-only path.');

const practiceSource = readFileSync('src/components/Practice.tsx', 'utf8');
const hookSource = readFileSync('src/hooks/usePracticeSession.ts', 'utf8');
const analyticsSource = readFileSync('src/lib/practice/typoGraceAnalytics.ts', 'utf8');
const stylesSource = readFileSync('src/styles.css', 'utf8');
const migrationSource = [
  readFileSync('supabase/migrations/202607150001_mobile_typo_grace_aggregate_counters.sql', 'utf8'),
  readFileSync('supabase/migrations/202607150002_split_mobile_typo_grace_corrections.sql', 'utf8')
].join('\n');

assertIncludes(practiceSource, 'nativeInputCoordinatorRef.current?.handleInput(', 'Native input must pass through the single input coordinator.');
assertIncludes(practiceSource, 'input => handlePracticeInput(input, { mobileTouchInput: true })', 'Native input values should be the mobile grace entry point.');
assertIncludes(practiceSource, 'event.target !== mobileInputRef.current && event.key.length === 1', 'Global printable keydown must still exclude the authoritative native input.');
assertIncludes(practiceSource, 'strictAssessmentMode: practiceTestMode', 'Practice test mode must explicitly disable grace.');
assertIncludes(hookSource, 'mobileTypoGraceUsedPositionsRef.current.add(pending.inputPosition)', 'A grace opportunity should be consumed at its answer position.');
assertIncludes(hookSource, 'if (directPendingReplacement)', 'A correct direct replacement should bypass pending-error commitment.');
assertIncludes(hookSource, "onMobileTypoGraceEvent?.('mobile_adjacent_typo_corrected_backspace'", 'A Backspace correction should emit its aggregate outcome.');
assertIncludes(hookSource, "onMobileTypoGraceEvent?.('mobile_adjacent_typo_corrected_direct'", 'A direct replacement should emit its aggregate outcome.');
assertIncludes(hookSource, "onMobileTypoGraceEvent?.('mobile_adjacent_typo_committed_wrong'", 'Continuing should emit one committed-wrong outcome.');
assertEqual((hookSource.match(/onMobileTypoGraceEvent\?\.\('mobile_adjacent_typo_detected'/g) ?? []).length, 1, 'Detected telemetry should have one emission point.');
assertEqual((hookSource.match(/onMobileTypoGraceEvent\?\.\('mobile_adjacent_typo_corrected_backspace'/g) ?? []).length, 1, 'Backspace-corrected telemetry should have one emission point.');
assertEqual((hookSource.match(/onMobileTypoGraceEvent\?\.\('mobile_adjacent_typo_corrected_direct'/g) ?? []).length, 1, 'Direct-corrected telemetry should have one emission point.');
assertEqual((hookSource.match(/onMobileTypoGraceEvent\?\.\('mobile_adjacent_typo_committed_wrong'/g) ?? []).length, 1, 'Committed-wrong telemetry should have one emission point.');
assertIncludes(hookSource, 'resetMobileTypoGrace();', 'New words and reset sessions should clear pending state.');
assertIncludes(stylesSource, '.letter-slot.pending-typo', 'Pending characters should have a dedicated neutral visual state.');
assertIncludes(analyticsSource, 'p_event_name: eventName', 'Telemetry should send only the aggregate event name.');
assertIncludes(analyticsSource, 'p_platform: platform', 'Telemetry should send only a broad platform.');
assertEqual(/p_(word|expected|typed|answer|user|device|email|name)/.test(analyticsSource), false, 'Telemetry payloads must not include raw content or identifiers.');
assertIncludes(migrationSource, 'event_count bigint', 'The database should store aggregate counters.');
assertEqual(/learner_answer|expected_letter|typed_letter|word_id|user_id|device_id/.test(migrationSource), false, 'The aggregate table must not contain raw content or identifiers.');

console.log('mobile typo grace tests passed');
