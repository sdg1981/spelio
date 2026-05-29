import type { WordListPrimerContent, WordListPrimerSoundItem } from '../../data/wordLists';
import { normalizePrimerContent } from '../../content/foundationsPrimer';

export function applyPrimerContentDraftUpdate(
  current: WordListPrimerContent | null | undefined,
  updater: (primer: WordListPrimerContent) => WordListPrimerContent
) {
  return updater(normalizePrimerContent(current));
}

export function createNeutralPrimerSoundItem(order: number, key = `primer_sound_${Date.now()}`): WordListPrimerSoundItem {
  return {
    id: key,
    key,
    label: '',
    labelCy: '',
    textToSpeak: '',
    audioUrl: '',
    audioStatus: 'missing',
    audioSource: 'unknown',
    order
  };
}
