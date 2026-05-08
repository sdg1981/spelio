import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PracticeWord, WordList } from '../data/wordLists';
import { getAnswer } from '../data/wordLists';
import type { Translate } from '../i18n';
import { validateLetter } from '../lib/practice/validator';
import { classifySession, createPracticeSession, selectPreSessionRecapWord } from '../lib/practice/sessionEngine';
import type { SessionWord } from '../lib/practice/sessionEngine';
import type { SessionResult, SpelioSettings, SpelioStorage, WordProgressPatch } from '../lib/practice/storage';
import { addLearningStats, applyWordProgressPatch, updateListCompletion } from '../lib/practice/storage';
import { addActiveInteractionTime, type ActiveWordTiming } from '../lib/practice/progress';
import { playAudioUrl } from '../lib/audioPlayback';

interface LetterState {
  value: string;
  revealed?: boolean;
  wrong?: boolean;
}

export type PracticeStatusTone = 'success' | 'error' | 'neutral';

const REVEALED_WORD_COMPLETION_DELAY_MS = 360;
const SUCCESS_UNDERLINE_STAGGER_MS = 42;
const SUCCESS_UNDERLINE_DURATION_MS = 160;
const SUCCESS_CONFIRMATION_PAUSE_MS = 450;

function createInitialLetters(answer: string): LetterState[] {
  return answer.split('').map(char => ({ value: char === ' ' ? ' ' : '' }));
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getSuccessAdvanceDelay(answer: string) {
  if (prefersReducedMotion()) return SUCCESS_CONFIRMATION_PAUSE_MS;

  const visibleLetterCount = answer.replace(/\s/g, '').length;
  const finalUnderlineDelay = Math.max(0, visibleLetterCount - 1) * SUCCESS_UNDERLINE_STAGGER_MS;
  return finalUnderlineDelay + SUCCESS_UNDERLINE_DURATION_MS + SUCCESS_CONFIRMATION_PAUSE_MS;
}

function findNextInputIndex(answer: string, letters: LetterState[], start = 0) {
  for (let index = start; index < answer.length; index += 1) {
    if (answer[index] !== ' ' && !letters[index]?.value) return index;
  }
  return -1;
}

function isInputSpace(char: string) {
  return char === ' ';
}

function getAnswerCandidates(word: PracticeWord) {
  return [getAnswer(word), ...(word.acceptedAlternatives ?? [])];
}

function validateInputAtIndex(char: string, word: PracticeWord, index: number, mode: SpelioSettings['welshSpelling']) {
  return getAnswerCandidates(word).some(candidate => {
    const expected = candidate[index];
    if (!expected || expected === ' ') return false;
    return validateLetter(char, expected, mode);
  });
}

function playTone(type: 'success' | 'error' | 'completion') {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = type === 'error' ? 180 : type === 'completion' ? 660 : 520;
    gain.gain.value = 0.035;

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.14);

    window.setTimeout(() => context.close().catch(() => undefined), 240);
  } catch {
    // Sound effects are non-critical.
  }
}

