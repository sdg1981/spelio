import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PracticeWord, WordList } from '../data/wordLists';
import { validateLetter } from '../lib/practice/validator';
import { classifySession, createPracticeSession } from '../lib/practice/sessionEngine';
import type { SessionWord } from '../lib/practice/sessionEngine';
import type { SessionResult, SpelioSettings, SpelioStorage } from '../lib/practice/storage';
import { updateListCompletion } from '../lib/practice/storage';

interface LetterState {
  value: string;
  revealed?: boolean;
  wrong?: boolean;
}

function createInitialLetters(answer: string): LetterState[] {
  return answer.split('').map(char => ({ value: char === ' ' ? ' ' : '' }));
}

function findNextInputIndex(answer: string, letters: LetterState[], start = 0) {
  for (let index = start; index < answer.length; index += 1) {
    if (answer[index] !== ' ' && !letters[index]?.value) return index;
  }
  return -1;
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
  reviewDifficult = false,
  onStorageChange,
  onComplete
}: {
  lists: WordList[];
  storage: SpelioStorage;
  reviewDifficult?: boolean;
  onStorageChange: (next: SpelioStorage) => void;
  onComplete: (result: SessionResult) => void;
}) {
  const session = useMemo(() => createPracticeSession(lists, storage, reviewDifficult), [lists, storage.selectedListIds.join('|'), reviewDifficult]);
  const sessionIdentity = session.words.map(word => word.id).join('|');
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentWord = session.words[currentIndex];
  const [letters, setLetters] = useState<LetterState[]>(() => createInitialLetters(currentWord?.welshAnswer ?? ''));
  const [status, setStatus] = useState<string | null>(null);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
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
  const inputLockedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
      if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
    setIsComplete(false);
    setStatus(null);
    setWrongIndex(null);
    inputLockedRef.current = false;
    setStats({
      correctWords: 0,
      incorrectWordIds: new Set<string>(),
      revealedWordIds: new Set<string>(),
      incorrectAttempts: 0,
      revealedLetters: 0,
      startedAt: Date.now(),
      endedAt: undefined
    });
    setLetters(createInitialLetters(session.words[0]?.welshAnswer ?? ''));
  }, [sessionIdentity]);

  useEffect(() => {
    if (!currentWord) return;
    setLetters(createInitialLetters(currentWord.welshAnswer));
    setWrongIndex(null);
    inputLockedRef.current = false;

    if (storage.settings.audioPrompts && currentWord.audioUrl) {
      const audio = new Audio(currentWord.audioUrl);
      audio.play().catch(() => undefined);
    }
  }, [currentWord?.id]);

  function showStatus(message: string) {
    setStatus(message);
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
    statusTimerRef.current = window.setTimeout(() => setStatus(null), 1500);
  }

  const playAudio = useCallback(() => {
    if (!currentWord?.audioUrl) {
      showStatus('Audio unavailable');
      return;
    }

    const audio = new Audio(currentWord.audioUrl);
    audio.currentTime = 0;
    audio.play().catch(() => showStatus('Audio unavailable'));
  }, [currentWord?.id]);

  function persistWordProgress(word: PracticeWord, patch: { incorrect?: boolean; revealed?: boolean; completed?: boolean }) {
    const now = new Date().toISOString();
    const previous = storage.wordProgress[word.id] ?? {
      seen: false,
      completedCount: 0,
      incorrectAttempts: 0,
      revealedCount: 0,
      difficult: false
    };

    const nextStorage: SpelioStorage = {
      ...storage,
      currentPathPosition: storage.currentPathPosition || word.listId,
      wordProgress: {
        ...storage.wordProgress,
        [word.id]: {
          ...previous,
          seen: true,
          completedCount: previous.completedCount + (patch.completed ? 1 : 0),
          incorrectAttempts: previous.incorrectAttempts + (patch.incorrect ? 1 : 0),
          revealedCount: previous.revealedCount + (patch.revealed ? 1 : 0),
          difficult: previous.difficult || Boolean(patch.incorrect || patch.revealed),
          lastPractisedAt: now
        }
      }
    };

    onStorageChange(nextStorage);
  }

  const finishSession = useCallback((finalStats = stats) => {
    const endedAt = Date.now();
    const base = {
      totalWords: session.words.length,
      correctWords: finalStats.correctWords,
      incorrectWords: finalStats.incorrectWordIds.size,
      revealedWords: finalStats.revealedWordIds.size,
      incorrectAttempts: finalStats.incorrectAttempts,
      revealedLetters: finalStats.revealedLetters,
      durationSeconds: Math.max(1, Math.round((endedAt - finalStats.startedAt) / 1000)),
      listIds: session.listIds
    };
    const result: SessionResult = { ...base, state: classifySession(base) };

    let nextStorage: SpelioStorage = {
      ...storage,
      lastSessionDate: new Date().toISOString(),
      lastSessionResult: result
    };
    nextStorage = updateListCompletion(nextStorage, lists, result);

    onStorageChange(nextStorage);
    setStats(previous => ({ ...previous, endedAt }));
    setIsComplete(true);
    if (storage.settings.soundEffects) playTone('completion');
    onComplete(result);
  }, [lists, onComplete, onStorageChange, session.listIds, session.words.length, stats, storage]);

  function completeWord() {
    if (!currentWord) return;
    persistWordProgress(currentWord, { completed: true });

    setStats(previous => {
      const next = { ...previous, correctWords: previous.correctWords + 1 };
      window.setTimeout(() => {
        if (currentIndex + 1 >= session.words.length) {
          finishSession(next);
        } else {
          setCurrentIndex(index => index + 1);
          setStatus(null);
        }
      }, 320);
      return next;
    });

    showStatus('Correct');
    if (storage.settings.soundEffects) playTone('success');
  }

  const handleInput = useCallback((char: string) => {
    if (!currentWord || isComplete || inputLockedRef.current) return;

    const answer = currentWord.welshAnswer;
    const nextIndex = findNextInputIndex(answer, letters);
    if (nextIndex < 0) return;

    const expected = answer[nextIndex];
    const correct = validateLetter(char, expected, storage.settings.welshSpelling);

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
    showStatus('Incorrect. Try again.');
    persistWordProgress(currentWord, { incorrect: true });

    setStats(previous => {
      const incorrectWordIds = new Set(previous.incorrectWordIds);
      incorrectWordIds.add(currentWord.id);
      return {
        ...previous,
        incorrectAttempts: previous.incorrectAttempts + 1,
        incorrectWordIds
      };
    });

    if (storage.settings.soundEffects) playTone('error');

    if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
    wrongTimerRef.current = window.setTimeout(() => {
      setLetters(previous => previous.map((letter, index) => index === nextIndex ? { value: '' } : letter));
      setWrongIndex(null);
      inputLockedRef.current = false;
    }, 820);
  }, [currentWord?.id, isComplete, letters, storage.settings.welshSpelling, storage.settings.soundEffects]);

  const revealNext = useCallback(() => {
    if (!currentWord || isComplete || inputLockedRef.current) return;

    const answer = currentWord.welshAnswer;
    const nextIndex = findNextInputIndex(answer, letters);
    if (nextIndex < 0) return;

    const nextLetters = letters.map((letter, index) => index === nextIndex ? { value: answer[nextIndex], revealed: true } : letter);
    setLetters(nextLetters);
    showStatus('Letter revealed');
    persistWordProgress(currentWord, { revealed: true });

    setStats(previous => {
      const revealedWordIds = new Set(previous.revealedWordIds);
      revealedWordIds.add(currentWord.id);
      return {
        ...previous,
        revealedLetters: previous.revealedLetters + 1,
        revealedWordIds
      };
    });

    if (findNextInputIndex(answer, nextLetters, nextIndex + 1) < 0) {
      completeWord();
    }
  }, [currentWord?.id, isComplete, letters]);

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

  return {
    currentWord: currentWord as SessionWord | undefined,
    letters,
    status,
    wrongIndex,
    isComplete,
    stats: publicStats,
    progressValue: session.words.length ? (stats.correctWords / session.words.length) * 100 : 0,
    progressCount: `${Math.min(stats.correctWords + 1, session.words.length)} / ${session.words.length}`,
    hasWords: session.words.length > 0,
    handleInput,
    revealNext,
    playAudio
  };
}
