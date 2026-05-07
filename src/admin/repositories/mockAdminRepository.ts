import { adminDialects, adminFocusCategories, adminStages, adminWordListCollections, adminWordLists } from '../data/mockAdminData';
import type { AdminFocusFilters } from './filters';
import type { AdminRepository, AdminWordWithListName } from './adminRepository';
import type { AdminStructureOption, AdminWord, AdminWordList, AdminWordListCollection, ImportContentResult, ImportValidationResult } from '../types';
import { validateImportPayload } from './importValidation';
import { createAudioQueueSnapshot, createMockAudioUrl } from '../services/audioGeneration';

let lists = adminWordLists.map(list => ({ ...list, words: list.words.map(word => ({ ...word })) }));
let collections = adminWordListCollections.map(collection => ({ ...collection }));

function cloneList(list: AdminWordList): AdminWordList {
  return { ...list, words: list.words.map(word => ({ ...word, acceptedAlternatives: [...word.acceptedAlternatives] })) };
}

function cloneCollection(collection: AdminWordListCollection): AdminWordListCollection {
  return { ...collection };
}

function collectionName(id: string) {
  return collections.find(collection => collection.id === id)?.name ?? 'Spelio Core Welsh';
}

function structureOption(name: string, order: number): AdminStructureOption {
  return { id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, order, active: true };
}

export const mockAdminRepository: AdminRepository = {
  authMode: 'password',

  async authenticateAdmin(credentials) {
    if (!credentials.password.trim()) throw new Error('Enter the founder password to continue.');
  },

  async listCollections() {
    return collections.sort((a, b) => a.order - b.order).map(cloneCollection);
  },

  async getCollection(id: string) {
    const collection = collections.find(item => item.id === id);
    return collection ? cloneCollection(collection) : null;
  },

  async createCollection(collection: AdminWordListCollection) {
    collections = [...collections, cloneCollection(collection)].sort((a, b) => a.order - b.order);
    return cloneCollection(collection);
  },

  async saveCollection(collection: AdminWordListCollection) {
    collections = collections.map(item => item.id === collection.id ? cloneCollection(collection) : item);
    lists = lists.map(list => list.collectionId === collection.id ? { ...list, collectionName: collection.name } : list);
    return cloneCollection(collection);
  },

  async deleteCollection(id: string) {
    if (lists.some(list => list.collectionId === id)) throw new Error('Move word lists out of this collection before deleting it.');
    collections = collections.filter(collection => collection.id !== id);
  },

  async listWordLists() {
    return lists.map(list => cloneList({ ...list, collectionName: collectionName(list.collectionId) }));
  },

  async getWordList(id: string) {
    const list = lists.find(item => item.id === id);
    return list ? cloneList({ ...list, collectionName: collectionName(list.collectionId) }) : null;
  },

  async saveWordList(list: AdminWordList) {
    const saved = { ...list, collectionName: collectionName(list.collectionId) };
    lists = lists.map(item => item.id === list.id ? cloneList(saved) : item);
    return cloneList(saved);
  },

  async createWordList(list: AdminWordList) {
    const saved = { ...list, collectionName: collectionName(list.collectionId) };
    lists = [...lists, cloneList(saved)].sort((a, b) => a.order - b.order);
    return cloneList(saved);
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

  async getAudioQueue() {
    return createAudioQueueSnapshot(await this.listWords());
  },

  async queueAudioGeneration(wordIds: string[]) {
    const ids = new Set(wordIds);
    lists = lists.map(list => ({
      ...list,
      words: list.words.map(word => ids.has(word.id) && (word.audioStatus === 'missing' || word.audioStatus === 'failed')
        ? { ...word, audioStatus: 'queued' }
        : word)
    }));
    return (await this.listWords()).filter(word => ids.has(word.id));
  },

  async generateAudioForWord(wordId: string) {
    await this.queueAudioGeneration([wordId]);
    const word = await this.getWord(wordId);
    if (!word) throw new Error('Word not found.');
    const generatingWord = { ...word, audioStatus: 'generating' as const };
    await this.saveWord(generatingWord);
    const readyWord = { ...generatingWord, audioStatus: 'ready' as const, audioUrl: createMockAudioUrl(word) };
    await this.saveWord(readyWord);
    return { word: readyWord, ok: true };
  },

  async generateAudioBatch(wordIds: string[]) {
    // TODO: Replace this sequential browser loop with a protected background worker queue.
    const results = [];
    for (const wordId of wordIds) {
      try {
        results.push(await this.generateAudioForWord(wordId));
      } catch (error) {
        const word = await this.getWord(wordId);
        if (!word) throw error;
        const failedWord = { ...word, audioStatus: 'failed' as const };
        await this.saveWord(failedWord);
        results.push({ word: failedWord, ok: false, error: error instanceof Error ? error.message : 'Audio generation failed.' });
      }
    }
    return results;
  },

  async retryAudioGeneration(wordId: string) {
    return this.generateAudioForWord(wordId);
  },

  async uploadAudioFile(word: AdminWord) {
    return createMockAudioUrl(word);
  },

  async previewImport(payload: unknown): Promise<ImportValidationResult> {
    const preview = validateImportPayload(payload, {
      existingCollectionIds: collections.map(collection => collection.id),
      existingListIds: lists.map(list => list.id),
      existingWordIds: lists.flatMap(list => list.words.map(word => word.id))
    });
    return preview;
  },

  async importContent(payload: unknown): Promise<ImportContentResult> {
    // TODO: Move production imports behind a protected server/API route with transaction-like behaviour.
    const preview = validateImportPayload(payload, {
      existingCollectionIds: collections.map(collection => collection.id),
      existingListIds: lists.map(list => list.id),
      existingWordIds: lists.flatMap(list => list.words.map(word => word.id))
    });
    if (preview.errors.length) {
      return {
        success: false,
        collectionsUpserted: 0,
        listsUpserted: 0,
        wordsUpserted: 0,
        errors: preview.errors,
        warnings: preview.warnings
      };
    }

    preview.content.collections.forEach(collection => {
      const saved = cloneCollection(collection);
      collections = collections.some(item => item.id === saved.id)
        ? collections.map(item => item.id === saved.id ? saved : item)
        : [...collections, saved];
    });
    collections = collections.sort((a, b) => a.order - b.order);

    preview.content.lists.forEach(importedList => {
      const existing = lists.find(list => list.id === importedList.id);
      const importedWordIds = new Set(importedList.words.map(word => word.id));
      const mergedWords = existing
        ? [
            ...existing.words.filter(word => !importedWordIds.has(word.id)),
            ...importedList.words.map(word => ({ ...word, acceptedAlternatives: [...word.acceptedAlternatives] }))
          ].sort((a, b) => a.order - b.order)
        : importedList.words.map(word => ({ ...word, acceptedAlternatives: [...word.acceptedAlternatives] }));
      const saved = cloneList({ ...importedList, collectionName: collectionName(importedList.collectionId), words: mergedWords });
      lists = lists.some(item => item.id === saved.id)
        ? lists.map(item => item.id === saved.id ? saved : item)
        : [...lists, saved];
    });
    lists = lists.sort((a, b) => a.order - b.order);

    return {
      success: true,
      collectionsUpserted: preview.content.collections.length,
      listsUpserted: preview.content.lists.length,
      wordsUpserted: preview.content.words.length,
      errors: [],
      warnings: preview.warnings
    };
  },

  async validateImport(payload: unknown): Promise<ImportValidationResult> {
    return this.previewImport(payload);
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
