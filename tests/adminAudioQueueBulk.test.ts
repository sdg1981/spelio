import {
  canBulkGenerateAudio,
  canBulkGenerateElevenLabsAudio,
  getBulkAudioActionLabel,
  getBulkAudioRunningLabel,
  getElevenLabsBatchGenerationMode,
  getSelectedVisibleBulkAudioIds,
  getSelectedVisibleBulkElevenLabsAudioIds,
  summarizeBulkAudioGeneration,
  summarizeBulkElevenLabsAudioGeneration
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

function elevenLabsWord(
  id: string,
  overrides: Partial<Pick<AdminWord, 'welshAnswer' | 'audioUrl' | 'audioStatus' | 'elevenLabsAudioStatus' | 'preferredElevenLabsGenerationMode' | 'elevenLabsPronunciationHint' | 'elevenLabsContextPhrase' | 'elevenLabsExtractMode'>> = {}
): Pick<AdminWord, 'id' | 'welshAnswer' | 'audioUrl' | 'audioStatus' | 'elevenLabsAudioStatus' | 'preferredElevenLabsGenerationMode' | 'elevenLabsPronunciationHint' | 'elevenLabsContextPhrase' | 'elevenLabsExtractMode'> {
  return {
    id,
    welshAnswer: 'gwaith',
    audioUrl: '',
    audioStatus: 'missing',
    elevenLabsAudioStatus: 'missing',
    preferredElevenLabsGenerationMode: 'direct',
    elevenLabsPronunciationHint: '',
    elevenLabsContextPhrase: '',
    elevenLabsExtractMode: 'none',
    ...overrides
  };
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
      elevenLabsAudioUrl: '',
      elevenLabsAudioStatus: 'missing',
      elevenLabsGenerationMode: 'direct',
      preferredElevenLabsGenerationMode: 'direct',
      elevenLabsPronunciationHint: '',
      elevenLabsPronunciationHintUsed: false,
      elevenLabsPronunciationHintText: '',
      elevenLabsContextPhrase: '',
      elevenLabsExtractMode: 'none',
      elevenLabsExtractChunkCount: 1,
      elevenLabsExtractionUsed: false,
      elevenLabsContextPhraseUsed: '',
      elevenLabsGeneratedAt: '',
      elevenLabsModel: '',
      elevenLabsVoiceId: '',
      elevenLabsLanguageOverride: '',
      elevenLabsPrompt: '',
      audioReviewStatus: 'unchecked',
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
  'Generate Azure selected',
  'Missing and failed selections should keep the generate label.'
);
assertEqual(
  getBulkAudioActionLabel([word('missing-1', 'missing'), word('ready-1', 'ready')]),
  'Regenerate Azure selected',
  'Mixed selections that include generated audio should use the regenerate label.'
);
assertEqual(
  getBulkAudioRunningLabel(true, 3),
  'Regenerating Azure 3...',
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

assert(canBulkGenerateElevenLabsAudio(elevenLabsWord('el-missing')), 'Missing ElevenLabs audio with Welsh answer text should be eligible.');
assert(canBulkGenerateElevenLabsAudio(elevenLabsWord('el-failed', { elevenLabsAudioStatus: 'failed' })), 'Failed ElevenLabs audio with Welsh answer text should be eligible.');
assert(canBulkGenerateElevenLabsAudio(elevenLabsWord('el-generated', { elevenLabsAudioStatus: 'generated' })), 'Generated ElevenLabs audio should be eligible for selected regeneration.');
assert(!canBulkGenerateElevenLabsAudio(elevenLabsWord('el-no-text', { welshAnswer: '' })), 'ElevenLabs batch generation should require Welsh answer text.');
assert(canBulkGenerateElevenLabsAudio(elevenLabsWord('el-direct-no-azure', { audioStatus: 'missing', audioUrl: '' })), 'Direct ElevenLabs batch generation should not require Azure audio.');
assert(!canBulkGenerateElevenLabsAudio(elevenLabsWord('el-azure-transform-no-azure', { preferredElevenLabsGenerationMode: 'azure_transform', audioStatus: 'missing', audioUrl: '' })), 'Azure-transform ElevenLabs batch generation should require existing Azure audio.');
assert(canBulkGenerateElevenLabsAudio(elevenLabsWord('el-azure-transform-ready', { preferredElevenLabsGenerationMode: 'azure_transform', audioStatus: 'ready', audioUrl: '/audio/source.mp3' })), 'Azure-transform ElevenLabs batch generation should be eligible when Azure audio exists.');
assertEqual(getElevenLabsBatchGenerationMode(elevenLabsWord('el-normal')), 'direct', 'Batch generation should use direct ElevenLabs for normal words.');
assertEqual(getElevenLabsBatchGenerationMode(elevenLabsWord('el-hint', { elevenLabsPronunciationHint: 'penwythnos (pen-oi-th-nos)' })), 'direct', 'Batch generation should route hinted words through direct generation so the repository can use the hint.');
assertEqual(getElevenLabsBatchGenerationMode(elevenLabsWord('el-context', { elevenLabsContextPhrase: 'dych chi', elevenLabsExtractMode: 'final_chunk' })), 'context_extract', 'Batch generation should preserve context-extraction corrections.');
assertEqual(getElevenLabsBatchGenerationMode(elevenLabsWord('el-context-with-azure-preferred', { preferredElevenLabsGenerationMode: 'azure_transform', elevenLabsContextPhrase: 'dych chi', elevenLabsExtractMode: 'final_chunk' })), 'azure_transform', 'Explicit Azure pronunciation preference should override context extraction.');

assertArrayEqual(
  getSelectedVisibleBulkElevenLabsAudioIds(
    ['el-missing', 'el-failed', 'el-generated', 'el-hidden'],
    [
      elevenLabsWord('el-missing'),
      elevenLabsWord('el-failed', { elevenLabsAudioStatus: 'failed' }),
      elevenLabsWord('el-generated', { elevenLabsAudioStatus: 'generated' })
    ]
  ),
  ['el-missing', 'el-failed', 'el-generated'],
  'ElevenLabs bulk selection should call generation for visible eligible rows only.'
);

assertEqual(
  summarizeBulkAudioGeneration([result('missing-1', true), result('ready-1', false)], 2),
  'Audio generation finished with 1 generated and 1 failure(s).',
  'Partial failures should produce a page-safe summary instead of treating the whole batch as successful.'
);

assertEqual(
  summarizeBulkElevenLabsAudioGeneration([result('el-missing', true), result('el-failed', false)], 2),
  'ElevenLabs generation finished with 1 generated and 1 failure(s).',
  'Partial ElevenLabs failures should produce a page-safe summary instead of treating the whole batch as successful.'
);

const adminWords = adminWordLists.flatMap(list => list.words);
const supportFfrwyth = adminWords.find(word => word.id === 'support_ff_006');
assert(supportFfrwyth?.welshAnswer === 'ffrwyth', 'Admin content should include support-list ffrwyth as its own word.');
if (!supportFfrwyth) throw new Error('Expected support-list ffrwyth to exist in admin content.');
assertEqual(supportFfrwyth.audioStatus, 'missing', 'Support-list ffrwyth should be visible to admin audio maintenance as missing audio.');
const supportAfal = adminWords.find(word => word.id === 'support_spelling_basics_examples_001');
assertEqual(supportAfal?.welshAnswer, 'afal', 'Admin content should include phonetic support example afal.');
assertEqual(supportAfal?.audioStatus, 'missing', 'Phonetic support example afal should be visible as missing audio until generated.');
const supportRhRhaid = adminWords.find(word => word.id === 'support_rh_003');
assertEqual(supportRhRhaid?.welshAnswer, 'rhaid', 'Admin content should include replacement support RH word rhaid.');
assertEqual(supportRhRhaid?.englishPrompt, 'must', 'Admin content should prompt rhaid as must.');
assertEqual(supportRhRhaid?.audioStatus, 'missing', 'Replacement support RH word rhaid should be queued as missing audio until generated.');
assertEqual(
  adminWords.some(word => word.id === 'support_rh_003' && word.welshAnswer === 'rhiain'),
  false,
  'Support RH should no longer expose rhiain in admin content.'
);
const supportCwm = adminWords.find(word => word.id === 'support_w_002');
assertEqual(supportCwm?.welshAnswer, 'cwm', 'Admin content should include split support W word cwm.');
assertEqual(supportCwm?.audioStatus, 'missing', 'Split support W words should be visible as missing audio until generated.');
const supportMwg = adminWords.find(word => word.id === 'support_w_008');
assertEqual(supportMwg?.welshAnswer, 'mwg', 'Admin content should include replacement support W word mwg.');
assertEqual(supportMwg?.englishPrompt, 'smoke', 'Admin content should prompt mwg as smoke.');
assertEqual(supportMwg?.audioStatus, 'missing', 'Replacement support W word mwg should be queued as missing audio until generated.');
const supportGwr = adminWords.find(word => word.id === 'support_w_009');
assertEqual(supportGwr?.welshAnswer, 'gŵr', 'Admin content should include corrected support W word gŵr.');
assertEqual(supportGwr?.englishPrompt, 'man / husband', 'Admin content should keep the man / husband prompt for gŵr.');
assertEqual(supportGwr?.audioStatus, 'missing', 'Corrected support W word gŵr should be queued as missing audio until generated.');
assertEqual(
  adminWords.some(word => word.id === 'support_w_008' && word.welshAnswer === 'ŵyr'),
  false,
  'Support W should no longer expose ambiguous ŵyr in admin content.'
);
assertEqual(
  adminWords.some(word => word.id === 'support_w_009' && word.welshAnswer === 'gwr'),
  false,
  'Support W should no longer expose unaccented gwr in admin content.'
);
const supportTywydd = adminWords.find(word => word.id === 'support_y_010');
assertEqual(supportTywydd?.welshAnswer, 'tywydd', 'Admin content should include split support Y word tywydd.');
assertEqual(supportTywydd?.audioStatus, 'missing', 'Split support Y words should be visible as missing audio until generated.');
const supportByd = adminWords.find(word => word.id === 'support_y_003');
assertEqual(supportByd?.welshAnswer, 'byd', 'Admin content should include replacement support Y word byd.');
assertEqual(supportByd?.englishPrompt, 'world', 'Admin content should prompt byd as world.');
assertEqual(supportByd?.audioStatus, 'missing', 'Replacement support Y word byd should be queued as missing audio until generated.');
assertEqual(
  adminWords.some(word => word.id === 'support_y_003' && word.welshAnswer === 'heddiw'),
  false,
  'Support Y should no longer expose heddiw in admin content.'
);
assertEqual(
  adminWords.some(word => word.id.startsWith('support_wy_')),
  false,
  'Retired support_wy words should not remain in active static admin support content.'
);
assertEqual(
  adminWords.some(word => word.id.startsWith('support_spelling_basics_examples') && word.welshAnswer === 'ddwy'),
  false,
  'ddwy should not remain in hidden spelling-basics support examples after the phonetic breakdown changed.'
);
assertEqual(
  createAudioQueueSnapshot(adminWords).words.some(word => word.id === 'support_ff_006' && word.audioStatus === 'missing'),
  true,
  'The admin audio queue snapshot should include missing support-list words.'
);
assertEqual(
  createAudioQueueSnapshot(adminWords).words.some(word => word.id === 'support_spelling_basics_examples_001' && word.audioStatus === 'missing'),
  true,
  'The admin audio queue snapshot should include missing spelling-basics support example words.'
);
assertEqual(
  createAudioQueueSnapshot(adminWords).words.some(word => word.id === 'support_rh_003' && word.welshAnswer === 'rhaid' && word.audioStatus === 'missing'),
  true,
  'The admin audio queue snapshot should include missing replacement support RH word rhaid.'
);
assertEqual(
  createAudioQueueSnapshot(adminWords).words.some(word => word.id === 'support_w_002' && word.audioStatus === 'missing'),
  true,
  'The admin audio queue snapshot should include missing split support W words.'
);
assertEqual(
  createAudioQueueSnapshot(adminWords).words.some(word => word.id === 'support_w_008' && word.welshAnswer === 'mwg' && word.audioStatus === 'missing'),
  true,
  'The admin audio queue snapshot should include missing replacement support W word mwg.'
);
assertEqual(
  createAudioQueueSnapshot(adminWords).words.some(word => word.id === 'support_w_009' && word.welshAnswer === 'gŵr' && word.audioStatus === 'missing'),
  true,
  'The admin audio queue snapshot should include missing corrected support W word gŵr.'
);
assertEqual(
  createAudioQueueSnapshot(adminWords).words.some(word => word.id === 'support_y_010' && word.audioStatus === 'missing'),
  true,
  'The admin audio queue snapshot should include missing split support Y words.'
);
assertEqual(
  createAudioQueueSnapshot(adminWords).words.some(word => word.id === 'support_y_003' && word.welshAnswer === 'byd' && word.audioStatus === 'missing'),
  true,
  'The admin audio queue snapshot should include missing replacement support Y word byd.'
);

console.log('admin audio queue bulk tests passed');
