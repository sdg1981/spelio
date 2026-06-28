import {
  formatCustomWordListCleanupSuccess,
  normalizeCustomWordListCleanupResult
} from '../src/admin/repositories/adminRepository';
import { mockAdminRepository } from '../src/admin/repositories/mockAdminRepository';

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

async function run() {
  {
    const source = readFileSync('src/admin/pages/CustomListsPage.tsx', 'utf8');
    assert(source.includes('onClick={cleanupExpired}'), 'Cleanup expired button should invoke the cleanup action.');
    assert(source.includes('cleanupLoading'), 'Cleanup page should track a loading state.');
    assert(source.includes('Cleaning...'), 'Cleanup button should show an in-progress label.');
    assert(source.includes('Cleanup could not be completed'), 'Cleanup failures should show calm admin error copy.');
    assert(source.includes('await load()'), 'Successful cleanup should refresh the admin custom-list view.');
  }

  {
    const legacy = normalizeCustomWordListCleanupResult(2);
    assertEqual(legacy.expiredListCount, 2, 'Legacy numeric cleanup responses should still report expired list count.');
    assertEqual(legacy.audioFileCount, 0, 'Legacy numeric cleanup responses should default audio count to zero.');

    const current = normalizeCustomWordListCleanupResult({ expired_list_count: '3', audio_file_count: 7 });
    assertEqual(current.expiredListCount, 3, 'Snake-case cleanup responses should normalize list count.');
    assertEqual(current.audioFileCount, 7, 'Snake-case cleanup responses should normalize audio count.');

    const formatted = formatCustomWordListCleanupSuccess({ expiredListCount: 1, audioFileCount: 2 });
    assertEqual(formatted, 'Cleaned up 1 expired custom list and 2 generated audio files.', 'Success copy should include list and audio counts.');
  }

  {
    const before = await mockAdminRepository.listCustomWordLists();
    assert(before.some(list => list.expiresAt <= new Date().toISOString()), 'Mock repository should include an expired custom list for cleanup testing.');
    assert(before.some(list => list.expiresAt > new Date().toISOString()), 'Mock repository should include an active custom list for cleanup testing.');

    const result = await mockAdminRepository.cleanupExpiredCustomWordLists();
    assertEqual(result.expiredListCount, 1, 'Cleanup should remove only expired custom lists.');
    assertEqual(result.audioFileCount, 2, 'Cleanup should report associated generated audio files.');

    const after = await mockAdminRepository.listCustomWordLists();
    assertEqual(after.length, before.length - 1, 'Cleanup should remove expired custom list rows from the admin view.');
    assert(after.every(list => list.expiresAt > new Date().toISOString()), 'Active custom lists should not be removed by cleanup.');
  }
}

run()
  .then(() => {
    console.log('adminCustomLists tests passed');
  })
  .catch(error => {
    console.error(error);
    throw error;
  });
