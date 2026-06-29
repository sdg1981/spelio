import {
  createInitialPracticeLetters,
  findNextInputIndex,
  isCommittedAnswerComplete,
  isFixedAnswerPunctuation,
  processPracticeInput
} from '../src/lib/practice/inputFlow';
import { findSupportWordList } from '../src/data/supportWordLists';
import { wordLists } from '../src/data/wordLists';

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function committedValue(letters: Array<{ value: string }>) {
  return letters.map(letter => letter.value || '_').join('');
}

{
  const answer = 'e-bost';
  const initialLetters = createInitialPracticeLetters(answer);

  assertEqual(isFixedAnswerPunctuation('-'), true, 'Hyphens should be classified as fixed answer punctuation.');
  assertEqual(committedValue(initialLetters), '_-____', 'Hyphens should render from the initial letter state instead of as hidden slots.');
  assertEqual(findNextInputIndex(answer, initialLetters), 0, 'The first editable slot in a hyphenated answer should be the first letter.');

  const afterFirstLetter = processPracticeInput({
    targetAnswer: answer,
    letters: initialLetters,
    rawInput: 'e',
    mode: 'strict'
  });

  assertEqual(findNextInputIndex(answer, afterFirstLetter.letters), 2, 'Input should skip the fixed hyphen and advance to the next real letter.');
}

{
  const answer = 'e-bost';
  const result = processPracticeInput({
    targetAnswer: answer,
    letters: createInitialPracticeLetters(answer),
    rawInput: 'ebost',
    mode: 'strict'
  });

  assertEqual(result.completed, true, 'Typing a hyphenated answer without the hyphen should complete successfully.');
  assertEqual(committedValue(result.letters), answer, 'No-separator input should preserve the canonical hyphenated answer.');
}

{
  const answer = 'e-bost';
  const result = processPracticeInput({
    targetAnswer: answer,
    letters: createInitialPracticeLetters(answer),
    rawInput: 'e-bost',
    mode: 'strict'
  });

  assertEqual(result.completed, true, 'Typing a hyphenated answer with the hyphen should complete successfully.');
  assertEqual(committedValue(result.letters), answer, 'Manual hyphen input should preserve the canonical hyphenated answer.');
}

{
  const answer = 'e-bost';
  const result = processPracticeInput({
    targetAnswer: answer,
    letters: createInitialPracticeLetters(answer),
    rawInput: 'e bost',
    mode: 'strict'
  });

  assertEqual(result.completed, true, 'Typing a hyphenated answer with a normal space at the separator should complete successfully.');
  assertEqual(committedValue(result.letters), answer, 'Manual space input should preserve the canonical hyphenated answer.');
}

{
  const answer = 'e-bost';
  const result = processPracticeInput({
    targetAnswer: answer,
    letters: createInitialPracticeLetters(answer),
    rawInput: 'ex',
    mode: 'strict'
  });

  assertEqual(result.wrongFeedback?.inputPosition, 2, 'A wrong next letter after a fixed hyphen should be rejected on the next editable slot.');
  assertEqual(result.completed, false, 'A wrong next letter after a fixed hyphen should not complete the answer.');
  assertEqual(committedValue(result.letters), 'e-____', 'A wrong next letter after a fixed hyphen should not overwrite the canonical punctuation.');
}

{
  const answer = 'e-bost';
  const firstRevealIndex = findNextInputIndex(answer, createInitialPracticeLetters(answer));
  const afterFirstReveal = createInitialPracticeLetters(answer).map((letter, index) =>
    index === firstRevealIndex ? { value: answer[index], revealed: true } : letter
  );

  assertEqual(firstRevealIndex, 0, 'Reveal should start with the first editable character in a hyphenated answer.');
  assertEqual(findNextInputIndex(answer, afterFirstReveal, firstRevealIndex + 1), 2, 'Reveal should skip fixed hyphen punctuation when finding the next editable character.');
}

{
  const answer = 'gweithio yma';
  const result = processPracticeInput({
    targetAnswer: answer,
    letters: createInitialPracticeLetters(answer),
    rawInput: 'gwex',
    mode: 'flexible'
  });

  assertEqual(result.wrongFeedback?.inputPosition, 3, 'A wrong character at position 3 should be reported on the current slot.');
  assertEqual(findNextInputIndex(answer, result.letters), 3, 'The cursor should not advance after a wrong character.');
  assertEqual(result.letters[3]?.value, '', 'The wrong character should not be committed.');
}

