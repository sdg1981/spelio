import { adminNavGroups } from '../src/admin/navigation';

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assertEqual(
  adminNavGroups.map(group => group.label).join('|'),
  'Content|Audio|Reference / Structure|System',
  'Admin sidebar should be grouped around current content architecture.'
);

const contentGroup = adminNavGroups.find(group => group.label === 'Content');
assert(contentGroup, 'Content group should exist.');
assertEqual(
  contentGroup.items.map(item => item.label).join('|'),
  'Overview|Collections|Word Lists|Words|Custom Lists',
  'Content group should keep learner-facing content maintenance separate from audio, system, and internal reference metadata.'
);

const audioGroup = adminNavGroups.find(group => group.label === 'Audio');
assert(audioGroup, 'Audio group should exist.');
assertEqual(
  audioGroup.items.map(item => item.label).join('|'),
  'Audio Queue|Helper Audio',
  'Audio group should only contain audio maintenance surfaces.'
);

const referenceGroup = adminNavGroups.find(group => group.label === 'Reference / Structure');
assert(referenceGroup, 'Reference / Structure group should exist.');
assertEqual(
  referenceGroup.items.map(item => item.label).join('|'),
  'Dialects|Internal Stages',
  'Reference group should keep active structure metadata available without exposing deprecated focus categories.'
);

const internalStages = referenceGroup.items.find(item => item.path === '/admin/stages');
assertEqual(internalStages?.badge, 'Internal', 'Stages should be labelled as internal reference metadata.');

assertEqual(
  referenceGroup.items.some(item => item.path === '/admin/focus-categories'),
  false,
  'Deprecated focus categories should not appear in ordinary admin sidebar navigation.'
);

const systemGroup = adminNavGroups.find(group => group.label === 'System');
assert(systemGroup, 'System group should exist.');
assertEqual(
  systemGroup.items.map(item => item.label).join('|'),
  'Import / Export|Settings',
  'System group should contain import/export and settings.'
);

for (const group of adminNavGroups) {
  for (const item of group.items) {
    assert(item.description.trim().length > 0, `${item.label} should explain what it is for.`);
  }
}
