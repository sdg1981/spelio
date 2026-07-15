import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PracticeWord, WordList } from '../data/wordLists';
import { getAnswer, getPrompt } from '../data/wordLists';
import type { Translate } from '../i18n';
import { createPracticeAnswer } from '../lib/practice/validator';
import {
  createInitialPracticeLetters,
  findNextInputIndex,
  isCommittedAnswerComplete,
  processPracticeInput,
  removeLastPracticeInput,
  type PracticeLetterState
} from '../lib/practice/inputFlow';
import { classifySession, createPracticeSession, selectPreSessionRecapWord, type ReviewScope } from '../lib/practice/sessionEngine';
import type { SessionWord } from '../lib/practice/sessionEngine';
import { findNextSequentialRecommendationList, isListProgressionComplete } from '../lib/practice/recommendations';
import type { SessionResult, SpelioSettings, SpelioStorage, WordProgressPatch } from '../lib/practice/storage';
import { addLearningStats, addMixedWelshExposure, applyWordProgressPatch, markFirstPracticeHintSeen, updateListCompletion, updateReviewCompletion } from '../lib/practice/storage';
import { addActiveInteractionTime, type ActiveWordTiming } from '../lib/practice/progress';
import { createAudioPlaybackController, getPlayableAudioUrl } from '../lib/audioPlayback';
import { getAudioUnavailableStatusText, getPostAnswerEnglishConfirmationDelayMs, isAudioUnavailableForPrompt, shouldShowPostAnswerEnglishConfirmation } from '../lib/practice/audioAvailability';
import { DEFAULT_AUDIO_PROVIDER, getResolvedPracticeAudioUrl, type DefaultAudioProvider } from '../lib/audioProvider';
import { triggerIncorrectHaptic } from '../lib/haptics';
import { shouldOfferMobileTypoGrace, type MobileTypoGraceEvent } from '../lib/practice/mobileTypoGrace';

type LetterState = PracticeLetterState;

export type PracticeStatusTone = 'success' | 'error' | 'neutral';
export type PracticeInputResult =
  | { type: 'ignored' }
  | { type: 'pending'; inputPosition: number; attempted: string }
  | { type: 'correct'; inputPosition: number; attempted: string }
  | { type: 'incorrect'; inputPosition: number; attempted: string };

export type PendingMobileTypo = { inputPosition: number; attempted: string };

const REVEALED_WORD_COMPLETION_DELAY_MS = 360;
const SUCCESS_UNDERLINE_STAGGER_MS = 42;
const SUCCESS_UNDERLINE_DURATION_MS = 160;
const SUCCESS_CONFIRMATION_PAUSE_MS = 450;
const UI_SOUND_VOLUME = 0.45;
const UI_SOUND_PATHS = {
  error: '/sounds/error-soft.mp3',
  success: '/sounds/success-soft.mp3',
  completion: '/sounds/completion-soft.mp3'
} as const;

let currentUiSound: HTMLAudioElement | null = null;
const uiSoundCache: Partial<Record<keyof typeof UI_SOUND_PATHS, HTMLAudioElement>> = {};

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getSuccessAdvanceDelay(answer: string) {
  if (prefersReducedMotion()) return SUCCESS_CONFIRMATION_PAUSE_MS;

  const visibleLetterCount = answer.replace(/\s/g, '').length;
  const finalUnderlineDelay = Math.max(0, visibleLetterCount - 1) * SUCCESS_UNDERLINE_STAGGER_MS;
  return finalUnderlineDelay + SUCCESS_UNDERLINE_DURATION_MS + SUCCESS_CONFIRMATION_PAUSE_MS;
}

function getAnswerCandidates(word: PracticeWord) {
  return [getAnswer(word), ...(word.acceptedAlternatives ?? [])].map(createPracticeAnswer);
}

function getPracticeAnswer(word: PracticeWord) {
  return createPracticeAnswer(getAnswer(word));
}

