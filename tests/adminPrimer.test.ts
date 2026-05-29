import { mockAdminRepository } from '../src/admin/repositories/mockAdminRepository';
import { validateImportPayload } from '../src/admin/repositories/importValidation';
import { applyPrimerContentDraftUpdate, createNeutralPrimerSoundItem } from '../src/admin/services/primerEditor';
import { getFoundationsPrimer } from '../src/content/foundationsPrimer';
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
        primerBody: 'Imported primer body with a space.',
        primerSoundItems: [
          { label: 'LL', audioText: 'lle', audioUrl: 'https://example.test/ll.mp3', audioStatus: 'ready', audioSource: 'manual' },
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
  assertEqual(importedPrimer.titleCy, '', 'Importer should default missing Welsh primer title to empty string.');
  assertEqual(importedPrimer.soundItems.length, 2, 'Importer should create ordered sound items from primerDrafts.');
  assertEqual(importedPrimer.soundItems[0].label, 'LL', 'Importer should preserve sound item labels.');
  assertEqual(importedPrimer.soundItems[0].textToSpeak, 'lle', 'Importer should preserve audioText as textToSpeak.');
  assertEqual(importedPrimer.soundItems[0].audioUrl, 'https://example.test/ll.mp3', 'Importer should preserve existing primer audio URL.');
  assertEqual(importedPrimer.soundItems[0].audioStatus, 'ready', 'Importer should preserve existing primer audio status.');
  assertEqual(importedPrimer.soundItems[0].audioSource, 'manual', 'Importer should preserve existing primer audio source.');
  assertEqual(importedPrimer.soundItems[1].audioStatus, 'missing', 'Importer should default missing primer audio status to missing.');
  assertEqual(importedPrimer.soundItems[1].audioSource, 'unknown', 'Importer should default missing primer audio source to unknown.');

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
  const afterPrimerAudio = await mockAdminRepository.getWordList(removed.id);
  assert(afterPrimerAudio, 'Expected list after primer audio generation.');
  assertEqual(afterPrimerAudio.words.length, originalWordCount, 'Primer audio generation must not create fake word records.');
  assertEqual(afterPrimerAudio.primerContent?.soundItems[0].audioSource, 'azure', 'Primer audio generation should update source.');
  assertEqual(afterPrimerAudio.primerContent?.soundItems[0].audioStatus, 'ready', 'Primer audio generation should mark audio ready.');

  const cleared = await mockAdminRepository.clearPrimerAudioItem(removed.id, 'dd_sound');
  assert(cleared.ok, 'Primer audio clearing should succeed in mock repository.');
  const afterClear = await mockAdminRepository.getWordList(removed.id);
  assertEqual(afterClear?.primerContent?.soundItems[0].audioUrl, '', 'Primer audio clearing should reset the audio URL.');

  const databasePrimer = getFoundationsPrimer(afterPrimerAudio, 'en');
  assert(databasePrimer, 'Learner primer should resolve database primer content.');
  assertEqual(databasePrimer.title, 'Database primer title', 'Database primer content should override JSON primerDraft fallback.');
  assertEqual(databasePrimer.soundItems[0].audioUrl, generated.item.audioUrl, 'Learner primer should expose stored primer audio before dynamic fallback.');

  const wordAudioResult = await mockAdminRepository.generateAudioForWord(afterPrimerAudio.words[0].id);
  assert(wordAudioResult.ok, 'Normal word audio generation should still work.');
  const finalList = await mockAdminRepository.getWordList(removed.id);
  assertEqual(finalList?.words.length, originalWordCount, 'Normal and primer audio operations should preserve word count.');
}
