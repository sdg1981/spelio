import type { WelshSpellingMode } from '../../data/wordLists';
import { validateLetter } from './validator';

export interface PracticeLetterState {
  value: string;
  revealed?: boolean;
}

export type PracticeInputOutcome =
  | { type: 'ignored'; attempted: string }
  | { type: 'correct'; inputPosition: number; attempted: string }
  | { type: 'incorrect'; inputPosition: number; attempted: string };

export interface PracticeInputProcessingResult {
  letters: PracticeLetterState[];
  outcomes: PracticeInputOutcome[];
  wrongFeedback: { inputPosition: number; attempted: string } | null;
  completed: boolean;
}

export function createInitialPracticeLetters(answer: string): PracticeLetterState[] {
  return answer.split('').map(char => ({ value: char === ' ' ? ' ' : '' }));
}

export function findNextInputIndex(answer: string, letters: PracticeLetterState[], start = 0) {
  for (let index = start; index < answer.length; index += 1) {
    if (answer[index] !== ' ' && !letters[index]?.value) return index;
  }
  return -1;
}

export function isCommittedAnswerComplete(answer: string, letters: PracticeLetterState[], mode: WelshSpellingMode) {
  return answer.split('').every((expected, index) => {
    if (expected === ' ') return letters[index]?.value === ' ';
    const committed = letters[index]?.value;
    return Boolean(committed) && validateLetter(committed, expected, mode);
  });
}

function isInputSpace(char: string) {
  return /\s/.test(char);
}

function validatesAtIndex(char: string, candidates: string[], index: number, mode: WelshSpellingMode) {
  return candidates.some(candidate => {
    const expected = candidate[index];
    if (!expected || expected === ' ') return false;
    return validateLetter(char, expected, mode);
  });
}

export function processPracticeInput({
  targetAnswer,
  acceptedAnswers,
  letters,
  rawInput,
  mode
}: {
  targetAnswer: string;
  acceptedAnswers?: string[];
  letters: PracticeLetterState[];
  rawInput: string;
  mode: WelshSpellingMode;
}): PracticeInputProcessingResult {
  let nextLetters = letters.map(letter => ({ ...letter }));
  const candidates = [targetAnswer, ...(acceptedAnswers ?? [])];
  const outcomes: PracticeInputOutcome[] = [];
  let wrongFeedback: PracticeInputProcessingResult['wrongFeedback'] = null;

  for (const attempted of Array.from(rawInput)) {
    if (isInputSpace(attempted)) {
      outcomes.push({ type: 'ignored', attempted });
      continue;
    }

    const inputPosition = findNextInputIndex(targetAnswer, nextLetters);
    if (inputPosition < 0) {
      outcomes.push({ type: 'ignored', attempted });
      continue;
    }

    if (validatesAtIndex(attempted, candidates, inputPosition, mode)) {
      nextLetters = nextLetters.map((letter, index) =>
        index === inputPosition ? { value: targetAnswer[inputPosition] } : letter
      );
      outcomes.push({ type: 'correct', inputPosition, attempted });
      continue;
    }

    wrongFeedback = { inputPosition, attempted };
    outcomes.push({ type: 'incorrect', inputPosition, attempted });
    break;
  }

  return {
    letters: nextLetters,
    outcomes,
    wrongFeedback,
    completed: isCommittedAnswerComplete(targetAnswer, nextLetters, mode)
  };
}
