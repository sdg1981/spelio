import { mockAdminRepository } from '../src/admin/repositories/mockAdminRepository';
import { getFoundationsPrimer } from '../src/content/foundationsPrimer';

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
