import { mockAdminRepository } from '../src/admin/repositories/mockAdminRepository';
import { validateImportPayload } from '../src/admin/repositories/importValidation';
import { applyPrimerContentDraftUpdate, createNeutralPrimerSoundItem } from '../src/admin/services/primerEditor';
import { createDefaultFoundationsIntroContent, WELSH_FOUNDATIONS_COLLECTION_ID } from '../src/content/collectionIntro';
import { getFoundationsPrimer, normalizePrimerContent } from '../src/content/foundationsPrimer';
import type { WordListPrimerContent } from '../src/data/wordLists';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

void run();

async function run() {
  const typedTitle = ['D', 'DD', 'DD ', 'DD sounds'].reduce<WordListPrimerContent>(
    (primer, nextText) => applyPrimerContentDraftUpdate(primer, current => ({ ...current, titleEn: nextText })),
    { enabled: true, titleEn: '', titleCy: '', bodyEn: '', bodyCy: '', soundItems: [] }
  );
  assertEqual(typedTitle.titleEn, 'DD sounds', 'Primer editor draft updates should preserve spaces while typing.');

  const typedTitleAfterRenderNormalization = normalizePrimerContent(
    applyPrimerContentDraftUpdate(
      { enabled: true, titleEn: 'DD', titleCy: '', bodyEn: '', bodyCy: '', soundItems: [] },
      current => ({ ...current, titleEn: 'DD ' })
    )
  );
  assertEqual(typedTitleAfterRenderNormalization.titleEn, 'DD ', 'Render-time primer normalization should not remove a typed title space.');

  const typedSoundItemAfterRenderNormalization = normalizePrimerContent(
    applyPrimerContentDraftUpdate(
      {
        enabled: true,
        titleEn: '',
        titleCy: '',
        bodyEn: '',
        bodyCy: '',
        soundItems: [createNeutralPrimerSoundItem(1, 'primer_sound_test')]
      },
      current => ({
        ...current,
        soundItems: current.soundItems.map(item => item.key === 'primer_sound_test' ? { ...item, label: 'DD ', textToSpeak: 'hedd ' } : item)
      })
    )
  );
  assertEqual(typedSoundItemAfterRenderNormalization.soundItems[0]?.label, 'DD ', 'Render-time primer normalization should not remove a typed sound label space.');
  assertEqual(typedSoundItemAfterRenderNormalization.soundItems[0]?.textToSpeak, 'hedd ', 'Render-time primer normalization should not remove a typed generation-text space.');

  const neutralItem = createNeutralPrimerSoundItem(3, 'primer_sound_test');
  assertEqual(neutralItem.key, 'primer_sound_test', 'New primer sound item should receive a stable generated key.');
  assertEqual(neutralItem.label, '', 'New primer sound item label should default empty.');
  assertEqual(neutralItem.labelCy, '', 'New primer sound item Welsh label should default empty.');
  assertEqual(neutralItem.textToSpeak, '', 'New primer sound item textToSpeak should default empty.');
  assertEqual(neutralItem.audioUrl, '', 'New primer sound item audioUrl should default empty.');
  assertEqual(neutralItem.audioStatus, 'missing', 'New primer sound item audioStatus should default missing.');
  assertEqual(neutralItem.audioSource, 'unknown', 'New primer sound item audioSource should default unknown.');
  assertEqual(neutralItem.order, 3, 'New primer sound item should use the next order value.');

  const importPreview = validateImportPayload({
    primerDrafts: {
      primer_import_list: {
        primerTitle: 'Imported primer title',
        primerTitleCy: 'Teitl preimiwr wedi ei fewnforio',
        primerBody: 'Imported primer body with a space.',
        primerBodyCy: 'Corff preimiwr wedi ei fewnforio gyda bwlch.',
        primerSoundItems: [
          { label: 'LL', labelCy: 'LL', audioText: 'lle', audioUrl: 'https://example.test/ll.mp3', audioStatus: 'ready', audioSource: 'manual' },
          { label: 'RH', textToSpeak: 'rhif' }
        ]
      }
    },
    lists: [{
      id: 'primer_import_list',
      slug: 'primer-import-list',
      name: 'Primer Import List',
      language: 'cy',
      dialect: 'Mixed',
      stage: 'Foundations',
      focus: 'Patterns',
      difficulty: 1,
      order: 1,
      isActive: true,
      words: [{
        id: 'primer_import_list_001',
        englishPrompt: 'place',
        welshAnswer: 'lle',
        audioStatus: 'missing',
        order: 1
      }]
    }]
  });
  assertEqual(importPreview.errors.length, 0, 'PrimerDraft import payload should validate.');
  const importedPrimer = importPreview.content.lists[0]?.primerContent;
  assert(importedPrimer, 'Importer should populate list-level primerContent from top-level primerDrafts.');
  assertEqual(importedPrimer.enabled, true, 'Imported primerDrafts should enable DB primer content.');
  assertEqual(importedPrimer.titleEn, 'Imported primer title', 'Importer should copy English primer title from primerDrafts.');
  assertEqual(importedPrimer.bodyEn, 'Imported primer body with a space.', 'Importer should copy English primer body from primerDrafts.');
  assertEqual(importedPrimer.titleCy, 'Teitl preimiwr wedi ei fewnforio', 'Importer should copy Welsh primer title from primerDrafts.');
  assertEqual(importedPrimer.bodyCy, 'Corff preimiwr wedi ei fewnforio gyda bwlch.', 'Importer should copy Welsh primer body from primerDrafts.');
  assertEqual(importedPrimer.soundItems.length, 2, 'Importer should create ordered sound items from primerDrafts.');
  assertEqual(importedPrimer.soundItems[0].label, 'LL', 'Importer should preserve sound item labels.');
  assertEqual(importedPrimer.soundItems[0].labelCy, 'LL', 'Importer should preserve Welsh sound item labels.');
  assertEqual(importedPrimer.soundItems[0].textToSpeak, 'lle', 'Importer should preserve audioText as textToSpeak.');
  assertEqual(importedPrimer.soundItems[0].audioUrl, 'https://example.test/ll.mp3', 'Importer should preserve existing primer audio URL.');
  assertEqual(importedPrimer.soundItems[0].audioStatus, 'ready', 'Importer should preserve existing primer audio status.');
  assertEqual(importedPrimer.soundItems[0].audioSource, 'manual', 'Importer should preserve existing primer audio source.');
  assertEqual(importedPrimer.soundItems[1].audioStatus, 'missing', 'Importer should default missing primer audio status to missing.');
  assertEqual(importedPrimer.soundItems[1].audioSource, 'unknown', 'Importer should default missing primer audio source to unknown.');

  const legacyStoredPrimer = normalizePrimerContent({
    enabled: true,
    primerTitle: 'Legacy DB primer title',
    primerTitleCy: 'Teitl Cymraeg legacy',
    primerBody: 'Legacy DB primer body.',
    primerBodyCy: 'Corff Cymraeg legacy.',
    primerSoundButtons: [
      { label: 'Y', labelCy: 'Y Cymraeg', textToSpeak: 'byd' }
    ]
  });
  assertEqual(legacyStoredPrimer.titleEn, 'Legacy DB primer title', 'Admin repository normalization should read legacy primerTitle from stored primer_content.');
  assertEqual(legacyStoredPrimer.titleCy, 'Teitl Cymraeg legacy', 'Admin repository normalization should read legacy primerTitleCy from stored primer_content.');
  assertEqual(legacyStoredPrimer.bodyCy, 'Corff Cymraeg legacy.', 'Admin repository normalization should read legacy primerBodyCy from stored primer_content.');
  assertEqual(legacyStoredPrimer.soundItems[0].labelCy, 'Y Cymraeg', 'Admin repository normalization should read legacy primerSoundButtons labelCy.');

  const preservePreview = validateImportPayload({
    primerDrafts: {
      existing_primer_list: {
        primerTitle: 'Updated English title',
        primerTitleCy: '',
        primerBody: 'Updated English body.',
        primerSoundItems: [
          { id: 'dd_sound', key: 'dd_sound', label: 'DD', textToSpeak: 'hedd' }
        ]
      }
    },
    lists: [{
      id: 'existing_primer_list',
      slug: 'existing-primer-list',
      name: 'Existing Primer List',
      language: 'cy',
      dialect: 'Mixed',
      stage: 'Foundations',
      focus: 'Patterns',
      difficulty: 1,
      order: 1,
      isActive: true,
      words: [{
        id: 'existing_primer_list_001',
        englishPrompt: 'peace',
        welshAnswer: 'hedd',
        audioStatus: 'missing',
        order: 1
      }]
    }]
  }, {
    existingListIds: ['existing_primer_list'],
    existingWordIds: ['existing_primer_list_001'],
    existingPrimerContentByListId: {
      existing_primer_list: {
        enabled: true,
        titleEn: 'Old English title',
        titleCy: 'Teitl Cymraeg presennol',
        bodyEn: 'Old English body.',
        bodyCy: 'Corff Cymraeg presennol.',
        soundItems: [{
          id: 'dd_sound',
          key: 'dd_sound',
          label: 'DD',
          labelCy: 'Label Cymraeg presennol',
          textToSpeak: 'hedd',
          audioUrl: '',
          audioStatus: 'missing',
          audioSource: 'unknown',
          order: 1
        }]
      }
    }
  });
  assertEqual(preservePreview.errors.length, 0, 'English-only primer preservation payload should validate.');
  const preservedPrimer = preservePreview.content.lists[0]?.primerContent;
  assert(preservedPrimer, 'Preservation import should normalize primer content.');
  assertEqual(preservedPrimer.titleEn, 'Updated English title', 'English primer title should remain importable.');
  assertEqual(preservedPrimer.bodyEn, 'Updated English body.', 'English primer body should remain importable.');
  assertEqual(preservedPrimer.titleCy, 'Teitl Cymraeg presennol', 'Blank incoming Welsh title should preserve existing DB titleCy.');
  assertEqual(preservedPrimer.bodyCy, 'Corff Cymraeg presennol.', 'Missing incoming Welsh body should preserve existing DB bodyCy.');
  assertEqual(preservedPrimer.soundItems[0].labelCy, 'Label Cymraeg presennol', 'Blank incoming sound labelCy should preserve existing DB labelCy by stable key.');

  const list = await mockAdminRepository.getWordList('foundations_first_words');
  assert(list, 'Expected first words list in mock admin repository.');
  const originalWordCount = list.words.length;

  const saved = await mockAdminRepository.saveWordList({
    ...list,
    primerContent: {
      enabled: true,
      titleEn: 'Database primer title',
      titleCy: 'Teitl cronfa ddata',
      bodyEn: 'Database primer body.',
      bodyCy: 'Corff cronfa ddata.',
      soundItems: [
        {
          id: 'dd_sound',
          key: 'dd_sound',
          label: 'DD',
          labelCy: 'DD',
          textToSpeak: 'hedd',
          audioUrl: 'https://example.test/dd-admin.mp3',
          audioStatus: 'ready',
          audioSource: 'manual',
          order: 1
        }
      ]
    }
  });

  assertEqual(saved.primerContent?.enabled, true, 'Admin save should persist primer enabled state.');
  assertEqual(saved.primerContent?.titleEn, 'Database primer title', 'Admin save should persist English primer title.');
  assertEqual(saved.primerContent?.titleCy, 'Teitl cronfa ddata', 'Admin save should persist Welsh primer title.');
  assertEqual(saved.primerContent?.bodyCy, 'Corff cronfa ddata.', 'Admin save should persist Welsh primer body.');
  assertEqual(saved.primerContent?.soundItems.length, 1, 'Admin save should persist added primer sound items.');

  const edited = await mockAdminRepository.saveWordList({
    ...saved,
    primerContent: {
      ...saved.primerContent!,
      soundItems: [
        { ...saved.primerContent!.soundItems[0], label: 'DD edited', textToSpeak: 'heddwch' },
        {
          id: 'd_sound',
          key: 'd_sound',
          label: 'D',
          labelCy: 'D',
          textToSpeak: 'da',
          audioUrl: '',
          audioStatus: 'missing',
          audioSource: 'unknown',
          order: 2
        }
      ]
    }
  });
  assertEqual(edited.primerContent?.soundItems[0].label, 'DD edited', 'Admin save should persist edited primer sound item labels.');
  assertEqual(edited.primerContent?.soundItems[0].labelCy, 'DD', 'Admin save should preserve existing Welsh primer sound labels while editing English labels.');
  assertEqual(edited.primerContent?.soundItems.length, 2, 'Admin save should persist additional primer sound items.');

  const removed = await mockAdminRepository.saveWordList({
    ...edited,
    primerContent: {
      ...edited.primerContent!,
      soundItems: edited.primerContent!.soundItems.filter(item => item.key !== 'd_sound')
    }
  });
  assertEqual(removed.primerContent?.soundItems.length, 1, 'Admin save should persist removed primer sound items.');

  const generated = await mockAdminRepository.generatePrimerAudioItem(removed.id, 'dd_sound', 'azure');
  assert(generated.ok, 'Primer Azure generation should succeed in mock repository.');
  const firstGeneratedPrimerAudioUrl = generated.item.audioUrl;
  const afterPrimerAudio = await mockAdminRepository.getWordList(removed.id);
  assert(afterPrimerAudio, 'Expected list after primer audio generation.');
  assertEqual(afterPrimerAudio.words.length, originalWordCount, 'Primer audio generation must not create fake word records.');
  assertEqual(afterPrimerAudio.primerContent?.soundItems[0].audioSource, 'azure', 'Primer audio generation should update source.');
  assertEqual(afterPrimerAudio.primerContent?.soundItems[0].audioStatus, 'ready', 'Primer audio generation should mark audio ready.');
  assert(
    firstGeneratedPrimerAudioUrl.includes('/cy-primer/foundations-first-words/dd-sound/'),
    'Primer Azure generation should store regenerated audio at a versioned primer object path.'
  );

  const cleared = await mockAdminRepository.clearPrimerAudioItem(removed.id, 'dd_sound');
  assert(cleared.ok, 'Primer audio clearing should succeed in mock repository.');
  const afterClear = await mockAdminRepository.getWordList(removed.id);
  assert(afterClear, 'Expected list after clearing primer audio.');
  assertEqual(afterClear?.primerContent?.soundItems[0].audioUrl, '', 'Primer audio clearing should reset the audio URL.');
  assertEqual(afterClear?.primerContent?.soundItems[0].audioStatus, 'missing', 'Primer audio clearing should mark preview audio missing.');
  assertEqual(afterClear?.primerContent?.soundItems[0].audioSource, 'unknown', 'Primer audio clearing should remove the generated source marker.');

  assert(afterClear.primerContent, 'Expected primer content after clearing primer audio.');
  const editedAfterClear = await mockAdminRepository.saveWordList({
    ...afterClear,
    primerContent: {
      ...afterClear.primerContent,
      soundItems: afterClear.primerContent.soundItems.map(item => item.key === 'dd_sound' ? { ...item, textToSpeak: 'heddwch' } : item)
    }
  });
  const regenerated = await mockAdminRepository.generatePrimerAudioItem(editedAfterClear.id, 'dd_sound', 'azure');
  assert(regenerated.ok, 'Primer Azure regeneration after clearing should succeed in mock repository.');
  const afterRegenerate = await mockAdminRepository.getWordList(editedAfterClear.id);
  assert(afterRegenerate, 'Expected list after primer audio regeneration.');
  assertEqual(afterRegenerate.primerContent?.soundItems[0].textToSpeak, 'heddwch', 'Primer Azure regeneration should use the current saved textToSpeak value.');
  assert(
    afterRegenerate.primerContent?.soundItems[0].audioUrl !== firstGeneratedPrimerAudioUrl,
    'Primer Azure regeneration should change audioUrl so preview and learner playback do not reuse stale cached audio.'
  );

  const databasePrimer = getFoundationsPrimer(afterRegenerate, 'en');
  assert(databasePrimer, 'Learner primer should resolve database primer content.');
  assertEqual(databasePrimer.title, 'Database primer title', 'Database primer content should override JSON primerDraft fallback.');
  assertEqual(databasePrimer.soundItems[0].audioUrl, afterRegenerate.primerContent?.soundItems[0].audioUrl, 'Learner primer should expose the regenerated stored primer audio URL before dynamic fallback.');

  const sourceCollection = await mockAdminRepository.getCollection('spelio_core_welsh');
  assert(sourceCollection, 'Expected source collection for collection intro audio test.');
  await mockAdminRepository.createCollection({
    ...sourceCollection,
    id: WELSH_FOUNDATIONS_COLLECTION_ID,
    slug: 'spelio-welsh-foundations',
    name: 'Welsh Spelling Foundations',
    nameCy: 'Sylfeini Sillafu Cymraeg',
    order: 50,
    introContent: createDefaultFoundationsIntroContent()
  });
  const generatedWelshIntroAudio = await mockAdminRepository.generateCollectionIntroAudio(WELSH_FOUNDATIONS_COLLECTION_ID, 'cy', 'azure');
  assert(generatedWelshIntroAudio.ok, 'Collection intro Welsh Azure generation should succeed in mock repository.');
  assertEqual(generatedWelshIntroAudio.audioStatus, 'ready', 'Collection intro Azure generation should mark audio ready.');
  assertEqual(generatedWelshIntroAudio.audioSource, 'azure', 'Collection intro Azure generation should update source.');
  assert(
    generatedWelshIntroAudio.audioUrl.includes('/collection-intros/azure/spelio-welsh-foundations/cy/'),
    'Collection intro Azure generation should store regenerated audio at a versioned collection-intro object path.'
  );
  const afterIntroAudio = await mockAdminRepository.getCollection(WELSH_FOUNDATIONS_COLLECTION_ID);
  assertEqual(afterIntroAudio?.introContent?.audioUrlCy, generatedWelshIntroAudio.audioUrl, 'Collection intro should persist regenerated Welsh audio URL.');
  const clearedIntroAudio = await mockAdminRepository.clearCollectionIntroAudio(WELSH_FOUNDATIONS_COLLECTION_ID, 'cy');
  assert(clearedIntroAudio.ok, 'Collection intro audio clearing should succeed in mock repository.');
  assertEqual(clearedIntroAudio.audioUrl, '', 'Collection intro audio clearing should reset stale Welsh audio URL.');
  assertEqual(clearedIntroAudio.audioStatus, 'missing', 'Collection intro audio clearing should mark Welsh audio missing.');
  assertEqual(clearedIntroAudio.audioSource, 'unknown', 'Collection intro audio clearing should remove generated Welsh source marker.');

  const wordAudioResult = await mockAdminRepository.generateAudioForWord(afterRegenerate.words[0].id);
  assert(wordAudioResult.ok, 'Normal word audio generation should still work.');
  const finalList = await mockAdminRepository.getWordList(removed.id);
  assertEqual(finalList?.words.length, originalWordCount, 'Normal and primer audio operations should preserve word count.');
}
