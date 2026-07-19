import {
  createInitialPracticeLetters,
  findNextInputIndex,
  isCommittedAnswerComplete,
  isFixedAnswerPunctuation,
  processPracticeInput,
  removeLastPracticeInput
} from '../src/lib/practice/inputFlow';
import { createNativeInputCoordinator, type NativeInputScheduler } from '../src/lib/practice/nativeInput';
import {
  isPracticeInputDiagnosticsEnabled,
  safeCharacterCount,
  toNormalizedUnicodeCodePoints,
  toUnicodeCodePoints
} from '../src/lib/practice/inputDiagnostics';
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

declare function require(name: string): {
  readFileSync?: (path: string, encoding: string) => string;
};

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};

const practiceSource = readFileSync('src/components/Practice.tsx', 'utf8');

assertEqual(
  practiceSource.includes('event.target !== mobileInputRef.current && event.key.length === 1'),
  true,
  'Printable keys from the focused native input must not also run through the global keydown path.'
);
assertEqual(
  practiceSource.includes("decision: 'printable-keydown-suppressed'"),
  true,
  'The diagnostic must confirm printable keydown is suppressed for the authoritative native input.'
);
assertEqual(
  practiceSource.includes('nativeInputCoordinatorRef.current?.handleInput('),
  true,
  'The native input event must use the single input coordinator.'
);
assertEqual(
  practiceSource.includes('nativeInputCoordinatorRef.current?.endComposition({'),
  true,
  'Composition completion must use the coordinator fallback instead of validating directly.'
);
assertEqual(
  practiceSource.includes('onBeforeInput='),
  true,
  'The opt-in diagnostic should observe beforeinput without making it authoritative.'
);
assertEqual(
  practiceSource.includes("eventType: 'beforeinput'") && practiceSource.includes("decision: 'observed-only'"),
  true,
  'beforeinput must remain trace-only and must not validate printable characters.'
);
assertEqual(isPracticeInputDiagnosticsEnabled('?input-debug=1'), true, 'The diagnostic should require its narrow query opt-in.');
assertEqual(isPracticeInputDiagnosticsEnabled('?input-debug=0'), false, 'The diagnostic must remain disabled in normal use.');
assertEqual(toUnicodeCodePoints('ŵ'), 'U+0175', 'Diagnostics should report code points instead of literal answer text.');
assertEqual(toUnicodeCodePoints('o\u0302'), 'U+00F4', 'Diagnostic code points should use canonical NFC form.');
assertEqual(toNormalizedUnicodeCodePoints('Ŵ'), 'U+0175', 'Diagnostic comparison output should expose normalized case-insensitive code points.');
assertEqual(safeCharacterCount('o\u0302'), 1, 'Diagnostic character counts should treat decomposed input as one logical character.');