{
  const answer = 'gweithio yma';
  const result = processPracticeInput({
    targetAnswer: answer,
    letters: createInitialPracticeLetters(answer),
    rawInput: 'gwexithioyma',
    mode: 'flexible'
  });

  assertEqual(committedValue(result.letters), 'gwe_____ ___', 'Rapid input after a wrong character should not commit the wrong character or later characters.');
  assertEqual(findNextInputIndex(answer, result.letters), 3, 'Rapid input after a wrong character should leave the cursor on the wrong slot.');
}

{
  const answer = 'gweithio yma';
  const result = processPracticeInput({
    targetAnswer: answer,
    letters: createInitialPracticeLetters(answer),
    rawInput: 'gweitxio',
    mode: 'flexible'
  });

  assertEqual(result.wrongFeedback?.inputPosition, 5, 'Batched mobile-style input should stop at the first wrong character.');
  assertEqual(committedValue(result.letters), 'gweit___ ___', 'Batched input should only commit characters before the first wrong character.');
}

{
  const answer = 'abc';
  const corruptedLetters = [{ value: 'a' }, { value: 'x' }, { value: 'c' }];
  const result = processPracticeInput({
    targetAnswer: answer,
    letters: corruptedLetters,
    rawInput: 'z',
    mode: 'strict'
  });

  assertEqual(isCommittedAnswerComplete(answer, corruptedLetters, 'strict'), false, 'Completion should fail when a committed slot does not match the target.');
  assertEqual(result.completed, false, 'Processing input should not complete a corrupted committed answer.');
}

{
  const answer = 'gweithio yma';
  const result = processPracticeInput({
    targetAnswer: answer,
    letters: createInitialPracticeLetters(answer),
    rawInput: 'gweithio yma',
    mode: 'flexible'
  });

  assertEqual(result.completed, true, 'Typed spaces should be ignored while the phrase still completes.');
  assertEqual(committedValue(result.letters), answer, 'Ignoring typed spaces should preserve the target phrase spacing in committed state.');
}

{
  const answer = 'Dŵr';
  const result = processPracticeInput({
    targetAnswer: answer,
    letters: createInitialPracticeLetters(answer),
    rawInput: 'Dwr',
    mode: 'flexible'
  });

  assertEqual(result.completed, true, 'Flexible spelling mode should accept valid unaccented equivalents.');
  assertEqual(committedValue(result.letters), answer, 'Flexible accepted input should commit the target accented character.');
}

{
  const answer = 'Dŵr';
  const result = processPracticeInput({
    targetAnswer: answer,
    letters: createInitialPracticeLetters(answer),
    rawInput: 'Dwr',
    mode: 'strict'
  });

  assertEqual(result.wrongFeedback?.inputPosition, 1, 'Strict mode should reject a missing accent on the current slot.');
  assertEqual(result.completed, false, 'Strict mode should not complete when an accent is wrong.');
  assertEqual(committedValue(result.letters), 'D__', 'Strict mode should not commit the wrong unaccented character.');
}

{
  const supportFf = findSupportWordList(wordLists, 'support_ff');
  const coffi = supportFf?.words.find(word => word.welshAnswer === 'coffi');
  if (!supportFf || !coffi) throw new Error('Expected support_ff/coffi fixture to exist');

  const firstLetter = processPracticeInput({
    targetAnswer: coffi.welshAnswer,
    letters: createInitialPracticeLetters(coffi.welshAnswer),
    rawInput: 'c',
    mode: 'flexible'
  });

  assertEqual(firstLetter.completed, false, 'Typing only the first letter of support_ff/coffi must not complete the word.');
  assertEqual(findNextInputIndex(coffi.welshAnswer, firstLetter.letters), 1, 'After one correct letter, support_ff/coffi should remain on the second slot.');
  assertEqual(committedValue(firstLetter.letters), 'c____', 'Only the first letter of support_ff/coffi should be committed.');

  const fullWord = processPracticeInput({
    targetAnswer: coffi.welshAnswer,
    letters: firstLetter.letters,
    rawInput: 'offi',
    mode: 'flexible'
  });

  assertEqual(fullWord.completed, true, 'Completing support_ff/coffi should require all remaining letters.');
  assertEqual(committedValue(fullWord.letters), 'coffi', 'support_ff/coffi should complete to the exact answer.');
}

console.log('practice input flow tests passed');
