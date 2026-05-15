export const CUSTOM_LIST_TITLE = 'Custom spelling list';
export const CUSTOM_LIST_MAX_ROWS = 10;
export const CUSTOM_LIST_INITIAL_ROWS = 4;
export const CUSTOM_LIST_WELSH_MAX_LENGTH = 80;
export const CUSTOM_LIST_ENGLISH_MAX_LENGTH = 120;

export type CustomListEntryInput = {
  welsh: string;
  english: string;
};

export type CustomListValidationErrorCode =
  | 'welshRequired'
  | 'welshTooLong'
  | 'englishTooLong'
  | 'noEntries'
  | 'repeatedSpam'
  | 'moderationRejected';

export type CustomListValidationError = {
  row?: number;
  field?: keyof CustomListEntryInput;
  code: CustomListValidationErrorCode;
};

export type CustomListValidationResult = {
  entries: CustomListEntryInput[];
  errors: CustomListValidationError[];
};

export function createEmptyCustomListRows(count = CUSTOM_LIST_INITIAL_ROWS): CustomListEntryInput[] {
  return Array.from({ length: count }, () => ({ welsh: '', english: '' }));
}

export function getVisibleCustomListRowCount(rows: CustomListEntryInput[]) {
  const lastUsedIndex = findLastUsedRowIndex(rows);
  return Math.min(CUSTOM_LIST_MAX_ROWS, Math.max(CUSTOM_LIST_INITIAL_ROWS, lastUsedIndex + 2));
}

export function normaliseCustomListEntries(rows: CustomListEntryInput[]) {
  return rows
    .slice(0, CUSTOM_LIST_MAX_ROWS)
    .map(row => ({
      welsh: row.welsh.trim(),
      english: row.english.trim()
    }))
    .filter(row => row.welsh);
}

export function validateCustomListRows(rows: CustomListEntryInput[]): CustomListValidationResult {
  const errors: CustomListValidationError[] = [];
  const trimmedRows = rows.slice(0, CUSTOM_LIST_MAX_ROWS).map(row => ({
    welsh: row.welsh.trim(),
    english: row.english.trim()
  }));
  const lastUsedIndex = findLastUsedRowIndex(trimmedRows);

  trimmedRows.forEach((row, index) => {
    if (index > lastUsedIndex) return;
    if (!row.welsh && row.english) errors.push({ row: index, field: 'welsh', code: 'welshRequired' });
    if (row.welsh.length > CUSTOM_LIST_WELSH_MAX_LENGTH) errors.push({ row: index, field: 'welsh', code: 'welshTooLong' });
    if (row.english.length > CUSTOM_LIST_ENGLISH_MAX_LENGTH) errors.push({ row: index, field: 'english', code: 'englishTooLong' });
  });

  const entries = trimmedRows.filter(row => row.welsh);
  if (!entries.length) errors.push({ code: 'noEntries' });

  const repeatedWelsh = new Map<string, number>();
  for (const entry of entries) {
    const key = entry.welsh.toLocaleLowerCase();
    repeatedWelsh.set(key, (repeatedWelsh.get(key) ?? 0) + 1);
  }
  if (entries.length >= 4 && Array.from(repeatedWelsh.values()).some(count => count >= Math.min(4, entries.length))) {
    errors.push({ code: 'repeatedSpam' });
  }

  return { entries, errors };
}

function findLastUsedRowIndex(rows: CustomListEntryInput[]) {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    if (rows[index]?.welsh.trim() || rows[index]?.english.trim()) return index;
  }
  return -1;
}
