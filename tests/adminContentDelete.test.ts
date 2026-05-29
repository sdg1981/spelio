import { clearCollectionContentWithClient, deleteWordListWithClient } from '../src/admin/repositories/contentDelete';
import { getDeleteConfirmationPhrase, isAdminContentDeleteAllowed, isDeleteConfirmationValid } from '../src/admin/services/contentDeleteSafety';

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

type Row = Record<string, string>;

class FakeSupabaseClient {
  tables: Record<string, Row[]>;
  operations: string[] = [];

  constructor(tables: Record<string, Row[]>) {
    this.tables = tables;
  }

  from(table: string) {
    return new FakeQuery(this, table);
  }
}

class FakeQuery {
  private filters: Array<{ field: string; value: string | string[]; kind: 'eq' | 'in' }> = [];
  private operation: 'select' | 'delete' = 'select';

  constructor(private client: FakeSupabaseClient, private table: string) {}

  select() {
    this.operation = 'select';
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(field: string, value: string) {
    this.filters.push({ field, value, kind: 'eq' });
    return this;
  }

  in(field: string, value: string[]) {
    this.filters.push({ field, value, kind: 'in' });
    return this;
  }

  then(resolve: (value: { data?: Row[]; error: null }) => void) {
    resolve(this.execute());
  }

  private execute() {
    const rows = this.client.tables[this.table] ?? [];
    const matches = rows.filter(row => this.matches(row));
    if (this.operation === 'delete') {
      this.client.operations.push(`delete:${this.table}`);
      this.client.tables[this.table] = rows.filter(row => !this.matches(row));
      return { error: null };
    }
    this.client.operations.push(`select:${this.table}`);
    return { data: matches.map(row => ({ id: row.id })), error: null };
  }

  private matches(row: Row) {
    return this.filters.every(filter => {
      if (filter.kind === 'eq') return row[filter.field] === filter.value;
      return Array.isArray(filter.value) && filter.value.includes(row[filter.field]);
    });
  }
}

assert(!isAdminContentDeleteAllowed(undefined), 'Delete flag should default to disabled.');
assert(!isAdminContentDeleteAllowed('TRUE'), 'Delete flag should require exact lowercase true.');
assert(isAdminContentDeleteAllowed('true'), 'Delete flag should allow exact true.');

assertEqual(
  getDeleteConfirmationPhrase('spelio_welsh_foundations'),
  'DELETE spelio_welsh_foundations',
  'Confirmation phrase should include DELETE and the exact id.'
);
assert(isDeleteConfirmationValid('DELETE spelio_welsh_foundations', 'spelio_welsh_foundations'), 'Exact confirmation should pass.');
assert(!isDeleteConfirmationValid('delete spelio_welsh_foundations', 'spelio_welsh_foundations'), 'Confirmation should be case-sensitive.');
assert(!isDeleteConfirmationValid('DELETE spelio_core_welsh', 'spelio_welsh_foundations'), 'Confirmation should be id-specific.');

async function runRepositoryTests() {
  const collectionClient = new FakeSupabaseClient({
    word_lists: [
      { id: 'welsh-1', collection_id: 'spelio_welsh_foundations' },
      { id: 'welsh-2', collection_id: 'spelio_welsh_foundations' },
      { id: 'core-1', collection_id: 'spelio_core_welsh' }
    ],
    words: [
      { id: 'word-1', list_id: 'welsh-1' },
      { id: 'word-2', list_id: 'welsh-1' },
      { id: 'word-3', list_id: 'welsh-2' },
      { id: 'core-word-1', list_id: 'core-1' }
    ]
  });

  const collectionResult = await clearCollectionContentWithClient(collectionClient, 'spelio_welsh_foundations');
  assertEqual(collectionResult.listsDeleted, 2, 'Collection clear should report deleted lists.');
  assertEqual(collectionResult.wordsDeleted, 3, 'Collection clear should report deleted words.');
  assertArrayEqual(collectionClient.operations, ['select:word_lists', 'select:words', 'delete:words', 'delete:word_lists'], 'Repository helper should delete words before lists.');
  assertArrayEqual(collectionClient.tables.word_lists.map(row => row.id), ['core-1'], 'Collection clear should leave unrelated lists untouched.');
  assertArrayEqual(collectionClient.tables.words.map(row => row.id), ['core-word-1'], 'Collection clear should leave unrelated words untouched.');

  const listClient = new FakeSupabaseClient({
    word_lists: [
      { id: 'list-a', collection_id: 'spelio_welsh_foundations' },
      { id: 'list-b', collection_id: 'spelio_welsh_foundations' }
    ],
    words: [
      { id: 'word-a-1', list_id: 'list-a' },
      { id: 'word-b-1', list_id: 'list-b' }
    ]
  });

  const listResult = await deleteWordListWithClient(listClient, 'list-a');
  assertEqual(listResult.listsDeleted, 1, 'List delete should report one deleted list.');
  assertEqual(listResult.wordsDeleted, 1, 'List delete should report deleted list words.');
  assertArrayEqual(listClient.operations, ['select:words', 'delete:words', 'delete:word_lists'], 'List delete should delete words before the list.');
  assertArrayEqual(listClient.tables.word_lists.map(row => row.id), ['list-b'], 'List delete should leave unrelated lists untouched.');
  assertArrayEqual(listClient.tables.words.map(row => row.id), ['word-b-1'], 'List delete should leave unrelated words untouched.');
}

void runRepositoryTests().catch(error => {
  throw error;
});
