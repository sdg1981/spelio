import { buildAdminContentExportPayload, createAdminContentExportFilename } from '../src/admin/repositories/contentExport';
import { validateImportPayload } from '../src/admin/repositories/importValidation';
import type { AdminStructureOption, AdminWordList, AdminWordListCollection } from '../src/admin/types';

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

const collections: AdminWordListCollection[] = [
  {
    id: 'spelio_core_welsh',
    slug: 'spelio-core-welsh',
    name: 'Spelio Core Welsh',
    description: 'Core Welsh spelling practice.',
    type: 'spelio_core',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    curriculumKeyStage: null,
    curriculumArea: null,
    ownerType: 'spelio',
    ownerId: 'internal-owner-not-exported',
    order: 2,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z'
  }
];

const lists: AdminWordList[] = [
  {
    id: 'second_list',
    slug: 'second-list',
    collectionId: 'spelio_core_welsh',
    collectionName: 'Spelio Core Welsh',
    name: 'Second List',
    nameCy: '',
    description: 'Second list.',
    descriptionCy: '',
    language: 'cy',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    dialect: 'Mixed',
    stageId: 'foundations',
    stage: 'Foundations',
    focusCategoryId: 'core-vocabulary',
    focus: 'Core Vocabulary',
    difficulty: 1,
    order: 2,
    nextListId: null,
    isActive: false,
    isSupportList: false,
    listType: 'main',
    hiddenFromMainCatalogue: false,
    primerContent: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    words: []
  },
  {
    id: 'first_list',
    slug: 'first-list',
    collectionId: 'spelio_core_welsh',
    collectionName: 'Spelio Core Welsh',
    name: 'First List',
    nameCy: '',
    description: 'First list.',
    descriptionCy: '',
    language: 'cy',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    dialect: 'Mixed',
    stageId: 'foundations',
    stage: 'Foundations',
    focusCategoryId: 'core-vocabulary',
    focus: 'Core Vocabulary',
    difficulty: 1,
    order: 1,
    nextListId: 'second_list',
    isActive: true,
    isSupportList: false,
    listType: 'main',
    hiddenFromMainCatalogue: false,
    primerContent: {
      enabled: true,
      titleEn: 'Primer',
      titleCy: 'Preimiwr',
      bodyEn: 'Listen to DD.',
      bodyCy: 'Gwrandewch ar DD.',
      soundItems: [{
        id: 'dd_sound',
        key: 'dd_sound',
        label: 'DD',
        labelCy: 'DD',
        textToSpeak: 'hedd',
        audioUrl: 'https://example.test/primer-dd.mp3',
        audioStatus: 'ready',
        audioSource: 'manual',
        order: 1
      }]
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    words: [
      {
        id: 'first_list_002',
        listId: 'first_list',
        englishPrompt: 'no',
        welshAnswer: 'na',
        acceptedAlternatives: [],
        audioUrl: '',
        audioStatus: 'missing',
        elevenLabsAudioUrl: 'internal-elevenlabs-url',
        elevenLabsAudioStatus: 'generated',
        elevenLabsGenerationMode: 'direct',
        preferredElevenLabsGenerationMode: 'direct',
        elevenLabsPronunciationHint: '',
        elevenLabsPronunciationHintUsed: false,
        elevenLabsPronunciationHintText: '',
        elevenLabsContextPhrase: '',
        elevenLabsExtractMode: 'none',
        elevenLabsExtractChunkCount: 1,
        elevenLabsExtractStartOffsetMs: 80,
        elevenLabsExtractionUsed: false,
        elevenLabsContextPhraseUsed: '',
        elevenLabsGeneratedAt: '2026-01-03T00:00:00.000Z',
        elevenLabsModel: 'eleven_v3',
        elevenLabsVoiceId: 'voice',
        elevenLabsLanguageOverride: 'Welsh',
        elevenLabsPrompt: 'prompt',
        audioReviewStatus: 'approved',
        notes: '',
        order: 2,
        difficulty: 1,
        dialect: 'Both',
        dialectNote: '',
        usageNote: '',
        spellingHintId: '',
        disablePatternHints: false,
        variantGroupId: '',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z'
      },
      {
        id: 'first_list_001',
        listId: 'first_list',
        englishPrompt: 'yes',
        welshAnswer: 'ie',
        acceptedAlternatives: ['Ie'],
        audioUrl: 'https://example.test/ie.mp3',
        audioStatus: 'ready',
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
        elevenLabsExtractStartOffsetMs: 80,
        elevenLabsExtractionUsed: false,
        elevenLabsContextPhraseUsed: '',
        elevenLabsGeneratedAt: '',
        elevenLabsModel: '',
        elevenLabsVoiceId: '',
        elevenLabsLanguageOverride: '',
        elevenLabsPrompt: '',
        audioReviewStatus: 'unchecked',
        notes: 'Editorial note',
        order: 1,
        difficulty: 1,
        dialect: 'Both',
        dialectNote: '',
        usageNote: 'Simple yes form.',
        spellingHintId: 'short-vowel',
        disablePatternHints: true,
        variantGroupId: 'yes_variant',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z'
      }
    ]
  }
];

const structure: AdminStructureOption[] = [{ id: 'foundations', name: 'Foundations', order: 1, active: true }];

const payload = buildAdminContentExportPayload({
  collections,
  lists,
  stages: structure,
  focusCategories: [{ id: 'core-vocabulary', name: 'Core Vocabulary', order: 1, active: true }],
  dialects: [{ id: 'Both', name: 'Both', order: 1, active: true }],
  exportedAt: '2026-05-21T10:11:12.000Z'
});

assertEqual(payload.source, 'live_database_export', 'export source should identify live database snapshots');
assertEqual(payload.schemaVersion, '1.3', 'export schema should include primer content support.');
assertEqual(payload.lists[0].id, 'first_list', 'lists should sort by order');
assertEqual(payload.lists[0].words[0].id, 'first_list_001', 'words should sort by order');
assertEqual(payload.collections[0].ownerType, 'spelio', 'collection owner type should be preserved');
assert(!('ownerId' in payload.collections[0]), 'collection ownerId should not be exported');
assert(!('createdAt' in payload.lists[0]), 'list timestamps should not be exported');
assert(!('elevenLabsAudioUrl' in payload.lists[0].words[0]), 'ElevenLabs operational audio metadata should not be exported');
assertEqual(payload.lists[0].words[0].spellingHintId, 'short-vowel', 'learner-facing spelling hint metadata should be exported');
assertEqual(payload.lists[0].words[0].disablePatternHints, true, 'learner-facing hint controls should be exported');
assertEqual(payload.lists[0].primerContent?.enabled, true, 'list-level primer content should be exported.');
assertEqual(payload.lists[0].primerContent?.soundItems[0].audioUrl, 'https://example.test/primer-dd.mp3', 'primer sound audio metadata should be exported.');

const preview = validateImportPayload(payload, {
  existingCollectionIds: [],
  existingListIds: [],
  existingWordIds: []
});

assertArrayEqual(preview.errors, [], 'export should validate against the current importer');
assertEqual(preview.totalLists, 2, 'export should include all lists');
assertEqual(preview.totalWords, 2, 'export should include all words');
assertEqual(preview.content.lists[0].primerContent?.soundItems[0].textToSpeak, 'hedd', 'import validation should preserve primer sound generation text.');
assertEqual(createAdminContentExportFilename(payload.exportedAt), 'spelio_live_content_export_2026-05-21_10-11-12Z.json', 'filename should be timestamped and filesystem-safe');