function createManualNativeInputScheduler() {
  let nextTask = 1;
  const tasks = new Map<number, () => void>();
  const scheduler: NativeInputScheduler = {
    schedule(callback) {
      const task = nextTask;
      nextTask += 1;
      tasks.set(task, callback);
      return task as ReturnType<typeof setTimeout>;
    },
    cancel(task) {
      tasks.delete(task as number);
    }
  };

  return {
    scheduler,
    get size() {
      return tasks.size;
    },
    flush() {
      const queued = [...tasks.values()];
      tasks.clear();
      for (const task of queued) task();
    }
  };
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];
  const context = { wordId: 'word-cath', inputPosition: 0 };
  let value = 'c';

  coordinator.startComposition(context);
  const interim = coordinator.handleInput({
    value,
    data: 'c',
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context,
    commit: input => committed.push(input)
  });
  assertEqual(interim.committed, true, 'A composing native input must immediately validate its newly appended character.');
  assertEqual(interim.clearValue, false, 'Persistent composition input must keep its cumulative transport buffer intact.');
  coordinator.endComposition({
    data: 'c',
    readValue: () => value,
    clearValue: () => {
      value = '';
    },
    context,
    getContext: () => context,
    commit: input => committed.push(input)
  });
  const finalInput = coordinator.handleInput({
    value,
    data: 'c',
    inputType: 'insertText',
    eventIsComposing: false,
    context,
    commit: input => committed.push(input)
  });
  assertEqual(finalInput.committed, false, 'The final input must not replay the character already acknowledged while composing.');
  assertEqual(finalInput.duplicate, true, 'The final input should be recognized as an acknowledged cumulative buffer.');
  const duplicateFinalInput = coordinator.handleInput({
    value: 'c',
    data: 'c',
    inputType: 'insertText',
    eventIsComposing: false,
    context: { ...context, inputPosition: 1 },
    commit: input => committed.push(input)
  });
  assertEqual(duplicateFinalInput.duplicate, true, 'Repeated final input events in one composition cycle must be consumed.');
  value = '';
  manual.flush();

  assertEqual(committed.join(','), 'c', 'compositionend followed by input must validate one character exactly once.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];
  let context = { wordId: 'word-one', inputPosition: 0 };

  coordinator.startComposition(context);
  for (const cumulativeBuffer of ['l', 'lf', 'lfp']) {
    const result = coordinator.handleInput({
      value: cumulativeBuffer,
      data: cumulativeBuffer,
      inputType: 'insertCompositionText',
      eventIsComposing: true,
      context,
      commit: input => committed.push(input)
    });
    assertEqual(result.clearValue, false, 'Samsung composing updates must retain the cumulative hidden-input buffer.');
    context = { ...context, inputPosition: context.inputPosition + 1 };
  }

  assertEqual(committed.join(','), 'l,f,p', 'Persistent cumulative Samsung input must emit only l, then f, then p.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];
  const firstWord = { wordId: 'word-one', inputPosition: 0 };

  coordinator.startComposition(firstWord);
  coordinator.handleInput({
    value: 'c',
    data: 'c',
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context: firstWord,
    commit: input => committed.push(`one:${input}`)
  });
  const nextWord = { wordId: 'word-two', inputPosition: 0 };
  coordinator.handleInput({
    value: 'ca',
    data: 'ca',
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context: nextWord,
    commit: input => committed.push(`two:${input}`)
  });

  assertEqual(committed.join(','), 'one:c,two:a', 'A persistent composition crossing words must submit only the appended character to the next word.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];
  const firstContext = { wordId: 'word-one', inputPosition: 0 };

  coordinator.startComposition(firstContext);
  coordinator.handleInput({
    value: 'c',
    data: 'c',
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context: firstContext,
    commit: input => committed.push(input)
  });
  coordinator.reset('c');
  const refocusedContext = { wordId: 'word-two', inputPosition: 0 };
  coordinator.handleInput({
    value: 'ca',
    data: 'ca',
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context: refocusedContext,
    commit: input => committed.push(input)
  });

  assertEqual(committed.join(','), 'c,a', 'Blur/refocus must preserve the acknowledged persistent buffer and emit only the new suffix.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];
  const context = { wordId: 'word-one', inputPosition: 0 };

  coordinator.startComposition(context);
  coordinator.handleInput({
    value: 'l',
    data: 'l',
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context,
    commit: input => committed.push(input)
  });
  coordinator.handleInput({
    value: 'lf',
    data: 'lf',
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context: { ...context, inputPosition: 1 },
    commit: input => committed.push(input)
  });
  coordinator.handleInput({
    value: 'lf',
    data: 'lf',
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context: { ...context, inputPosition: 2 },
    commit: input => committed.push(input)
  });
  coordinator.endComposition({
    data: 'lf',
    readValue: () => 'lf',
    clearValue: () => undefined,
    context: { ...context, inputPosition: 2 },
    getContext: () => ({ ...context, inputPosition: 2 }),
    commit: input => committed.push(input)
  });
  manual.flush();

  assertEqual(committed.join(','), 'l,f', 'Duplicate composing input and late full-buffer compositionend must not replay acknowledged characters.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];
  let context = { wordId: 'word-one', inputPosition: 0 };

  coordinator.startComposition(context);
  coordinator.handleInput({
    value: 'l',
    data: 'l',
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context,
    commit: input => committed.push(input)
  });
  context = { ...context, inputPosition: 1 };
  coordinator.endComposition({
    data: 'l',
    readValue: () => 'l',
    clearValue: () => undefined,
    context,
    getContext: () => context,
    commit: input => committed.push(input)
  });
  coordinator.handleInput({
    value: 'f',
    data: 'f',
    inputType: 'insertText',
    eventIsComposing: false,
    context,
    commit: input => committed.push(input)
  });

  assertEqual(committed.join(','), 'l,f', 'A finalized input that replaces the ended composition transport value must start a new buffer.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];
  const context = { wordId: 'word-one', inputPosition: 0 };

  coordinator.startComposition(context);
  coordinator.handleInput({
    value: 'l',
    data: null,
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context,
    commit: input => committed.push(input)
  });
  coordinator.handleInput({
    value: 'lf',
    data: null,
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context: { ...context, inputPosition: 1 },
    commit: input => committed.push(input)
  });

  assertEqual(committed.join(','), 'l,f', 'Null-data Samsung input must derive characters from the hidden-input value delta.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];
  const context = { wordId: 'word-one', inputPosition: 0 };

  coordinator.startComposition(context);
  coordinator.handleInput({
    value: 'abc',
    data: 'abc',
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context,
    commit: input => committed.push(input)
  });
  const deletion = coordinator.handleInput({
    value: 'ab',
    data: 'ab',
    inputType: 'deleteContentBackward',
    eventIsComposing: true,
    context,
    commit: input => committed.push(input)
  });
  const replacement = coordinator.handleInput({
    value: 'ax',
    data: 'ax',
    inputType: 'insertReplacementText',
    eventIsComposing: true,
    context,
    commit: input => committed.push(input)
  });
  coordinator.handleInput({
    value: 'axy',
    data: 'axy',
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context,
    commit: input => committed.push(input)
  });

  assertEqual(deletion.committed, false, 'A shorter persistent buffer must rebase without printable validation.');
  assertEqual(replacement.committed, false, 'A non-prefix replacement must rebase without replaying old text.');
  assertEqual(committed.join(','), 'a,b,c,y', 'After deletion/replacement rebasing, only a later appended suffix may be emitted.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const answer = 'lfp';
  let letters = createInitialPracticeLetters(answer);
  let incorrectFeedbackCount = 0;
  let context = { wordId: 'word-lfp', inputPosition: 0 };
  const commit = (input: string) => {
    const result = processPracticeInput({
      targetAnswer: answer,
      letters,
      rawInput: input,
      mode: 'strict'
    });
    letters = result.letters;
    if (result.wrongFeedback) incorrectFeedbackCount += 1;
    context = { ...context, inputPosition: findNextInputIndex(answer, letters) };
  };

  coordinator.startComposition(context);
  for (const cumulativeBuffer of ['l', 'lf', 'lfp']) {
    coordinator.handleInput({
      value: cumulativeBuffer,
      data: cumulativeBuffer,
      inputType: 'insertCompositionText',
      eventIsComposing: true,
      context,
      commit
    });
  }

  assertEqual(committedValue(letters), answer, 'Exact correct persistent-composition characters must complete the answer.');
  assertEqual(incorrectFeedbackCount, 0, 'Exact correct persistent-composition input must never produce red-X feedback.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const answer = 'cat';
  let letters = createInitialPracticeLetters(answer);
  let incorrectFeedbackCount = 0;
  const context = { wordId: 'word-cat', inputPosition: 0 };

  coordinator.startComposition(context);
  coordinator.handleInput({
    value: 'x',
    data: 'x',
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context,
    commit: input => {
      const result = processPracticeInput({
        targetAnswer: answer,
        letters,
        rawInput: input,
        mode: 'strict'
      });
      letters = result.letters;
      if (result.wrongFeedback) incorrectFeedbackCount += 1;
    }
  });
  coordinator.handleInput({
    value: 'x',
    data: 'x',
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context,
    commit: () => {
      incorrectFeedbackCount += 1;
    }
  });

  assertEqual(incorrectFeedbackCount, 1, 'One wrong cumulative-buffer update must produce one error only.');
  assertEqual(committedValue(letters), '___', 'Wrong persistent-composition input must not advance the answer.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];
  const context = { wordId: 'word-dwr', inputPosition: 1 };
  let value = 'ŵ';

  coordinator.startComposition(context);
  coordinator.endComposition({
    data: 'ŵ',
    readValue: () => value,
    clearValue: () => {
      value = '';
    },
    context,
    getContext: () => context,
    commit: input => committed.push(input)
  });
  manual.flush();

  assertEqual(committed.join(','), 'ŵ', 'A browser that omits final input must retain one composition fallback.');
  assertEqual(value, '', 'The composition fallback must clear the hidden input after committing.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];
  const originalContext = { wordId: 'word-cath', inputPosition: 0 };
  const advancedContext = { wordId: 'word-cath', inputPosition: 1 };
  let context = originalContext;
  let value = 'c';

  coordinator.startComposition(context);
  coordinator.endComposition({
    data: 'c',
    readValue: () => value,
    clearValue: () => {
      value = '';
    },
    context,
    getContext: () => context,
    commit: input => {
      committed.push(input);
      context = advancedContext;
    }
  });
  manual.flush();
  assertEqual(committed.join(','), 'c', 'The fallback should commit a genuinely missing final input once.');

  value = 'c';
  const lateInput = coordinator.handleInput({
    value: `acknowledged${value}`,
    data: null,
    inputType: 'insertText',
    eventIsComposing: false,
    context,
    commit: input => committed.push(input)
  });
  assertEqual(lateInput.duplicate, true, 'A late full hidden-input value must match the consumed composition suffix.');
  assertEqual(lateInput.committed, false, 'A late matching input must not validate against the advanced answer position.');
  assertEqual(committed.join(','), 'c', 'Late final input must not duplicate scoring or answer advancement.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];
  const context = { wordId: 'word-cath', inputPosition: 0 };
  let value = 'c';

  coordinator.startComposition(context);
  coordinator.endComposition({
    data: 'c',
    readValue: () => value,
    clearValue: () => {
      value = '';
    },
    context,
    getContext: () => context,
    commit: input => committed.push(input)
  });
  manual.flush();
  for (let index = 0; index < 2; index += 1) {
    coordinator.handleInput({
      value: 'c',
      data: 'c',
      inputType: index === 0 ? 'insertCompositionText' : 'insertText',
      eventIsComposing: false,
      context: { ...context, inputPosition: 1 },
      commit: input => committed.push(input)
    });
  }
  assertEqual(committed.join(','), 'c', 'compositionend plus multiple matching input events must remain idempotent.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];
  const context = { wordId: 'word-chwarae', inputPosition: 1 };

  const result = coordinator.handleInput({
    value: 'previoush',
    data: 'h',
    inputType: 'insertText',
    eventIsComposing: false,
    context,
    commit: input => committed.push(input)
  });
  assertEqual(result.value, 'h', 'A complete hidden-input value must yield only the newly inserted data.');
  assertEqual(committed.join(','), 'h', 'Previously consumed hidden-input text must not be replayed.');
  coordinator.acknowledgeValueCleared();

  coordinator.handleInput({
    value: 'ch',
    data: 'ch',
    inputType: 'insertText',
    eventIsComposing: false,
    context: { ...context, inputPosition: 2 },
    commit: input => committed.push(input)
  });
  assertEqual(committed.join(','), 'h,c,h', 'Intentional multi-character commits must emit each logical character sequentially.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];

  coordinator.handleInput({
    value: 'c',
    data: 'c',
    inputType: 'insertText',
    eventIsComposing: false,
    context: { wordId: 'word-ch', inputPosition: 0 },
    commit: input => committed.push(input)
  });
  const fullValue = coordinator.handleInput({
    value: 'ch',
    data: null,
    inputType: 'insertText',
    eventIsComposing: false,
    context: { wordId: 'word-ch', inputPosition: 1 },
    commit: input => committed.push(input)
  });

  assertEqual(fullValue.value, 'h', 'A data-less complete hidden-input value must be reduced against the acknowledged prefix.');
  assertEqual(committed.join(','), 'c,h', 'Previously acknowledged characters must not be submitted again.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];
  const originalContext = { wordId: 'word-cath', inputPosition: 0 };
  let context = originalContext;

  coordinator.startComposition(context);
  coordinator.endComposition({
    data: '',
    readValue: () => 'c',
    clearValue: () => undefined,
    context,
    getContext: () => context,
    commit: input => committed.push(input)
  });
  context = { ...context, inputPosition: 1 };
  manual.flush();
  assertEqual(committed.length, 0, 'A fallback must become stale after Reveal or answer-index advancement.');

  context = { wordId: 'next-word', inputPosition: 0 };
  coordinator.startComposition(originalContext);
  coordinator.endComposition({
    data: 'c',
    readValue: () => 'c',
    clearValue: () => undefined,
    context: originalContext,
    getContext: () => context,
    commit: input => committed.push(input)
  });
  manual.flush();
  assertEqual(committed.length, 0, 'A fallback from a previous word must not commit after transition.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];
  const context = { wordId: 'word-cath', inputPosition: 0 };

  coordinator.startComposition(context);
  coordinator.endComposition({
    data: 'c',
    readValue: () => 'c',
    clearValue: () => undefined,
    context,
    getContext: () => context,
    commit: input => committed.push(input)
  });
  coordinator.reset();
  manual.flush();
  assertEqual(committed.length, 0, 'Reset on blur or unmount must cancel a pending fallback.');

  const deletion = coordinator.handleInput({
    value: '',
    data: null,
    inputType: 'deleteContentBackward',
    eventIsComposing: false,
    context,
    commit: input => committed.push(input)
  });
  assertEqual(deletion.committed, false, 'Deletion events must never validate printable characters.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const answer = 'ca';
  let letters = createInitialPracticeLetters(answer);
  let incorrectFeedbackCount = 0;
  let context = { wordId: 'word-ca', inputPosition: 0 };
  const commit = (input: string) => {
    const result = processPracticeInput({
      targetAnswer: answer,
      letters,
      rawInput: input,
      mode: 'strict'
    });
    letters = result.letters;
    if (result.wrongFeedback) incorrectFeedbackCount += 1;
    context = {
      ...context,
      inputPosition: findNextInputIndex(answer, letters)
    };
  };

  coordinator.startComposition(context);
  coordinator.endComposition({
    data: 'c',
    readValue: () => 'c',
    clearValue: () => undefined,
    context,
    getContext: () => context,
    commit
  });
  manual.flush();
  coordinator.handleInput({
    value: 'c',
    data: 'c',
    inputType: 'insertText',
    eventIsComposing: false,
    context,
    commit
  });

  assertEqual(committedValue(letters), 'c_', 'A fallback plus late input must advance the answer exactly once.');
  assertEqual(context.inputPosition, 1, 'A late duplicate must leave validation on the next expected position.');
  assertEqual(incorrectFeedbackCount, 0, 'A late duplicate correct letter must not produce red-X feedback.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];
  const context = { wordId: 'word-ffon', inputPosition: 2 };

  coordinator.startComposition(context);
  coordinator.endComposition({
    data: 'o\u0302',
    readValue: () => 'o\u0302',
    clearValue: () => undefined,
    context,
    getContext: () => context,
    commit: input => committed.push(input)
  });
  manual.flush();
  const duplicate = coordinator.handleInput({
    value: 'ô',
    data: 'ô',
    inputType: 'insertText',
    eventIsComposing: false,
    context: { ...context, inputPosition: 3 },
    commit: input => committed.push(input)
  });

  assertEqual(committed.join(','), 'ô', 'Composition payloads should commit in NFC form.');
  assertEqual(duplicate.duplicate, true, 'Precomposed and decomposed late input must share one consumed fingerprint.');
}

{
  const manual = createManualNativeInputScheduler();
  const coordinator = createNativeInputCoordinator(manual.scheduler);
  const committed: string[] = [];
  const context = { wordId: 'word-ffon', inputPosition: 2 };

  coordinator.startComposition(context);
  coordinator.handleInput({
    value: 'o\u0302',
    data: 'o\u0302',
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context,
    commit: input => committed.push(input)
  });
  const duplicate = coordinator.handleInput({
    value: 'ô',
    data: 'ô',
    inputType: 'insertCompositionText',
    eventIsComposing: true,
    context: { ...context, inputPosition: 3 },
    commit: input => committed.push(input)
  });

  assertEqual(committed.join(','), 'ô', 'Persistent composition must emit decomposed Welsh input in NFC form.');
  assertEqual(duplicate.duplicate, true, 'Canonically equivalent cumulative buffers must not emit twice.');
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
  const answer = 'cath';
  let letters = createInitialPracticeLetters(answer);
  for (const character of answer) {
    const previousPosition = findNextInputIndex(answer, letters);
    const result = processPracticeInput({
      targetAnswer: answer,
      letters,
      rawInput: character,
      mode: 'strict'
    });
    letters = result.letters;
    assertEqual(findNextInputIndex(answer, letters), previousPosition + 1 < answer.length ? previousPosition + 1 : -1, 'Each slow native input event should advance exactly one position.');
  }
  assertEqual(committedValue(letters), answer, 'Slow sequential native typing should complete a correct word without stale validation.');
}

{
  const answer = 'dŵr';
  const typed = processPracticeInput({
    targetAnswer: answer,
    letters: createInitialPracticeLetters(answer),
    rawInput: answer,
    mode: 'strict'
  });
  const deleted = removeLastPracticeInput(answer, typed.letters);
  assertEqual(committedValue(deleted), 'dŵ_', 'Backspace should remove exactly the latest typed character.');

  const retyped = processPracticeInput({
    targetAnswer: answer,
    letters: deleted,
    rawInput: 'r',
    mode: 'strict'
  });
  assertEqual(retyped.completed, true, 'Deleting and retyping should preserve strict accented Welsh validation.');
}

{
  const answer = 'chwarae';
  const typed = processPracticeInput({
    targetAnswer: answer,
    letters: createInitialPracticeLetters(answer),
    rawInput: 'ch',
    mode: 'strict'
  });
  const deleted = removeLastPracticeInput(answer, typed.letters);
  assertEqual(committedValue(deleted), 'c______', 'Deleting after a Welsh digraph should move back one character, not two positions.');
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
