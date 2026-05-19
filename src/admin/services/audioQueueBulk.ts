import type { AdminWord } from '../types';
import type { AudioGenerationResult } from './audioGeneration';

type BulkAudioWord = Pick<AdminWord, 'id' | 'audioStatus'>;
type BulkElevenLabsAudioWord = Pick<AdminWord, 'id' | 'welshAnswer' | 'elevenLabsAudioStatus'>;

export function canBulkGenerateAudio(word: BulkAudioWord) {
  return word.audioStatus === 'missing' || word.audioStatus === 'failed' || word.audioStatus === 'ready';
}

export function getSelectedVisibleBulkAudioIds(selectedIds: string[], visibleWords: BulkAudioWord[]) {
  const visibleGeneratableIds = new Set(visibleWords.filter(canBulkGenerateAudio).map(word => word.id));
  return selectedIds.filter(id => visibleGeneratableIds.has(id));
}

export function canBulkGenerateElevenLabsAudio(word: BulkElevenLabsAudioWord) {
  return Boolean(word.welshAnswer.trim()) &&
    (word.elevenLabsAudioStatus === 'missing' || word.elevenLabsAudioStatus === 'failed');
}

export function getSelectedVisibleBulkElevenLabsAudioIds(selectedIds: string[], visibleWords: BulkElevenLabsAudioWord[]) {
  const visibleGeneratableIds = new Set(visibleWords.filter(canBulkGenerateElevenLabsAudio).map(word => word.id));
  return selectedIds.filter(id => visibleGeneratableIds.has(id));
}

export function includesGeneratedAudio(words: BulkAudioWord[]) {
  return words.some(word => word.audioStatus === 'ready');
}

export function getBulkAudioActionLabel(words: BulkAudioWord[]) {
  return includesGeneratedAudio(words) ? 'Regenerate selected' : 'Generate selected';
}

export function getBulkAudioRunningLabel(includesGenerated: boolean, count: number) {
  return `${includesGenerated ? 'Regenerating' : 'Generating'} ${count}...`;
}

export function summarizeBulkAudioGeneration(results: AudioGenerationResult[], requestedCount: number) {
  const failed = results.filter(result => !result.ok).length;
  if (failed) {
    const succeeded = Math.max(0, results.length - failed);
    return `Audio generation finished with ${succeeded} generated and ${failed} failure(s).`;
  }
  return `Generated ${requestedCount} selected audio item(s).`;
}

export function summarizeBulkElevenLabsAudioGeneration(results: AudioGenerationResult[], requestedCount: number) {
  const failed = results.filter(result => !result.ok).length;
  const succeeded = Math.max(0, results.length - failed);
  if (failed) return `ElevenLabs generation finished with ${succeeded} generated and ${failed} failure(s).`;
  return `Generated ${requestedCount} ElevenLabs audio item(s).`;
}