export function usePracticeSession({
  lists,
  storage,
  sessionStorage = storage,
  reviewDifficult = false,
  includeRecapDue = false,
  sessionKey = 0,
  onStorageChange,
  onComplete,
  t = key => key
}: {
  lists: WordList[];
  storage: SpelioStorage;
  sessionStorage?: SpelioStorage;
  reviewDifficult?: boolean;
  includeRecapDue?: boolean;
  sessionKey?: number;
  onStorageChange: (next: SpelioStorage) => void;
  onComplete: (result: SessionResult, nextStorage: SpelioStorage) => void;
  t?: Translate;
}) {
  const session = useMemo(
    () => createPracticeSession(lists, sessionStorage, reviewDifficult, includeRecapDue),
    [lists, sessionKey, sessionStorage, reviewDifficult, includeRecapDue]
  );
  const recapWord = useMemo(
    () => selectPreSessionRecapWord(sessionStorage, lists, session.words, reviewDifficult),
    [lists, sessionKey, reviewDifficult, session.words, sessionStorage]
  );
  const sessionIdentity = `${recapWord?.id ?? ''}:${session.words.map(word => word.id).join('|')}`;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecapActive, setIsRecapActive] = useState(Boolean(recapWord));
  const currentWord = isRecapActive ? recapWord : session.words[currentIndex];
  const [letters, setLetters] = useState<LetterState[]>(() => createInitialLetters(currentWord ? getAnswer(currentWord) : ''));
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<PracticeStatusTone>('neutral');
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isCompletingRevealedWord, setIsCompletingRevealedWord] = useState(false);
  const [stats, setStats] = useState({
    correctWords: 0,
    incorrectWordIds: new Set<string>(),
    revealedWordIds: new Set<string>(),
    incorrectAttempts: 0,
    revealedLetters: 0,
    startedAt: Date.now(),
    endedAt: undefined as number | undefined
  });
  const statusTimerRef = useRef<number | null>(null);
  const wrongTimerRef = useRef<number | null>(null);
  const revealedCompletionTimerRef = useRef<number | null>(null);
  const inputLockedRef = useRef(false);
  const isCompletingRevealedWordRef = useRef(false);
  const recapIssueRef = useRef(false);
  const storageRef = useRef(storage);
  const incorrectWordIdsRef = useRef(new Set<string>());
  const revealedWordIdsRef = useRef(new Set<string>());
  const sessionActiveMsRef = useRef(0);
  const wordTimingRef = useRef<ActiveWordTiming>({
    wordStartedAt: Date.now(),
    lastInteractionAt: null,
    activeMs: 0
  });

  useEffect(() => {
    storageRef.current = storage;
  }, [storage]);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
      if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
      if (revealedCompletionTimerRef.current) window.clearTimeout(revealedCompletionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
    setIsRecapActive(Boolean(recapWord));
    setIsComplete(false);
    setStatus(null);
    setStatusTone('neutral');
    setWrongIndex(null);
    setIsCompletingRevealedWord(false);
    isCompletingRevealedWordRef.current = false;
    inputLockedRef.current = false;
    if (revealedCompletionTimerRef.current) {
      window.clearTimeout(revealedCompletionTimerRef.current);
      revealedCompletionTimerRef.current = null;
    }
    setStats({
      correctWords: 0,
      incorrectWordIds: new Set<string>(),
      revealedWordIds: new Set<string>(),
      incorrectAttempts: 0,
      revealedLetters: 0,
      startedAt: Date.now(),
      endedAt: undefined
    });
    incorrectWordIdsRef.current = new Set<string>();
    revealedWordIdsRef.current = new Set<string>();
    sessionActiveMsRef.current = 0;
    wordTimingRef.current = {
      wordStartedAt: Date.now(),
      lastInteractionAt: null,
      activeMs: 0
    };
    recapIssueRef.current = false;
    const firstWord = recapWord ?? session.words[0];
    setLetters(createInitialLetters(firstWord ? getAnswer(firstWord) : ''));
  }, [sessionIdentity]);

  useEffect(() => {
    if (!currentWord) return;
    wordTimingRef.current = {
      wordStartedAt: Date.now(),
      lastInteractionAt: null,
      activeMs: 0
    };
    setLetters(createInitialLetters(getAnswer(currentWord)));
    setWrongIndex(null);
    setIsCompletingRevealedWord(false);
    isCompletingRevealedWordRef.current = false;
    recapIssueRef.current = false;
    inputLockedRef.current = false;

    if (storage.settings.audioPrompts && currentWord.audioUrl) {
      void playAudioUrl(currentWord.audioUrl);
    }
  }, [currentWord?.id]);

  function recordPracticeInteraction() {
    const previous = wordTimingRef.current;
    const next = addActiveInteractionTime(previous, Date.now());
    sessionActiveMsRef.current += Math.max(0, next.activeMs - previous.activeMs);
    wordTimingRef.current = next;
  }

  function showStatus(message: string, tone: PracticeStatusTone = 'neutral') {
    setStatus(message);
    setStatusTone(tone);
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
    statusTimerRef.current = window.setTimeout(() => setStatus(null), 1500);
  }

  const playAudio = useCallback(() => {
    if (!storageRef.current.settings.audioPrompts) return;
    recordPracticeInteraction();

    if (!currentWord?.audioUrl) {
      showStatus(t('practice.audioUnavailable'));
      return;
    }

    playAudioUrl(currentWord.audioUrl).then(played => {
      if (!played) showStatus(t('practice.audioUnavailable'));
    });
  }, [currentWord?.id, t]);

  function persistWordProgress(word: PracticeWord, patch: WordProgressPatch) {
    const currentStorage = storageRef.current;
    const nextStorage = applyWordProgressPatch(currentStorage, word, patch);

    storageRef.current = nextStorage;
    onStorageChange(nextStorage);
  }

  const finishSession = useCallback((finalStats = stats) => {
    const endedAt = Date.now();
    const cleanCorrectWords = Math.max(
      0,
      session.words.length -
        new Set([
          ...Array.from(finalStats.incorrectWordIds),
          ...Array.from(finalStats.revealedWordIds)
        ]).size
    );

    const base = {
      totalWords: session.words.length,
      correctWords: cleanCorrectWords,
      incorrectWords: finalStats.incorrectWordIds.size,
      revealedWords: finalStats.revealedWordIds.size,
      incorrectAttempts: finalStats.incorrectAttempts,
      revealedLetters: finalStats.revealedLetters,
      durationSeconds: Math.max(1, Math.round((endedAt - finalStats.startedAt) / 1000)),
      listIds: session.listIds
    };
    const result: SessionResult = { ...base, state: classifySession(base) };

    let nextStorage: SpelioStorage = {
      ...storageRef.current,
      lastSessionDate: new Date().toISOString(),
      lastSessionResult: result,
      completedNormalSessionCount: reviewDifficult
        ? storageRef.current.completedNormalSessionCount
        : (storageRef.current.completedNormalSessionCount ?? 0) + 1
    };
    nextStorage = addLearningStats(nextStorage, sessionActiveMsRef.current, nextStorage.lastSessionDate ?? undefined);
    nextStorage = updateListCompletion(nextStorage, lists, result);

    const completedSingleListId = result.listIds.length === 1 ? result.listIds[0] : null;
    const completedList = completedSingleListId ? lists.find(list => list.id === completedSingleListId) : undefined;
    const nextListId = completedList?.nextListId;
    const shouldAdvancePath =
      !reviewDifficult &&
      completedList !== undefined &&
      typeof nextListId === 'string' &&
      nextStorage.listProgress[completedList.id]?.completed &&
      nextStorage.currentPathPosition === completedList.id &&
      nextStorage.selectedListIds.length === 1 &&
      nextStorage.selectedListIds[0] === completedList.id;

    if (shouldAdvancePath) {
      nextStorage = {
        ...nextStorage,
        selectedListIds: [nextListId],
        currentPathPosition: nextListId
      };
    }

    storageRef.current = nextStorage;
    setStats(previous => ({ ...previous, endedAt }));
    setIsComplete(true);
    if (storageRef.current.settings.soundEffects) playTone('completion');
    onComplete(result, nextStorage);
  }, [lists, onComplete, onStorageChange, reviewDifficult, session.listIds, session.words.length, stats, storage]);

  function completeWord(forceDifficult = false) {
    if (!currentWord) return;
    recordPracticeInteraction();

    const completingRecap = isRecapActive;
    const hadIssueInThisSession =
      forceDifficult ||
      (completingRecap && recapIssueRef.current) ||
      incorrectWordIdsRef.current.has(currentWord.id) ||
      revealedWordIdsRef.current.has(currentWord.id) ||
      letters.some(letter => letter.revealed);

    persistWordProgress(currentWord, {
      completed: true,
      cleanCompleted: !hadIssueInThisSession,
      recapCompletedClean: completingRecap && !hadIssueInThisSession
    });

    if (completingRecap) {
      window.setTimeout(() => {
        const nextWord = session.words[currentIndex];
        setLetters(createInitialLetters(nextWord ? getAnswer(nextWord) : ''));
        setWrongIndex(null);
        inputLockedRef.current = false;
        setIsRecapActive(false);
        setStatus(null);
        setStatusTone('neutral');
      }, getSuccessAdvanceDelay(getAnswer(currentWord)));

      if (storage.settings.soundEffects) playTone('success');
      return;
    }

    setStats(previous => {
      const incorrectWordIds = new Set(previous.incorrectWordIds);
      for (const wordId of Array.from(incorrectWordIdsRef.current)) incorrectWordIds.add(wordId);

      const revealedWordIds = new Set(previous.revealedWordIds);
      for (const wordId of Array.from(revealedWordIdsRef.current)) revealedWordIds.add(wordId);

      const next = {
        ...previous,
        correctWords: previous.correctWords + 1,
        incorrectWordIds,
        revealedWordIds
      };
      window.setTimeout(() => {
        if (currentIndex + 1 >= session.words.length) {
          finishSession(next);
        } else {
          setCurrentIndex(index => index + 1);
          setStatus(null);
          setStatusTone('neutral');
        }
      }, getSuccessAdvanceDelay(getAnswer(currentWord)));
      return next;
    });

    if (storage.settings.soundEffects) playTone('success');
  }

  const handleInput = useCallback((char: string) => {
    if (!currentWord || isComplete || inputLockedRef.current) return;

    if (isInputSpace(char)) return;
    recordPracticeInteraction();

    const answer = getAnswer(currentWord);
    const nextIndex = findNextInputIndex(answer, letters);
    if (nextIndex < 0) return;

    const expected = answer[nextIndex];
    const correct = validateInputAtIndex(char, currentWord, nextIndex, storage.settings.welshSpelling);

    if (correct) {
      const nextLetters = letters.map((letter, index) => index === nextIndex ? { value: expected } : letter);
      setLetters(nextLetters);

      if (findNextInputIndex(answer, nextLetters, nextIndex + 1) < 0) {
        completeWord();
      }
      return;
    }

    const nextLetters = letters.map((letter, index) => index === nextIndex ? { value: char, wrong: true } : letter);
    inputLockedRef.current = true;
    setLetters(nextLetters);
    setWrongIndex(nextIndex);
    persistWordProgress(currentWord, { incorrect: true });
    if (isRecapActive) {
      recapIssueRef.current = true;
    } else {
      incorrectWordIdsRef.current.add(currentWord.id);
    }

    if (!isRecapActive) {
      setStats(previous => {
        const incorrectWordIds = new Set(previous.incorrectWordIds);
        incorrectWordIds.add(currentWord.id);
        return {
          ...previous,
          incorrectAttempts: previous.incorrectAttempts + 1,
          incorrectWordIds
        };
      });
    }

    if (storage.settings.soundEffects) playTone('error');

    if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
    wrongTimerRef.current = window.setTimeout(() => {
      setLetters(previous => previous.map((letter, index) => index === nextIndex ? { value: '' } : letter));
      setWrongIndex(null);
      inputLockedRef.current = false;
    }, 560);
  }, [currentWord?.id, isComplete, isRecapActive, letters, storage.settings.welshSpelling, storage.settings.soundEffects]);

  const revealNext = useCallback(() => {
    if (!currentWord || isComplete || inputLockedRef.current || isCompletingRevealedWordRef.current) return;
    recordPracticeInteraction();

    const answer = getAnswer(currentWord);
    const nextIndex = findNextInputIndex(answer, letters);
    if (nextIndex < 0) return;

    const nextLetters = letters.map((letter, index) => index === nextIndex ? { value: answer[nextIndex], revealed: true } : letter);
    setLetters(nextLetters);
    showStatus(t('practice.letterRevealed'));
    persistWordProgress(currentWord, { revealed: true });
    if (isRecapActive) {
      recapIssueRef.current = true;
    } else {
      revealedWordIdsRef.current.add(currentWord.id);

      setStats(previous => {
        const revealedWordIds = new Set(previous.revealedWordIds);
        revealedWordIds.add(currentWord.id);
        return {
          ...previous,
          revealedLetters: previous.revealedLetters + 1,
          revealedWordIds
        };
      });
    }

    if (findNextInputIndex(answer, nextLetters, nextIndex + 1) < 0) {
      isCompletingRevealedWordRef.current = true;
      setIsCompletingRevealedWord(true);
      inputLockedRef.current = true;

      if (revealedCompletionTimerRef.current) window.clearTimeout(revealedCompletionTimerRef.current);
      revealedCompletionTimerRef.current = window.setTimeout(() => {
        revealedCompletionTimerRef.current = null;
        completeWord(true);
      }, REVEALED_WORD_COMPLETION_DELAY_MS);
    }
  }, [currentWord?.id, isComplete, isRecapActive, letters, t]);

  const markCurrentWordRevealed = useCallback(() => {
    if (!currentWord || isComplete) return;
    recordPracticeInteraction();

    persistWordProgress(currentWord, { revealed: true });
    if (isRecapActive) {
      recapIssueRef.current = true;
    } else {
      revealedWordIdsRef.current.add(currentWord.id);

      setStats(previous => {
        const revealedWordIds = new Set(previous.revealedWordIds);
        revealedWordIds.add(currentWord.id);
        return {
          ...previous,
          revealedWordIds
        };
      });
    }
  }, [currentWord?.id, isComplete, isRecapActive]);

  const publicStats = {
    correct: stats.correctWords,
    incorrect: stats.incorrectWordIds.size,
    revealed: stats.revealedWordIds.size,
    incorrectAttempts: stats.incorrectAttempts,
    revealedLetters: stats.revealedLetters,
    startTime: stats.startedAt,
    endTime: stats.endedAt,
    total: session.words.length
  };
  const activeIndex = currentWord && !isComplete && !inputLockedRef.current
    ? findNextInputIndex(getAnswer(currentWord), letters)
    : -1;

  return {
    currentWord: currentWord as SessionWord | undefined,
    letters,
    status,
    statusTone,
    wrongIndex,
    activeIndex,
    isComplete,
    isCompletingRevealedWord,
    stats: publicStats,
    progressValue: session.words.length ? (stats.correctWords / session.words.length) * 100 : 0,
    progressCount: isRecapActive ? t('practice.quickRecap') : `${Math.min(stats.correctWords + 1, session.words.length)} / ${session.words.length}`,
    hasWords: session.words.length > 0,
    handleInput,
    revealNext,
    markCurrentWordRevealed,
    playAudio
  };
}
