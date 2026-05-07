import type { AdminFocusFilters } from './filters';
import type { AdminStructureOption, AdminWord, AdminWordList, AdminWordListCollection, ImportValidationResult } from '../types';

export interface AdminWordWithListName extends AdminWord {
  listName: string;
}

export interface AdminRepository {
  authMode: 'password' | 'emailPassword';
  authenticateAdmin(credentials: { email?: string; password: string }): Promise<void>;
  listCollections(): Promise<AdminWordListCollection[]>;
  getCollection(id: string): Promise<AdminWordListCollection | null>;
  createCollection(collection: AdminWordListCollection): Promise<AdminWordListCollection>;
  saveCollection(collection: AdminWordListCollection): Promise<AdminWordListCollection>;
  deleteCollection(id: string): Promise<void>;
  listWordLists(): Promise<AdminWordList[]>;
  getWordList(id: string): Promise<AdminWordList | null>;
  saveWordList(list: AdminWordList): Promise<AdminWordList>;
  createWordList(list: AdminWordList): Promise<AdminWordList>;
  deleteWordList(id: string): Promise<void>;
  listWords(filters?: AdminFocusFilters): Promise<AdminWordWithListName[]>;
  getWord(id: string): Promise<AdminWord | null>;
  saveWord(word: AdminWord): Promise<AdminWord>;
  createWord(word: AdminWord): Promise<AdminWord>;
  deleteWord(id: string): Promise<void>;
  reorderWords(listId: string, orderedWordIds: string[]): Promise<void>;
  validateImport(payload: unknown): Promise<ImportValidationResult>;
  listStages(): Promise<AdminStructureOption[]>;
  listFocusCategories(): Promise<AdminStructureOption[]>;
  listDialects(): Promise<AdminStructureOption[]>;
}

export function getAudioHealth(list: AdminWordList) {
  const total = list.words.length || 1;
  const missing = list.words.filter(word => word.audioStatus === 'missing').length;
  const failed = list.words.filter(word => word.audioStatus === 'failed').length;
  const generated = list.words.filter(word => word.audioStatus === 'generated').length;
  const queued = list.words.filter(word => word.audioStatus === 'queued' || word.audioStatus === 'generating').length;
  return { missing, failed, generated, queued, percent: Math.round((generated / total) * 100) };
}
