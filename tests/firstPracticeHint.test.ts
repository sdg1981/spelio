import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FirstPracticeHint } from '../src/components/FirstPracticeHint';
import { translate } from '../src/i18n';
import {
  clearSpelioStorageData,
  createDefaultStorage,
  markFirstPracticeHintSeen,
  normaliseStorage,
  shouldShowFirstPracticeHint
} from '../src/lib/practice/storage';

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function assertIncludes(actual: string, expected: string, message: string) {
  if (!actual.includes(expected)) {
    throw new Error(`${message}\nExpected to include: ${expected}\nActual: ${actual}`);
  }
}

function assertNotIncludes(actual: string, expected: string, message: string) {
  if (actual.includes(expected)) {
    throw new Error(`${message}\nExpected not to include: ${expected}\nActual: ${actual}`);
  }
}

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => Array.from(values.keys())[index] ?? null,
    removeItem: key => values.delete(key),
    setItem: (key, value) => {
      values.set(key, value);
    }
  };
}

{
  const storage = createDefaultStorage();

  assertEqual(storage.hasSeenFirstPracticeHint, false, 'New learner storage should not have seen the first-practice hint.');
  assertEqual(shouldShowFirstPracticeHint(storage), true, 'The first-practice hint should display for brand-new storage.');
}

{
  const storage = markFirstPracticeHintSeen(createDefaultStorage());

  assertEqual(storage.hasSeenFirstPracticeHint, true, 'First input should persist the first-practice hint as seen.');
  assertEqual(shouldShowFirstPracticeHint(storage), false, 'The first-practice hint should hide after it is marked seen.');
}

{
  const restored = normaliseStorage({ hasSeenFirstPracticeHint: true });
  const legacy = normaliseStorage({});

  assertEqual(restored.hasSeenFirstPracticeHint, true, 'Persisted first-practice hint state should survive storage normalization.');
  assertEqual(shouldShowFirstPracticeHint(restored), false, 'Persisted seen state should prevent the first-practice hint from returning.');
  assertEqual(legacy.hasSeenFirstPracticeHint, false, 'Legacy storage should default to unseen first-practice hint state.');
}

{
  const storage = createMemoryStorage();
  storage.setItem('spelio-storage-v1', JSON.stringify(markFirstPracticeHintSeen(createDefaultStorage())));

  clearSpelioStorageData(storage);

  assertEqual(storage.getItem('spelio-storage-v1'), null, 'Reset progress should remove persisted first-practice hint state.');
  assertEqual(shouldShowFirstPracticeHint(createDefaultStorage()), true, 'After reset, fresh storage should show the first-practice hint again.');
}

{
  assertEqual(translate('en', 'practice.firstPracticeHint'), 'Type the Welsh spelling you hear.', 'English first-practice hint first line should match the approved text.');
  assertEqual(translate('en', 'practice.firstPracticeReplayHint'), 'Replay if you need to hear it again.', 'English first-practice hint replay line should match the approved text.');
  assertEqual(translate('cy', 'practice.firstPracticeHint'), "Teipiwch y sillafiad Cymraeg rydych chi'n ei glywed.", 'Welsh first-practice hint first line should match the approved text.');
  assertEqual(translate('cy', 'practice.firstPracticeReplayHint'), 'Ailchwaraewch os oes angen ei glywed eto.', 'Welsh first-practice hint replay line should match the approved text.');
}

{
  const markup = renderToStaticMarkup(React.createElement(FirstPracticeHint, {
    visible: true,
    primaryText: translate('en', 'practice.firstPracticeHint'),
    replayText: translate('en', 'practice.firstPracticeReplayHint')
  }));

  assertIncludes(markup, 'Type the Welsh spelling you hear.', 'Visible first-practice hint should render the first line.');
  assertIncludes(markup, 'Replay if you need to hear it again.', 'Visible first-practice hint should render the replay line.');
  assertIncludes(markup, 'first-practice-hint-icon', 'Visible first-practice hint should render the reused replay icon.');
  assertIncludes(markup, 'aria-hidden="true"', 'Replay hint icon should be visual only.');
  assertNotIncludes(markup, '<button', 'Replay hint icon should not render as a separate clickable button.');
  assertNotIncludes(markup, '<a ', 'Replay hint icon should not render as a link.');
  assertNotIncludes(markup, 'role="button"', 'Replay hint icon should not expose button semantics.');
}

{
  const markup = renderToStaticMarkup(React.createElement(FirstPracticeHint, {
    visible: false,
    primaryText: translate('en', 'practice.firstPracticeHint'),
    replayText: translate('en', 'practice.firstPracticeReplayHint')
  }));

  assertNotIncludes(markup, 'Type the Welsh spelling you hear.', 'Hidden first-practice hint should not render the first line.');
  assertNotIncludes(markup, 'Replay if you need to hear it again.', 'Hidden first-practice hint should not render the replay line.');
  assertNotIncludes(markup, 'first-practice-hint-icon', 'Hidden first-practice hint should not render the replay icon.');
}

console.log('first practice hint tests passed');
