import {
  createInitialPracticeLetters,
  findNextInputIndex,
  isCommittedAnswerComplete,
  processPracticeInput
} from '../src/lib/practice/inputFlow';

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function committedValue(letters: Array<{ value: string }>) {
  return letters.map(letter => letter.value || '_').join('');
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

console.log('practice input flow tests passed');
