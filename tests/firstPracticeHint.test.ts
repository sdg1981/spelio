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
  assertEqual(translate('en', 'practice.firstPracticeHint'), 'Type the Welsh spelling', 'English first-practice hint copy should match the approved text.');
  assertEqual(translate('cy', 'practice.firstPracticeHint'), 'Teipiwch y sillafiad Cymraeg', 'Welsh first-practice hint copy should match the approved text.');
}

console.log('first practice hint tests passed');
