import type { PracticeWord, WordList } from '../data/wordLists';
import { isSupportWordList } from '../data/supportWordLists';
import { playAudioUrl } from './audioPlayback';
import { isAudioUnavailableForPrompt } from './practice/audioAvailability';

export type SpellingBasicsAudioResolution = {
  word: PracticeWord | null;
  audioUrl: string;
  audioStatus: PracticeWord['audioStatus'];
  available: boolean;
};

export type SpellingBasicsAudioEvent = {
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

function normalizeWelshLookup(value: string) {
  return value.trim().toLocaleLowerCase('cy');
}

function wordMatchesWelsh(word: PracticeWord, welsh: string) {
  const target = normalizeWelshLookup(welsh);
  if (normalizeWelshLookup(word.welshAnswer) === target) return true;
  return (word.acceptedAlternatives ?? []).some(alternative => normalizeWelshLookup(alternative) === target);
}

function rankAudioCandidate(list: WordList, preferredListId?: string | null) {
  if (preferredListId && list.id === preferredListId) return 0;
  if (isSupportWordList(list)) return 1;
  return 2;
}

export function resolveSpellingBasicsExampleAudio(
  welsh: string,
  lists: WordList[],
  preferredListId?: string | null
): SpellingBasicsAudioResolution {
  const candidates = lists
    .filter(list => list.isActive)
    .flatMap(list => list.words.map(word => ({ list, word })))
    .filter(candidate => wordMatchesWelsh(candidate.word, welsh))
    .sort((a, b) => (
      rankAudioCandidate(a.list, preferredListId) - rankAudioCandidate(b.list, preferredListId) ||
      Number(isAudioUnavailableForPrompt(a.word)) - Number(isAudioUnavailableForPrompt(b.word)) ||
      a.word.order - b.word.order
    ));
  const word = candidates[0]?.word ?? null;

  return {
    word,
    audioUrl: word?.audioUrl ?? '',
    audioStatus: word?.audioStatus ?? 'missing',
    available: word ? !isAudioUnavailableForPrompt(word) : false
  };
}

export function createSupportPracticeRoute(listId: string, returnTo: string) {
  return `/practice?supportListId=${encodeURIComponent(listId)}&returnTo=${encodeURIComponent(returnTo)}`;
}

export async function handleSpellingBasicsExampleAudioClick(
  event: SpellingBasicsAudioEvent,
  resolution: SpellingBasicsAudioResolution,
  options: {
    play?: (audioUrl?: string | null) => Promise<boolean>;
    onUnavailable?: () => void;
  } = {}
) {
  event.preventDefault?.();
  event.stopPropagation?.();

  if (!resolution.available) {
    options.onUnavailable?.();
    return false;
  }

  return (options.play ?? playAudioUrl)(resolution.audioUrl);
}
