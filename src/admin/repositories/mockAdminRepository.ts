import { adminDialects, adminFocusCategories, adminStages, adminWordLists } from '../data/mockAdminData';
import type { AdminFocusFilters } from './filters';
import type { AdminRepository, AdminWordWithListName } from './adminRepository';
import { getAudioHealth } from './adminRepository';
import type { AdminStructureOption, AdminWord, AdminWordList, ImportValidationResult } from '../types';
import { validateImportPayload } from './importValidation';

let lists = adminWordLists.map(list => ({ ...list, words: list.words.map(word => ({ ...word })) }));

function cloneList(list: AdminWordList): AdminWordList {
  return { ...list, words: list.words.map(word => ({ ...word, acceptedAlternatives: [...word.acceptedAlternatives] })) };
}

function structureOption(name: string, order: number): AdminStructureOption {
  return { id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, order, active: true };
}

export const mockAdminRepository: AdminRepository = {
  authMode: 'password',

  async authenticateAdmin(credentials) {
    if (!credentials.password.trim()) throw new Error('Enter the founder password to continue.');
  },

  async listWordLists() {
    return lists.map(cloneList);
  },

  async getWordList(id: string) {
    const list = lists.find(item => item.id === id);
    return list ? cloneList(list) : null;
  },

  async saveWordList(list: AdminWordList) {
    lists = lists.map(item => item.id === list.id ? cloneList(list) : item);
    return cloneList(list);
  },

  async createWordList(list: AdminWordList) {
    lists = [...lists, cloneList(list)].sort((a, b) => a.order - b.order);
    return cloneList(list);
  },

  async deleteWordList(id: string) {
    lists = lists.filter(list => list.id !== id);
  },

  async listWords(filters?: AdminFocusFilters) {
    let words: AdminWordWithListName[] = lists.flatMap(list => list.words.map(word => ({ ...word, acceptedAlternatives: [...word.acceptedAlternatives], listName: list.name })));
    if (filters?.listId) words = words.filter(word => word.listId === filters.listId);
    if (filters?.audioStatus) words = words.filter(word => word.audioStatus === filters.audioStatus);
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      words = words.filter(word => `${word.englishPrompt} ${word.welshAnswer} ${word.listName}`.toLowerCase().includes(search));
    }
    return words;
  },

  async getWord(id: string) {
    const word = lists.flatMap(list => list.words).find(word => word.id === id);
    return word ? { ...word, acceptedAlternatives: [...word.acceptedAlternatives] } : null;
  },

  async saveWord(word: AdminWord) {
    lists = lists.map(list => list.id === word.listId ? { ...list, words: list.words.map(item => item.id === word.id ? { ...word } : item) } : list);
    return { ...word, acceptedAlternatives: [...word.acceptedAlternatives] };
  },

  async createWord(word: AdminWord) {
    lists = lists.map(list => list.id === word.listId ? { ...list, words: [...list.words, { ...word }] } : list);
    return { ...word, acceptedAlternatives: [...word.acceptedAlternatives] };
  },

  async deleteWord(id: string) {
    lists = lists.map(list => ({ ...list, words: list.words.filter(word => word.id !== id) }));
  },

  async reorderWords(listId: string, orderedWordIds: string[]) {
    lists = lists.map(list => {
      if (list.id !== listId) return list;
      const order = new Map(orderedWordIds.map((id, index) => [id, index + 1]));
      return {
        ...list,
        words: list.words
          .map(word => ({ ...word, order: order.get(word.id) ?? word.order }))
          .sort((a, b) => a.order - b.order)
      };
    });
  },

  async validateImport(payload: unknown): Promise<ImportValidationResult> {
    const validation = validateImportPayload(payload);
    const parsed = typeof payload === 'string' ? safeParse(payload) : payload;
    const importedLists = isRecord(parsed) && Array.isArray(parsed.lists) ? parsed.lists : [];
    const ids = importedLists.map(item => isRecord(item) ? String(item.id ?? '') : '').filter(Boolean);
    const existingIds = new Set(lists.map(list => list.id));
    const updatedLists = ids.filter(id => existingIds.has(id)).length;
    const newLists = ids.length - updatedLists;
    const totalWords = importedLists.reduce((sum, item) => sum + (isRecord(item) && Array.isArray(item.words) ? item.words.length : 0), 0);
    const missingAudio = lists.reduce((sum, list) => sum + getAudioHealth(list).missing, 0);
    return {
      newLists,
      updatedLists,
      totalWords: totalWords || validation.totalWords,
      duplicates: validation.duplicates,
      missingAudio,
      warnings: validation.warnings
    };
  },

  async listStages() {
    return adminStages.map(stage => ({ id: stage.id, name: stage.name, order: stage.order, active: stage.active }));
  },

  async listFocusCategories() {
    return adminFocusCategories.map(focus => ({ id: focus.id, name: focus.name, order: focus.order, active: focus.active }));
  },

  async listDialects() {
    return adminDialects.map((name, index) => structureOption(name, index + 1));
  }
};

function safeParse(payload: string): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
