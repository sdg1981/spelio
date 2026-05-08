import { createPracticeAnswer, validateAnswer, validateLetter } from '../src/lib/practice/validator';

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

assertEqual(
  createPracticeAnswer('Wyt ti’n barod?'),
  'Wyt ti’n barod',
  'Terminal question marks should be removed from the practice answer.'
);

assertEqual(
  createPracticeAnswer('Barod?!'),
  'Barod',
  'Repeated terminal sentence punctuation should be removed from the practice answer.'
);

assertEqual(
  createPracticeAnswer('Barod?!   '),
  'Barod',
  'Trailing whitespace left after punctuation removal should be trimmed.'
);

assertEqual(
  createPracticeAnswer("Dw i'n mynd"),
  "Dw i'n mynd",
  'ASCII apostrophes should remain part of the practice answer.'
);

assertEqual(
  createPracticeAnswer('Dw i’n mynd'),
  'Dw i’n mynd',
  'Curly apostrophes should remain part of the practice answer.'
);

assertEqual(
  createPracticeAnswer('pen-blwydd'),
  'pen-blwydd',
  'Hyphens should remain part of the practice answer.'
);

assertEqual(
  validateAnswer('Wyt ti’n barod', 'Wyt ti’n barod?', 'strict'),
  true,
  'Omitting terminal punctuation should still validate as complete.'
);

assertEqual(
  validateAnswer('Barod', 'Barod?!', 'strict'),
  true,
  'Omitting repeated terminal punctuation should still validate as complete.'
);

assertEqual(
  validateLetter("'", '’', 'strict'),
  true,
  'Apostrophe equivalence should still work in strict mode.'
);

assertEqual(
  validateLetter('-', '‑', 'strict'),
  true,
  'Dash equivalence should still work in strict mode.'
);

assertEqual(
  validateAnswer('Wyt tin barod', 'Wyt ti’n barod?', 'strict'),
  false,
  'Meaningful apostrophes should not be treated as removable punctuation.'
);

assertEqual(
  validateAnswer('penblwydd', 'pen-blwydd', 'strict'),
  false,
  'Meaningful hyphens should not be treated as removable punctuation.'
);

console.log('practice answer tests passed');