function playTone(type: 'success' | 'error' | 'completion') {
  try {
    if (typeof Audio === 'undefined') return;

    // UI sound effects are file-based to avoid mobile oscillator pop/click issues.
    const audio = uiSoundCache[type] ?? new Audio(UI_SOUND_PATHS[type]);
    uiSoundCache[type] = audio;
    audio.preload = 'auto';
    audio.volume = UI_SOUND_VOLUME;

    if (currentUiSound) {
      currentUiSound.pause();
      try {
        currentUiSound.currentTime = 0;
      } catch {
        // Seeking can fail before media metadata is ready.
      }
    }

    currentUiSound = audio;
    audio.onended = () => {
      if (currentUiSound === audio) currentUiSound = null;
    };

    try {
      audio.currentTime = 0;
    } catch {
      // Playback can still start from the browser's available position.
    }

    void audio.play().catch(() => undefined);
  } catch {
    // Sound effects are non-critical.
  }
}

export function usePracticeSession({
  lists,
  storage,
  sessionStorage = storage,
  reviewDifficult = false,
  reviewScope = 'global',
  reviewWordIds,
  includeRecapDue = false,
  forceAudioAvailable = false,
  defaultAudioProvider = DEFAULT_AUDIO_PROVIDER,
  disableQuickRecap = false,
  detached = false,
  sessionKey = 0,
  onStorageChange,
  onComplete,
  onPostAnswerEnglishConfirmation,
  strictAssessmentMode = false,
  onMobileTypoGraceEvent,
  t = key => key
}: {
  lists: WordList[];
  storage: SpelioStorage;
  sessionStorage?: SpelioStorage;
  reviewDifficult?: boolean;
  reviewScope?: ReviewScope;
  reviewWordIds?: string[];
  includeRecapDue?: boolean;
  forceAudioAvailable?: boolean;
  defaultAudioProvider?: DefaultAudioProvider;
  disableQuickRecap?: boolean;
  detached?: boolean;
  sessionKey?: number;
  onStorageChange: (next: SpelioStorage) => void;
  onComplete: (result: SessionResult, nextStorage: SpelioStorage) => void;
  onPostAnswerEnglishConfirmation?: (wordId: string | null) => void;
  strictAssessmentMode?: boolean;
  onMobileTypoGraceEvent?: (eventName: MobileTypoGraceEvent, listId: string) => void;
  t?: Translate;
}) {
  // A practice run must keep the word queue it started with. Storage and content can
  // update while the learner is on the final word; rebuilding here can replace the
  // completed queue with an empty one before the end-screen transition runs.
  const session = useMemo(
    () => createPracticeSession(lists, sessionStorage, reviewDifficult, includeRecapDue, { reviewScope, reviewWordIds }),
    [sessionKey]
  );
  const recapWord = useMemo(
    () => disableQuickRecap ? null : selectPreSessionRecapWord(sessionStorage, lists, session.words, reviewDifficult || includeRecapDue),
    [sessionKey]
  );
  const sessionIdentity = `${recapWord?.id ?? ''}:${session.words.map(word => word.id).join('|')}`;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecapActive, setIsRecapActive] = useState(Boolean(recapWord));
  const currentWord = isRecapActive ? recapWord : session.words[currentIndex];
  const [letters, setLettersState] = useState<LetterState[]>(() => createInitialPracticeLetters(currentWord ? getPracticeAnswer(currentWord) : ''));
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<PracticeStatusTone>('neutral');
  const [audioPlaybackFailedWordIds, setAudioPlaybackFailedWordIds] = useState<Set<string>>(() => new Set());
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [wrongAttempt, setWrongAttempt] = useState<string | null>(null);
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
  const completionAdvanceTimerRef = useRef<number | null>(null);
  const inputLockedRef = useRef(false);
  const [pendingMobileTypo, setPendingMobileTypoState] = useState<PendingMobileTypo | null>(null);
  const pendingMobileTypoRef = useRef<PendingMobileTypo | null>(null);
  const mobileTypoGraceUsedPositionsRef = useRef(new Set<number>());
  const mobileTypoAwaitingCorrectionPositionRef = useRef<number | null>(null);
  const isCompletingRevealedWordRef = useRef(false);
  const lettersRef = useRef<LetterState[]>(letters);
  const recapIssueRef = useRef(false);
  const storageRef = useRef(detached ? sessionStorage : storage);
  const incorrectWordIdsRef = useRef(new Set<string>());
  const revealedWordIdsRef = useRef(new Set<string>());
  const sessionActiveMsRef = useRef(0);
  const wordTimingRef = useRef<ActiveWordTiming>({
    wordStartedAt: Date.now(),
    lastInteractionAt: null,
    activeMs: 0
  });
  const audioPlaybackRef = useRef<ReturnType<typeof createAudioPlaybackController> | null>(null);
  if (!audioPlaybackRef.current) audioPlaybackRef.current = createAudioPlaybackController();
  const audioPlayback = audioPlaybackRef.current;

  useEffect(() => {
    storageRef.current = detached ? sessionStorage : storage;
  }, [detached, sessionStorage, storage]);

  function setLetters(nextLetters: LetterState[]) {
    lettersRef.current = nextLetters;
    setLettersState(nextLetters);
  }

  function resetLetters(answer: string) {
    setLetters(createInitialPracticeLetters(answer));
  }

  function setPendingMobileTypo(next: PendingMobileTypo | null) {
    pendingMobileTypoRef.current = next;
    setPendingMobileTypoState(next);
  }

  function resetMobileTypoGrace() {
    setPendingMobileTypo(null);
    mobileTypoGraceUsedPositionsRef.current = new Set<number>();
    mobileTypoAwaitingCorrectionPositionRef.current = null;
  }

  const stopCurrentAudio = useCallback((releaseAudio = false) => {
    audioPlayback.stop(releaseAudio);
  }, [audioPlayback]);

  const restartCurrentAudio = useCallback(async ({
    recordInteraction = true,
    showUnavailableStatus = true
  }: {
    recordInteraction?: boolean;
    showUnavailableStatus?: boolean;
  } = {}) => {
    if (recordInteraction) recordPracticeInteraction();

    const wordForPlayback = currentWord;
    if (!wordForPlayback) {
      if (showUnavailableStatus) showStatus(getAudioUnavailableStatusText(t));
      return false;
    }

    const resolvedAudioUrl = getResolvedPracticeAudioUrl(wordForPlayback, defaultAudioProvider);
    if (!resolvedAudioUrl) {
      markAudioPlaybackFailed(wordForPlayback.id);
      if (showUnavailableStatus) showStatus(getAudioUnavailableStatusText(t));
      return false;
    }

    const playableUrl = getPlayableAudioUrl(resolvedAudioUrl);
    if (!playableUrl) {
      markAudioPlaybackFailed(wordForPlayback.id);
      if (showUnavailableStatus) showStatus(getAudioUnavailableStatusText(t));
      return false;
    }

    const played = await audioPlayback.playSource(playableUrl);
    if (!played) {
      markAudioPlaybackFailed(wordForPlayback.id);
      if (showUnavailableStatus) showStatus(getAudioUnavailableStatusText(t));
    }
    return played;
  }, [audioPlayback, currentWord?.audioUrl, currentWord?.elevenLabsAudioUrl, currentWord?.elevenLabsAudioStatus, currentWord?.id, defaultAudioProvider, forceAudioAvailable, stopCurrentAudio, t]);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current);
      if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
      if (revealedCompletionTimerRef.current) window.clearTimeout(revealedCompletionTimerRef.current);
      if (completionAdvanceTimerRef.current) window.clearTimeout(completionAdvanceTimerRef.current);
      onPostAnswerEnglishConfirmation?.(null);
      stopCurrentAudio(true);
    };
  }, [onPostAnswerEnglishConfirmation, stopCurrentAudio]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsRecapActive(Boolean(recapWord));
    setIsComplete(false);
    setStatus(null);
    setStatusTone('neutral');
    setAudioPlaybackFailedWordIds(new Set());
    setWrongIndex(null);
    setWrongAttempt(null);
    resetMobileTypoGrace();
    setIsCompletingRevealedWord(false);
    isCompletingRevealedWordRef.current = false;
    inputLockedRef.current = false;
    stopCurrentAudio(true);
    if (revealedCompletionTimerRef.current) {
      window.clearTimeout(revealedCompletionTimerRef.current);
      revealedCompletionTimerRef.current = null;
    }
    if (completionAdvanceTimerRef.current) {
      window.clearTimeout(completionAdvanceTimerRef.current);
      completionAdvanceTimerRef.current = null;
    }
    onPostAnswerEnglishConfirmation?.(null);
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
    resetLetters(firstWord ? getPracticeAnswer(firstWord) : '');
  }, [sessionIdentity]);

  useEffect(() => {
    if (!currentWord) return;
    if (completionAdvanceTimerRef.current) {
      window.clearTimeout(completionAdvanceTimerRef.current);
      completionAdvanceTimerRef.current = null;
    }
    onPostAnswerEnglishConfirmation?.(null);
    stopCurrentAudio(true);
    wordTimingRef.current = {
      wordStartedAt: Date.now(),
      lastInteractionAt: null,
      activeMs: 0
    };
    resetLetters(getPracticeAnswer(currentWord));
    setWrongIndex(null);
    setWrongAttempt(null);
    resetMobileTypoGrace();
    setIsCompletingRevealedWord(false);
    isCompletingRevealedWordRef.current = false;
    recapIssueRef.current = false;
    inputLockedRef.current = false;

    if (storage.settings.audioPrompts && !isAudioUnavailableForPrompt(currentWord, false, defaultAudioProvider)) {
      void restartCurrentAudio({ recordInteraction: false, showUnavailableStatus: false });
    }
  }, [currentWord?.id, defaultAudioProvider, onPostAnswerEnglishConfirmation]);

  function markAudioPlaybackFailed(wordId: string) {
    setAudioPlaybackFailedWordIds(previous => {
      const next = new Set(previous);
      next.add(wordId);
      return next;
    });
  }

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

  function getCorrectAnswerAdvanceDelay(word: PracticeWord, answer: string) {
    const successDelay = getSuccessAdvanceDelay(answer);
    const audioUnavailable = isAudioUnavailableForPrompt(word, audioPlaybackFailedWordIds.has(word.id), defaultAudioProvider);
    const shouldConfirmEnglish = shouldShowPostAnswerEnglishConfirmation({
      englishVisible: storageRef.current.settings.englishVisible,
      practiceTestMode: forceAudioAvailable,
      audioUnavailable
    });

    if (!shouldConfirmEnglish) {
      onPostAnswerEnglishConfirmation?.(null);
      return successDelay;
    }

    onPostAnswerEnglishConfirmation?.(word.id);
    return Math.max(successDelay, getPostAnswerEnglishConfirmationDelayMs(getPrompt(word)));
  }

  function scheduleCorrectAnswerAdvance(word: PracticeWord, onAdvance: () => void) {
    if (completionAdvanceTimerRef.current) {
      window.clearTimeout(completionAdvanceTimerRef.current);
      completionAdvanceTimerRef.current = null;
    }

    completionAdvanceTimerRef.current = window.setTimeout(() => {
      completionAdvanceTimerRef.current = null;
      onPostAnswerEnglishConfirmation?.(null);
      onAdvance();
    }, getCorrectAnswerAdvanceDelay(word, getPracticeAnswer(word)));
  }

  const playAudio = restartCurrentAudio;

  function persistWordProgress(word: PracticeWord, patch: WordProgressPatch) {
    const currentStorage = storageRef.current;
    const nextStorage = applyWordProgressPatch(currentStorage, word, patch);

    storageRef.current = nextStorage;
    if (detached) return;
    onStorageChange(nextStorage);
  }

  function persistFirstPracticeHintSeen() {
    const nextStorage = markFirstPracticeHintSeen(storageRef.current);
    if (nextStorage === storageRef.current) return;

    storageRef.current = nextStorage;
    if (detached) return;
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
      listIds: session.listIds,
      wordIds: session.words.map(word => word.id)
    };
    const result: SessionResult = { ...base, state: classifySession(base) };

    let nextStorage: SpelioStorage = detached
      ? storageRef.current
      : {
          ...storageRef.current,
          lastSessionDate: new Date().toISOString(),
          lastSessionResult: result,
          completedNormalSessionCount: reviewDifficult || includeRecapDue
            ? storageRef.current.completedNormalSessionCount
            : (storageRef.current.completedNormalSessionCount ?? 0) + 1,
          recentlyResolvedReviewWordIds: reviewDifficult || includeRecapDue
            ? storageRef.current.recentlyResolvedReviewWordIds
            : []
        };
    if (!detached) {
      if (!reviewDifficult && !includeRecapDue && storageRef.current.settings.dialectPreference === 'mixed') {
        nextStorage = addMixedWelshExposure(nextStorage, session.words, lists);
      }
      nextStorage = addLearningStats(nextStorage, sessionActiveMsRef.current, nextStorage.lastSessionDate ?? undefined);
      if (!reviewDifficult && !includeRecapDue) {
        nextStorage = updateListCompletion(nextStorage, lists, result);
      } else if (reviewDifficult && !includeRecapDue) {
        nextStorage = updateReviewCompletion(nextStorage, lists, result);
      }
    }

    const completedSingleListId = result.listIds.length === 1 ? result.listIds[0] : null;
    const completedList = completedSingleListId ? lists.find(list => list.id === completedSingleListId) : undefined;
    const nextList = completedList ? findNextSequentialRecommendationList(nextStorage, lists, completedList) : undefined;
    const shouldAdvancePath =
      !reviewDifficult &&
      !includeRecapDue &&
      !detached &&
      completedList !== undefined &&
      nextList !== undefined &&
      isListProgressionComplete(nextStorage, completedList) &&
      nextStorage.currentPathPosition === completedList.id &&
      nextStorage.selectedListIds.length === 1 &&
      nextStorage.selectedListIds[0] === completedList.id;

    if (shouldAdvancePath) {
      nextStorage = {
        ...nextStorage,
        selectedListIds: [nextList.id],
        currentPathPosition: nextList.id
      };
    }

    storageRef.current = nextStorage;
    setStats(previous => ({ ...previous, endedAt }));
    setIsComplete(true);
    stopCurrentAudio(true);
    if (storageRef.current.settings.soundEffects) playTone('completion');
    onComplete(result, nextStorage);
  }, [detached, lists, onComplete, onStorageChange, reviewDifficult, includeRecapDue, session.listIds, session.words.length, stats, storage, stopCurrentAudio]);

  function completeWord(forceDifficult = false) {
    if (!currentWord) return;
    recordPracticeInteraction();

    const completingInjectedRecap = isRecapActive;
    const completingRecap = completingInjectedRecap || includeRecapDue;
    const hadIssueInThisSession =
      forceDifficult ||
      (completingRecap && recapIssueRef.current) ||
      incorrectWordIdsRef.current.has(currentWord.id) ||
      revealedWordIdsRef.current.has(currentWord.id) ||
      lettersRef.current.some(letter => letter.revealed);

    persistWordProgress(currentWord, {
      completed: true,
      cleanCompleted: !hadIssueInThisSession,
      recapCompletedClean: completingRecap && !hadIssueInThisSession,
      reviewResolvedClean: reviewDifficult && !hadIssueInThisSession
    });

    if (completingInjectedRecap) {
      scheduleCorrectAnswerAdvance(currentWord, () => {
        const nextWord = session.words[currentIndex];
        resetLetters(nextWord ? getPracticeAnswer(nextWord) : '');
        setWrongIndex(null);
        setWrongAttempt(null);
        inputLockedRef.current = false;
        setIsRecapActive(false);
        setStatus(null);
        setStatusTone('neutral');
      });

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
      scheduleCorrectAnswerAdvance(currentWord, () => {
        if (currentIndex + 1 >= session.words.length) {
          finishSession(next);
        } else {
          setCurrentIndex(index => index + 1);
          setStatus(null);
          setStatusTone('neutral');
        }
      });
      return next;
    });

    if (storage.settings.soundEffects) playTone('success');
  }

  function commitIncorrectAttempt(inputPosition: number, attempted: string) {
    if (!currentWord) return;

    inputLockedRef.current = true;
    setWrongIndex(inputPosition);
    setWrongAttempt(attempted);
    persistWordProgress(currentWord, { incorrect: true });
    if (isRecapActive) {
      recapIssueRef.current = true;
    } else {
      incorrectWordIdsRef.current.add(currentWord.id);
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

    if (storage.settings.soundEffects) {
      playTone('error');
      triggerIncorrectHaptic(storage.settings.soundEffects);
    }

    if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
    wrongTimerRef.current = window.setTimeout(() => {
      setWrongIndex(null);
      setWrongAttempt(null);
      inputLockedRef.current = false;
    }, 560);
  }

  const handleInput = useCallback((
    rawInput: string,
    options: { mobileTouchInput?: boolean } = {}
  ): PracticeInputResult => {
    if (!currentWord || isComplete || inputLockedRef.current) return { type: 'ignored' };

    if (!Array.from(rawInput).some(char => !/\s/.test(char))) return { type: 'ignored' };
    persistFirstPracticeHintSeen();
    recordPracticeInteraction();

    const answer = getPracticeAnswer(currentWord);
    const pendingTypo = pendingMobileTypoRef.current;
    const committedPendingWrong = Boolean(pendingTypo);
    if (pendingTypo) {
      setPendingMobileTypo(null);
      mobileTypoAwaitingCorrectionPositionRef.current = null;
      onMobileTypoGraceEvent?.('mobile_adjacent_typo_committed_wrong', currentWord.listId);
      commitIncorrectAttempt(pendingTypo.inputPosition, pendingTypo.attempted);
    }

    const processed = processPracticeInput({
      targetAnswer: answer,
      acceptedAnswers: getAnswerCandidates(currentWord).slice(1),
      letters: lettersRef.current,
      rawInput,
      mode: storage.settings.welshSpelling
    });
    const lastOutcome = [...processed.outcomes].reverse().find(outcome => outcome.type !== 'ignored');

    if (
      !committedPendingWrong &&
      processed.wrongFeedback &&
      Array.from(rawInput).length === 1 &&
      shouldOfferMobileTypoGrace({
        attempted: processed.wrongFeedback.attempted,
        expected: answer[processed.wrongFeedback.inputPosition] ?? '',
        mobileTouchInput: options.mobileTouchInput === true,
        strictAssessmentMode,
        alreadyUsedAtPosition: mobileTypoGraceUsedPositionsRef.current.has(processed.wrongFeedback.inputPosition)
      })
    ) {
      const pending = {
        inputPosition: processed.wrongFeedback.inputPosition,
        attempted: processed.wrongFeedback.attempted
      };
      mobileTypoGraceUsedPositionsRef.current.add(pending.inputPosition);
      mobileTypoAwaitingCorrectionPositionRef.current = null;
      setPendingMobileTypo(pending);
      setWrongIndex(null);
      setWrongAttempt(null);
      onMobileTypoGraceEvent?.('mobile_adjacent_typo_grace_triggered', currentWord.listId);
      return { type: 'pending', ...pending };
    }

    const result: PracticeInputResult = !lastOutcome
      ? { type: 'ignored' }
      : lastOutcome.type === 'correct'
        ? { type: 'correct', inputPosition: lastOutcome.inputPosition, attempted: lastOutcome.attempted }
        : { type: 'incorrect', inputPosition: lastOutcome.inputPosition, attempted: lastOutcome.attempted };

    if (processed.letters !== lettersRef.current) {
      setLetters(processed.letters);
    }

    if (!processed.wrongFeedback) {
      if (!committedPendingWrong) {
        setWrongIndex(null);
        setWrongAttempt(null);
      }

      const correctedPosition = mobileTypoAwaitingCorrectionPositionRef.current;
      if (correctedPosition !== null && processed.outcomes.some(
        outcome => outcome.type === 'correct' && outcome.inputPosition === correctedPosition
      )) {
        onMobileTypoGraceEvent?.('mobile_adjacent_typo_corrected', currentWord.listId);
        mobileTypoAwaitingCorrectionPositionRef.current = null;
      }

      if (processed.completed && isCommittedAnswerComplete(answer, processed.letters, storage.settings.welshSpelling)) {
        inputLockedRef.current = true;
        completeWord();
      }

      return result;
    }

    const { inputPosition, attempted } = processed.wrongFeedback;
    mobileTypoAwaitingCorrectionPositionRef.current = null;
    commitIncorrectAttempt(inputPosition, attempted);

    return { type: 'incorrect', inputPosition, attempted };
  }, [currentWord?.id, isComplete, isRecapActive, onMobileTypoGraceEvent, storage.settings.welshSpelling, storage.settings.soundEffects, strictAssessmentMode]);

  const removeLastInput = useCallback(() => {
    if (!currentWord || isComplete || inputLockedRef.current) return false;

    const pendingTypo = pendingMobileTypoRef.current;
    if (pendingTypo) {
      setPendingMobileTypo(null);
      mobileTypoAwaitingCorrectionPositionRef.current = pendingTypo.inputPosition;
      recordPracticeInteraction();
      return true;
    }

    const answer = getPracticeAnswer(currentWord);
    const nextLetters = removeLastPracticeInput(answer, lettersRef.current);
    if (nextLetters === lettersRef.current) return false;

    setLetters(nextLetters);
    setWrongIndex(null);
    setWrongAttempt(null);
    recordPracticeInteraction();
    return true;
  }, [currentWord?.id, isComplete]);

  const revealNext = useCallback(() => {
    if (!currentWord || isComplete || inputLockedRef.current || isCompletingRevealedWordRef.current) return;
    recordPracticeInteraction();

    if (pendingMobileTypoRef.current) {
      setPendingMobileTypo(null);
      mobileTypoAwaitingCorrectionPositionRef.current = null;
    }

    const answer = getPracticeAnswer(currentWord);
    const nextIndex = findNextInputIndex(answer, lettersRef.current);
    if (nextIndex < 0) return;

    const nextLetters = lettersRef.current.map((letter, index) => index === nextIndex ? { value: answer[nextIndex], revealed: true } : letter);
    setLetters(nextLetters);
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
  }, [currentWord?.id, isComplete, isRecapActive, t]);

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
  const activeIndex = currentWord && !isComplete && !isCompletingRevealedWord
    ? pendingMobileTypo?.inputPosition ?? findNextInputIndex(getPracticeAnswer(currentWord), letters)
    : -1;

  return {
    currentWord: currentWord as SessionWord | undefined,
    practiceAnswer: currentWord ? getPracticeAnswer(currentWord) : '',
    letters,
    status,
    statusTone,
    wrongIndex,
    wrongAttempt,
    pendingMobileTypo,
    activeIndex,
    isComplete,
    isCompletingRevealedWord,
    audioPlaybackFailedWordIds,
    stats: publicStats,
    progressValue: session.words.length ? (stats.correctWords / session.words.length) * 100 : 0,
    progressCount: isRecapActive ? t('practice.quickRecap') : `${Math.min(stats.correctWords + 1, session.words.length)} / ${session.words.length}`,
    isRecapActive,
    hasWords: session.words.length > 0,
    handleInput,
    removeLastInput,
    revealNext,
    markCurrentWordRevealed,
    playAudio
  };
}
