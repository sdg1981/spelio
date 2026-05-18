import {
  canBulkGenerateAudio,
  getBulkAudioActionLabel,
  getBulkAudioRunningLabel,
  getSelectedVisibleBulkAudioIds,
  summarizeBulkAudioGeneration
} from '../src/admin/services/audioQueueBulk';
import { adminWordLists } from '../src/admin/data/mockAdminData';
import type { AdminWord, AudioStatus } from '../src/admin/types';
import { createAudioQueueSnapshot, type AudioGenerationResult } from '../src/admin/services/audioGeneration';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function assertArrayEqual<T>(actual: T[], expected: T[], message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}\nExpected: ${expectedJson}\nActual: ${actualJson}`);
  }
}

function word(id: string, audioStatus: AudioStatus): Pick<AdminWord, 'id' | 'audioStatus'> {
  return { id, audioStatus };
}

function result(id: string, ok: boolean): AudioGenerationResult {
  return {
    ok,
    error: ok ? undefined : 'Audio generation failed.',
    word: {
      id,
      listId: 'list-1',
      englishPrompt: 'work',
      welshAnswer: 'gwaith',
      acceptedAlternatives: [],
      audioUrl: ok ? '/audio/work.mp3' : '',
      audioStatus: ok ? 'ready' : 'failed',
      notes: '',
      order: 1,
      difficulty: 1,
      dialect: 'Both',
      dialectNote: '',
      usageNote: '',
      variantGroupId: '',
      createdAt: '2026-05-13T00:00:00.000Z',
      updatedAt: '2026-05-13T00:00:00.000Z'
    }
  };
}

assert(canBulkGenerateAudio(word('ready-1', 'ready')), 'Generated audio should be eligible for selected bulk regeneration.');
assert(canBulkGenerateAudio(word('missing-1', 'missing')), 'Missing audio should be eligible for selected bulk generation.');
assert(canBulkGenerateAudio(word('failed-1', 'failed')), 'Failed audio should be eligible for selected bulk generation.');
assert(!canBulkGenerateAudio(word('queued-1', 'queued')), 'Queued audio should not be eligible for duplicate selected generation.');
assert(!canBulkGenerateAudio(word('generating-1', 'generating')), 'Generating audio should not be eligible for duplicate selected generation.');

assertEqual(
  getBulkAudioActionLabel([word('missing-1', 'missing'), word('failed-1', 'failed')]),
  'Generate selected',
  'Missing and failed selections should keep the generate label.'
);
assertEqual(
  getBulkAudioActionLabel([word('missing-1', 'missing'), word('ready-1', 'ready')]),
  'Regenerate selected',
  'Mixed selections that include generated audio should use the regenerate label.'
);
assertEqual(
  getBulkAudioRunningLabel(true, 3),
  'Regenerating 3...',
  'Bulk loading state should reflect regeneration when selected items include generated audio.'
);

const visibleWords = [
  word('missing-1', 'missing'),
  word('failed-1', 'failed'),
  word('ready-1', 'ready'),
  word('queued-1', 'queued'),
  word('generating-1', 'generating')
];
assertArrayEqual(
  getSelectedVisibleBulkAudioIds(['missing-1', 'failed-1', 'ready-1', 'queued-1', 'hidden-1'], visibleWords),
  ['missing-1', 'failed-1', 'ready-1'],
  'Bulk selection should call generation for visible missing, failed, and generated rows only.'
);

assertEqual(
  summarizeBulkAudioGeneration([result('missing-1', true), result('ready-1', false)], 2),
  'Audio generation finished with 1 generated and 1 failure(s).',
  'Partial failures should produce a page-safe summary instead of treating the whole batch as successful.'
);

const adminWords = adminWordLists.flatMap(list => list.words);
const supportFfrwyth = adminWords.find(word => word.id === 'support_ff_006');
assert(supportFfrwyth?.welshAnswer === 'ffrwyth', 'Admin content should include support-list ffrwyth as its own word.');
if (!supportFfrwyth) throw new Error('Expected support-list ffrwyth to exist in admin content.');
assertEqual(supportFfrwyth.audioStatus, 'missing', 'Support-list ffrwyth should be visible to admin audio maintenance as missing audio.');
assertEqual(
  createAudioQueueSnapshot(adminWords).words.some(word => word.id === 'support_ff_006' && word.audioStatus === 'missing'),
  true,
  'The admin audio queue snapshot should include missing support-list words.'
);

console.log('admin audio queue bulk tests passed');
