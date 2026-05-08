import { getSpellingPatternHint, spellingPatternHintRegistry } from '../src/lib/practice/spellingPatternHints';
import { translate } from '../src/i18n';

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function hintIdFor(targetAnswer: string, currentInputPosition: number, attempted: string) {
  return getSpellingPatternHint({
    targetAnswer,
    currentInputPosition,
    attempted,
    interfaceLanguage: 'en'
  })?.id ?? null;
}

assertEqual(
  hintIdFor('bedd', 2, 'th'),
  'cy.dd.softTh',
  'Typing th near target dd should return the Welsh dd hint.'
);

assertEqual(
  hintIdFor('afal', 1, 'v'),
  'cy.f.vSound',
  'Typing v for target f should return the Welsh f hint.'
);

assertEqual(
  hintIdFor('coffi', 3, 'i'),
  'cy.ff.fSound',
  'Getting the second f in target ff wrong should return the Welsh ff hint.'
);

assertEqual(
  hintIdFor('llaw', 0, 'c'),
  'cy.ll.awareness',
  'A mistake inside target ll should return the Welsh ll awareness hint.'
);

assertEqual(
  hintIdFor('bach', 2, 'k'),
  'cy.ch.awareness',
  'A mistake inside target ch should prefer the chunk hint over a rare-letter hint.'
);

assertEqual(
  hintIdFor('rhag', 0, 'h'),
  'cy.rh.awareness',
  'A mistake inside target rh should return the Welsh rh awareness hint.'
);

assertEqual(
  hintIdFor('canu', 1, 'k'),
  'cy.rareLetter.k',
  'Typing rare English-habit k for a different Welsh target should return a soft rare-letter hint.'
);

assertEqual(
  hintIdFor('canu', 1, 'b'),
  null,
  'Unrelated mistakes should not return a low-confidence hint.'
);

assertEqual(
  hintIdFor('mae', 1, 'i'),
  'cy.ae.awareness',
  'A mistake inside target ae should return the ae awareness hint.'
);

assertEqual(
  hintIdFor('haul', 1, 'o'),
  'cy.au.awareness',
  'A mistake inside target au should return the au awareness hint.'
);

assertEqual(
  hintIdFor('tawel', 2, 'o'),
  'cy.w.vowel',
  'A mistake at w inside a known w vowel chunk should return the w vowel hint.'
);

assertEqual(
  hintIdFor('byw', 1, 'i'),
  'cy.y.vowel',
  'A mistake at y inside a known y vowel chunk should return the y vowel hint.'
);

assertEqual(
  getSpellingPatternHint({
    targetAnswer: 'llaw',
    currentInputPosition: 0,
    attempted: 'l',
    word: { disablePatternHints: true, spellingHintId: 'cy.dd.softTh' },
    interfaceLanguage: 'en'
  }),
  null,
  'disablePatternHints should suppress both generic and word-level hints.'
);

assertEqual(
  getSpellingPatternHint({
    targetAnswer: 'canu',
    currentInputPosition: 1,
    attempted: 'b',
    word: { spellingHintId: 'cy.dd.softTh' },
    interfaceLanguage: 'en'
  })?.id,
  'cy.dd.softTh',
  'A valid word-level spellingHintId should be preferred over generic detection.'
);

assertEqual(
  getSpellingPatternHint({
    targetAnswer: 'canu',
    currentInputPosition: 1,
    attempted: 'k',
    word: { spellingHintId: 'unknown.hint' },
    interfaceLanguage: 'en'
  })?.id,
  'cy.rareLetter.k',
  'An invalid word-level spellingHintId should fall back to generic detection.'
);

for (const entry of spellingPatternHintRegistry.values()) {
  assertEqual(
    translate('en', entry.translationKey) === entry.translationKey,
    false,
    `English translation should exist for ${entry.id}.`
  );
  assertEqual(
    translate('cy', entry.translationKey) === entry.translationKey,
    false,
    `Welsh translation should exist for ${entry.id}.`
  );
}

console.log('spelling pattern hint tests passed');
