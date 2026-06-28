import type { AdminFocusFilters } from './filters';
import type { AdminStructureOption, AdminWord, AdminWordList, AdminWordListCollection, DefaultAudioProvider, ElevenLabsGenerationMode, ImportContentResult, ImportValidationResult } from '../types';
import type { InterfaceAudioClip } from '../../lib/interfaceAudio';
import type { AudioGenerationResult, AudioQueueSnapshot, CollectionIntroAudioGenerationResult, PrimerAudioGenerationResult } from '../services/audioGeneration';
import type { AdminContentExportPayload } from './contentExport';

export interface AdminWordWithListName extends AdminWord {
  listName: string;
}

export interface AdminCustomWordListSummary {
  id: string;
  publicId: string;
  createdAt: string;
  expiresAt: string;
  status: string;
  moderationStatus: string;
  wordCount: number;
  audioReady: number;
  audioFailed: number;
  shareUrl: string;
}

export interface AdminCustomWordListCleanupResult {
  expiredListCount: number;
  audioFileCount: number;
}

export interface AdminAudioSettings {
  defaultAudioProvider: DefaultAudioProvider;
  interfaceAudioClips: InterfaceAudioClip[];
}

export interface AdminContentDeletionResult {
  listsDeleted: number;
  wordsDeleted: number;
}

export interface AdminRepository {
  authMode: 'password' | 'emailPassword';
  authenticateAdmin(credentials: { email?: string; password: string }): Promise<void>;
  listCollections(): Promise<AdminWordListCollection[]>;
  getCollection(id: string): Promise<AdminWordListCollection | null>;
  createCollection(collection: AdminWordListCollection): Promise<AdminWordListCollection>;
  saveCollection(collection: AdminWordListCollection): Promise<AdminWordListCollection>;
  deleteCollection(id: string): Promise<void>;
  clearCollectionContent(collectionId: string): Promise<AdminContentDeletionResult>;
  listWordLists(): Promise<AdminWordList[]>;
  getWordList(id: string): Promise<AdminWordList | null>;
  saveWordList(list: AdminWordList): Promise<AdminWordList>;
  createWordList(list: AdminWordList): Promise<AdminWordList>;
  deleteWordList(id: string): Promise<AdminContentDeletionResult>;
  listWords(filters?: AdminFocusFilters): Promise<AdminWordWithListName[]>;
  getWord(id: string): Promise<AdminWord | null>;
  saveWord(word: AdminWord): Promise<AdminWord>;
  createWord(word: AdminWord): Promise<AdminWord>;
  deleteWord(id: string): Promise<void>;
  reorderWords(listId: string, orderedWordIds: string[]): Promise<void>;
  getAudioQueue(): Promise<AudioQueueSnapshot<AdminWordWithListName>>;
  queueAudioGeneration(wordIds: string[]): Promise<AdminWordWithListName[]>;
  generateAudioForWord(wordId: string): Promise<AudioGenerationResult>;
  generateElevenLabsAudioForWord(wordId: string, mode?: ElevenLabsGenerationMode): Promise<AudioGenerationResult>;
  generatePrimerAudioItem(listId: string, itemKey: string, provider: 'azure' | 'elevenlabs'): Promise<PrimerAudioGenerationResult>;
  clearPrimerAudioItem(listId: string, itemKey: string): Promise<PrimerAudioGenerationResult>;
  generateCollectionIntroAudio(collectionId: string, language: 'en' | 'cy', provider: 'azure'): Promise<CollectionIntroAudioGenerationResult>;
  clearCollectionIntroAudio(collectionId: string, language: 'en' | 'cy'): Promise<CollectionIntroAudioGenerationResult>;
  generateAudioBatch(wordIds: string[]): Promise<AudioGenerationResult[]>;
  retryAudioGeneration(wordId: string): Promise<AudioGenerationResult>;
  uploadAudioFile(word: AdminWord, file: Blob): Promise<string>;
  uploadElevenLabsAudioFile(word: AdminWord, file: Blob): Promise<string>;
  getAudioSettings(): Promise<AdminAudioSettings>;
  saveAudioSettings(settings: AdminAudioSettings): Promise<AdminAudioSettings>;
  generateInterfaceAudioClip(clip: InterfaceAudioClip): Promise<InterfaceAudioClip>;
  listCustomWordLists(): Promise<AdminCustomWordListSummary[]>;
  cleanupExpiredCustomWordLists(): Promise<AdminCustomWordListCleanupResult>;
  previewImport(payload: unknown): Promise<ImportValidationResult>;
  importContent(payload: unknown): Promise<ImportContentResult>;
  validateImport(payload: unknown): Promise<ImportValidationResult>;
  exportContent(): Promise<AdminContentExportPayload>;
  listStages(): Promise<AdminStructureOption[]>;
  listFocusCategories(): Promise<AdminStructureOption[]>;
  listDialects(): Promise<AdminStructureOption[]>;
}

export function normalizeCustomWordListCleanupResult(value: unknown): AdminCustomWordListCleanupResult {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { expiredListCount: Math.max(0, Math.trunc(value)), audioFileCount: 0 };
  }
  if (!value || typeof value !== 'object') {
    return { expiredListCount: 0, audioFileCount: 0 };
  }
  const row = value as Record<string, unknown>;
  return {
    expiredListCount: normalizeCleanupCount(row.expiredListCount ?? row.expired_list_count),
    audioFileCount: normalizeCleanupCount(row.audioFileCount ?? row.audio_file_count)
  };
}

export function formatCustomWordListCleanupSuccess(result: AdminCustomWordListCleanupResult) {
  const listLabel = result.expiredListCount === 1 ? 'expired custom list' : 'expired custom lists';
  const audioLabel = result.audioFileCount === 1 ? 'audio file' : 'audio files';
  return `Cleaned up ${result.expiredListCount} ${listLabel} and ${result.audioFileCount} generated ${audioLabel}.`;
}

function normalizeCleanupCount(value: unknown) {
  const count = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : 0;
  return Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
}

export function getAudioHealth(list: AdminWordList) {
  const total = list.words.length || 1;
  const missing = list.words.filter(word => word.audioStatus === 'missing').length;
  const failed = list.words.filter(word => word.audioStatus === 'failed').length;
  const generated = list.words.filter(word => word.audioStatus === 'ready').length;
  const queued = list.words.filter(word => word.audioStatus === 'queued' || word.audioStatus === 'generating').length;
  return { missing, failed, generated, queued, percent: Math.round((generated / total) * 100) };
}
