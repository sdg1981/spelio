import foundationsExport from '../data-exports/spelio_welsh_foundations_content.json';
import type { WordList } from '../src/data/wordLists';
import {
  getInitialWordListPageSelection,
  getPendingWelshFoundationsJourneyList,
  isWelshFoundationsJourneyList
} from '../src/lib/practice/learningJourneySelection';
import { createDirectListPracticeStart } from '../src/lib/practice/sessionStart';
import { createDefaultStorage } from '../src/lib/practice/storage';
import { selectSingleWordList } from '../src/lib/practice/wordListSelection';

declare function require(name: string): { readFileSync(path: string, encoding: string): string };

const { readFileSync } = require('fs');

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

const foundationsLists = ((foundationsExport.lists ?? []) as unknown as WordList[]).filter(isWelshFoundationsJourneyList);
const dDd = foundationsLists.find(list => list.id === 'foundation_patterns_d_dd');
const y = foundationsLists.find(list => list.id === 'foundation_patterns_y');
const fFf = foundationsLists.find(list => list.id === 'foundation_patterns_f_ff');

assert(dDd, 'Expected the D / DD Foundations lesson.');
assert(y, 'Expected the Y Foundations lesson.');
assert(fFf, 'Expected the F / FF Foundations lesson.');

const completedIds = new Set([dDd.id, y.id]);
const inProgressIds = new Set([fFf.id]);
const initialSelection = getInitialWordListPageSelection(
  foundationsLists,
  [dDd.id],
  completedIds,
  inProgressIds,
  'en'
);
const initialPendingLesson = getPendingWelshFoundationsJourneyList(
  foundationsLists,
  initialSelection[0],
  completedIds,
  inProgressIds,
  'en'
);

assertEqual(initialSelection[0], fFf.id, 'Initial page selection should default to the next incomplete Foundations lesson.');
assertEqual(initialPendingLesson?.id, fFf.id, 'The journey CTA should resolve to the visibly selected initial lesson.');

const initialStart = createDirectListPracticeStart(createDefaultStorage(), initialPendingLesson);
assertEqual(initialStart.storage.selectedListIds[0], fFf.id, 'Continue journey should start the initial next-incomplete lesson.');

const storageBeforeManualSelection = createDefaultStorage();
const progressBeforeManualSelection = JSON.stringify(storageBeforeManualSelection.wordProgress);
const manualSelection = selectSingleWordList(y.id);
const manuallySelectedPendingLesson = getPendingWelshFoundationsJourneyList(
  foundationsLists,
  manualSelection[0],
  completedIds,
  inProgressIds,
  'en'
);

assertEqual(manualSelection[0], y.id, 'Clicking Y should make Y the page pending selection.');
assertEqual(manuallySelectedPendingLesson?.id, y.id, 'An explicit completed-lesson selection should override next-incomplete recommendation logic.');
assertEqual(storageBeforeManualSelection.hasStartedPracticeSession, false, 'Selecting a lesson alone must not start practice.');
assertEqual(JSON.stringify(storageBeforeManualSelection.wordProgress), progressBeforeManualSelection, 'Selecting a lesson must not mutate word progress.');
assertEqual(manualSelection[0], manuallySelectedPendingLesson?.id, 'The committed page selection and Learning Journey CTA must use the same pending lesson ID.');

const manualStart = createDirectListPracticeStart(storageBeforeManualSelection, manuallySelectedPendingLesson);
assertEqual(manualStart.storage.selectedListIds[0], y.id, 'Continue journey should start manually selected Y, not recommended F / FF.');
assertEqual(manualStart.storage.currentPathPosition, y.id, 'Starting the manual lesson should anchor the normal path to that lesson.');
assertEqual(JSON.stringify(storageBeforeManualSelection.wordProgress), progressBeforeManualSelection, 'Starting selection setup must not retroactively mutate the original progress state.');

const practiceSource = readFileSync('src/components/Practice.tsx', 'utf8');
assert(
  practiceSource.includes('const selected = selectedId === list.id;'),
  'Foundations chip selected styling should follow the shared pending selected ID.'
);
assert(
  practiceSource.includes('onStartPracticeList(currentFoundationList.id)'),
  'Continue journey should start the same pending Foundations lesson resolved for the card.'
);
assert(
  practiceSource.includes('onClick={(event) => {\n                          event.stopPropagation();\n                          onSelect(list.id);'),
  'Selecting a preview lesson chip should only update pending selection and must not invoke practice start.'
);

console.log('Learning Journey selection tests passed.');
