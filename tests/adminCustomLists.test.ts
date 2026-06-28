import {
  formatCustomWordListCleanupSuccess,
  normalizeCustomWordListCleanupResult
} from '../src/admin/repositories/adminRepository';
import { mockAdminRepository } from '../src/admin/repositories/mockAdminRepository';
import {
  cleanupExpiredCustomLists,
  handleAdminCustomListsCleanupRequest
} from '../api/admin-custom-lists-cleanup.js';

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
    const repositorySource = readFileSync('src/admin/repositories/supabaseAdminRepository.ts', 'utf8');
    assert(repositorySource.includes('/api/admin-custom-lists-cleanup'), 'Cleanup should use the protected server API route.');
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

  {
    const now = new Date('2026-06-28T12:00:00.000Z');
    const client = createFakeCleanupClient([
      {
        id: 'expired-list',
        expires_at: '2026-06-01T00:00:00.000Z',
        custom_words: [
          { audio_storage_path: 'custom/cy/expired/01.mp3' },
          { audio_storage_path: 'custom/cy/expired/02.mp3' }
        ]
      },
      {
        id: 'active-list',
        expires_at: '2026-07-01T00:00:00.000Z',
        custom_words: [
          { audio_storage_path: 'custom/cy/active/01.mp3' }
        ]
      }
    ]);
    const result = await cleanupExpiredCustomLists(client as never, now);
    assertEqual(result.expiredListCount, 1, 'API cleanup should delete expired custom lists.');
    assertEqual(result.audioFileCount, 2, 'API cleanup should report removed generated audio files.');
    assertEqual(client.deletedIds.join('|'), 'expired-list', 'API cleanup should only delete expired custom-list rows.');
    assertEqual(client.removedPaths.join('|'), 'custom/cy/expired/01.mp3|custom/cy/expired/02.mp3', 'API cleanup should only remove expired custom-list audio.');
  }

  {
    const response = createJsonResponse();
    await handleAdminCustomListsCleanupRequest(
      {
        method: 'POST',
        headers: { authorization: 'Bearer test-token' }
      },
      response,
      {
        createAuthClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: 'admin' } } }) } }),
        createCleanupClient: () => createFailingCleanupClient() as never
      }
    );
    assertEqual(response.statusCode, 500, 'API cleanup failures should return a server error.');
    assertEqual(response.body.ok, false, 'API cleanup failures should not be reported as successful.');
    assertEqual(response.body.error, 'Custom list cleanup failed.', 'API cleanup failures should keep response copy calm.');
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

function createFakeCleanupClient(rows: Array<{ id: string; expires_at: string; custom_words: Array<{ audio_storage_path: string }> }>) {
  const state = {
    removedPaths: [] as string[],
    deletedIds: [] as string[],
    from(table: string) {
      assertEqual(table, 'custom_word_lists', 'Cleanup should only query custom_word_lists.');
      return {
        select() {
          return {
            async lte(column: string, value: string) {
              assertEqual(column, 'expires_at', 'Cleanup should select by expiry cutoff.');
              return {
                data: rows.filter(row => row.expires_at <= value).map(row => ({
                  id: row.id,
                  custom_words: row.custom_words
                })),
                error: null
              };
            }
          };
        },
        delete() {
          return {
            lte(column: string, value: string) {
              assertEqual(column, 'expires_at', 'Cleanup should delete by expiry cutoff.');
              return {
                async select() {
                  const expired = rows.filter(row => row.expires_at <= value);
                  state.deletedIds.push(...expired.map(row => row.id));
                  return {
                    data: expired.map(row => ({ id: row.id })),
                    error: null
                  };
                }
              };
            }
          };
        }
      };
    },
    storage: {
      from(bucket: string) {
        assertEqual(bucket, 'audio', 'Cleanup should remove generated custom-list audio from the audio bucket.');
        return {
          async remove(paths: string[]) {
            state.removedPaths.push(...paths);
            return {
              data: paths.map(name => ({ name })),
              error: null
            };
          }
        };
      }
    }
  };
  return state;
}

function createFailingCleanupClient() {
  return {
    from() {
      return {
        select() {
          return {
            async lte() {
              return {
                data: null,
                error: { message: 'relation missing', code: '42P01' }
              };
            }
          };
        }
      };
    },
    storage: {
      from() {
        return {
          async remove() {
            return { data: [], error: null };
          }
        };
      }
    }
  };
}

function createJsonResponse() {
  return {
    statusCode: 200,
    body: {} as Record<string, unknown>,
    headers: {} as Record<string, string | string[]>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: Record<string, unknown>) {
      this.body = body;
    },
    setHeader(name: string, value: string | string[]) {
      this.headers[name] = value;
    }
  };
}
