import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Share2, ShieldCheck, SquareArrowLeft, SquareArrowRight, SquareArrowUp, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Check, CircleX, Eye, MessageSquareQuote, Repeat, Settings, Trash2, Volume2, VolumeX } from './Icons';
import { Footer } from './Footer';
import { usePracticeSession } from '../hooks/usePracticeSession';
import type { PracticeWord, WordList } from '../data/wordLists';
import { getAnswer, getPrompt } from '../data/wordLists';
import type { InterfaceLanguage, Translate } from '../i18n';
import type { SessionResult, SpelioSettings, SpelioStorage } from '../lib/practice/storage';
import { getFullyCompletedListIds } from '../lib/practice/storage';
import { getListDisplayDescription, getListDisplayName } from '../lib/practice/wordListDisplay';
import { logAudioPlaybackClick } from '../lib/audioPlayback';
import { getEnglishPromptDisplayState, getRecallPauseDelayMs, isAudioUnavailableForPrompt, shouldDelayEnglishPrompt, shouldShowEnglishPrompt } from '../lib/practice/audioAvailability';
import { KEYBOARD_REVEAL_HOLD_DELAY_MS, handleRevealShortcutKeyDown, handleRevealShortcutKeyUp } from '../lib/practice/revealShortcut';
import { getSpellingPatternHint, type SpellingPatternHint } from '../lib/practice/spellingPatternHints';
import { normalizeSingleSelectedListIds, selectSingleWordList } from '../lib/practice/wordListSelection';
import { isCommittedAnswerComplete } from '../lib/practice/inputFlow';
import { getWordListCanonicalUrl, shouldShowSelectedListShareAction } from '../lib/wordListSharing';

const SPELLING_HINT_AUDIO_REPLAY_DELAY_MS = 900;
const COPY_STATUS_VISIBLE_MS = 1600;

type RecallPauseVisibility = {
  wordId: string | null;
  visible: boolean;
};

type ShareDataNavigator = Navigator & {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
};

const HIDDEN_PROMPT_STYLE = { opacity: 0, visibility: 'hidden' } satisfies CSSProperties;

export function Progress({ value = 30, count = '3 / 10' }: { value?: number; count?: string }) {
  return (
    <div className="progress-top">
      <div className="progress-count">{count}</div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function getAnswerLayoutClass(answer: string) {
  const lettersOnly = answer.replace(/\s/g, '');
  const totalLetters = lettersOnly.length;
  const longestWordLength = answer
    .split(/\s+/)
    .reduce((max, part) => Math.max(max, part.length), 0);

  if (totalLetters >= 14 || longestWordLength >= 9) return 'extra-compact';
  if (totalLetters >= 9 || longestWordLength >= 6) return 'compact';
  return '';
}

function LetterSlots({
  word,
  letters,
  wrongIndex,
  wrongAttempt,
  activeIndex,
  layoutClass = '',
  wordComplete = false
}: {
  word: string;
  letters: Array<{ value: string; revealed?: boolean }>;
  wrongIndex: number | null;
  wrongAttempt: string | null;
  activeIndex: number;
  layoutClass?: string;
  wordComplete?: boolean;
}) {
  let globalIndex = 0;
  let visibleLetterIndex = 0;

  return (
    <div className={`letter-grid ${layoutClass} ${wordComplete ? 'word-complete' : ''}`.trim()}>
      {word.split(' ').map((wordPart, wordIndex) => {
        const startIndex = globalIndex;
        globalIndex += wordPart.length + 1;

        return (
          <span key={`${wordPart}-${wordIndex}-${startIndex}`} className="letter-word">
            {wordPart.split('').map((_, localIndex) => {
              const index = startIndex + localIndex;
              const slot = letters[index];
              const animationIndex = visibleLetterIndex;
              visibleLetterIndex += 1;
              const isMistake = wrongIndex === index;
              const displayValue = isMistake ? '×' : slot?.value;
              const hasValue = Boolean(displayValue);

              return (
                <span
                  key={`${index}-${slot?.value || 'empty'}-${slot?.revealed ? 'revealed' : 'typed'}-${isMistake ? 'wrong' : 'ok'}`}
                  className={`letter-slot ${!hasValue ? 'empty' : ''} ${activeIndex === index ? 'active' : ''} ${isMistake ? 'mistake' : ''} ${hasValue && !isMistake ? 'filled' : ''} ${hasValue && !isMistake && slot?.revealed ? 'revealed' : ''} ${hasValue && !isMistake && !slot?.revealed ? 'typed' : ''}`}
                  style={wordComplete ? { '--letter-wave-delay': `${animationIndex * 42}ms` } as CSSProperties : undefined}
                >
                  {displayValue || '_'}
                </span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
}

function GhostAnswer({
  answer,
  layoutClass = '',
  visible
}: {
  answer: string;
  layoutClass?: string;
  visible: boolean;
}) {
  return (
    <div className={`peek-ghost letter-grid ${layoutClass} ${visible ? 'visible' : ''}`.trim()} aria-hidden="true">
      {answer.split(' ').map((wordPart, wordIndex) => (
        <span key={`${wordPart}-${wordIndex}`} className="letter-word">
          {wordPart.split('').map((char, localIndex) => (
            <span key={`${char}-${localIndex}`} className="letter-slot peek-letter">
              {char}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

function getDialectLabel(word: PracticeWord, t: Translate) {
  if (word.dialect === 'Both') return null;
  if (word.dialect === 'North Wales') return t('practice.northForm');
  if (word.dialect === 'South Wales / Standard') return t('practice.southStandardForm');
  if (word.dialect === 'Standard') return t('practice.standardForm');
  return t('practice.dialectSpecificForm');
}

export function Practice({
  lists,
  storage,
  sessionStorage = storage,
  reviewDifficult = false,
  includeRecapDue = false,
  sessionKey = 0,
  showKeyboardHint = false,
  practiceTestMode = false,
  onStorageChange,
  onComplete,
  onBackHome,
  onWordListsDone,
  onResetProgress,
  initialModal = null,
  interfaceLanguage,
  onInterfaceLanguageChange,
  t
}: {
  lists: WordList[];
  storage: SpelioStorage;
  sessionStorage?: SpelioStorage;
  reviewDifficult?: boolean;
  includeRecapDue?: boolean;
  sessionKey?: number;
  showKeyboardHint?: boolean;
  practiceTestMode?: boolean;
  onStorageChange: (next: SpelioStorage) => void;
  onComplete: (result: SessionResult, nextStorage: SpelioStorage) => void;
  onBackHome: () => void;
  onWordListsDone: (selectedIds: string[]) => void;
  onResetProgress: () => void;
  initialModal?: 'settings' | 'wordlist' | null;
  interfaceLanguage: InterfaceLanguage;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
}) {
  const [modal, setModal] = useState<'wordlist' | null>(initialModal === 'wordlist' ? initialModal : null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [localStatusSecondary, setLocalStatusSecondary] = useState<string | null>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const mobileKeyboardEnabledRef = useRef(false);
  const settingsModalOpenRef = useRef(initialModal === 'settings');
  const localStatusTimerRef = useRef<number | null>(null);
  const spellingHintTimerRef = useRef<number | null>(null);
  const spellingHintAudioReplayTimerRef = useRef<number | null>(null);
  const shownSpellingHintsRef = useRef(new Set<string>());
  const [spellingHint, setSpellingHint] = useState<SpellingPatternHint | null>(null);
  const [isPeeking, setIsPeeking] = useState(false);
  const [isEnglishPromptPeeking, setIsEnglishPromptPeeking] = useState(false);
  const [peekUsedForCurrentWord, setPeekUsedForCurrentWord] = useState(false);
  const peekTimerRef = useRef<number | null>(null);
  const peekAutoHideTimerRef = useRef<number | null>(null);
  const englishPromptPeekTimerRef = useRef<number | null>(null);
  const recallPauseTimerRef = useRef<number | null>(null);
  const recallPauseScheduledWordIdRef = useRef<string | null>(null);
  const [recallPauseVisibility, setRecallPauseVisibility] = useState<RecallPauseVisibility>({ wordId: null, visible: false });
  const peekActivatedRef = useRef(false);
  const isPeekingRef = useRef(false);
  const revealShortcutHeldRef = useRef(false);
  const revealHandledByPointerRef = useRef(false);
  const englishHandledByPointerRef = useRef(false);
  const audioHandledByPointerRef = useRef(false);

  function shouldUseMobileKeyboard() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: none), (pointer: coarse)').matches;
  }

  function focusMobileInput() {
    if (!shouldUseMobileKeyboard()) return;

    mobileKeyboardEnabledRef.current = true;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    mobileInputRef.current?.focus({ preventScroll: true });
    window.requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
  }

  function blurMobileInput() {
    mobileKeyboardEnabledRef.current = false;
    mobileInputRef.current?.blur();
  }

  const {
    currentWord,
    letters,
    status,
    statusTone,
    wrongIndex,
    wrongAttempt,
    activeIndex,
    practiceAnswer,
    isComplete,
    stats,
    progressValue,
    progressCount,
    hasWords,
    handleInput,
    revealNext,
    markCurrentWordRevealed,
    audioPlaybackFailedWordIds,
    playAudio
  } = usePracticeSession({ lists, storage, sessionStorage, reviewDifficult, includeRecapDue, forceAudioAvailable: practiceTestMode, sessionKey, onStorageChange, onComplete, t });
  const completedListIds = useMemo(
    () => getFullyCompletedListIds(storage, lists),
    [lists, storage.listProgress, storage.settings.dialectPreference, storage.wordProgress]
  );

  const clearPeekTimers = useCallback(() => {
    if (peekTimerRef.current) {
      window.clearTimeout(peekTimerRef.current);
      peekTimerRef.current = null;
    }

    if (peekAutoHideTimerRef.current) {
      window.clearTimeout(peekAutoHideTimerRef.current);
      peekAutoHideTimerRef.current = null;
    }
  }, []);

  const clearEnglishPromptPeek = useCallback(() => {
    if (englishPromptPeekTimerRef.current) {
      window.clearTimeout(englishPromptPeekTimerRef.current);
      englishPromptPeekTimerRef.current = null;
    }
    setIsEnglishPromptPeeking(false);
  }, []);

  const clearRecallPauseTimer = useCallback(() => {
    if (recallPauseTimerRef.current) {
      window.clearTimeout(recallPauseTimerRef.current);
      recallPauseTimerRef.current = null;
    }
    recallPauseScheduledWordIdRef.current = null;
  }, []);

  const restorePracticeInputFocus = useCallback(() => {
    if (shouldUseMobileKeyboard()) {
      focusMobileInput();
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  const finishPeek = useCallback((showMemoryStatus = true, restoreFocus = true) => {
    clearPeekTimers();
    const wasPeeking = isPeekingRef.current;

    if (wasPeeking) {
      isPeekingRef.current = false;
      setIsPeeking(false);
      if (showMemoryStatus) showLocalStatus(t('practice.nowTryFromMemory'));
    }

    if (restoreFocus) restorePracticeInputFocus();
  }, [clearPeekTimers, restorePracticeInputFocus]);

  const activatePeek = useCallback(() => {
    if (!currentWord || isComplete || modal || settingsModalOpenRef.current) return;

    peekActivatedRef.current = true;

    if (peekUsedForCurrentWord) {
      showLocalStatus(t('practice.peekUsed'));
      restorePracticeInputFocus();
      return;
    }

    setPeekUsedForCurrentWord(true);
    markCurrentWordRevealed();
    isPeekingRef.current = true;
    setIsPeeking(true);

    if (peekAutoHideTimerRef.current) window.clearTimeout(peekAutoHideTimerRef.current);
    peekAutoHideTimerRef.current = window.setTimeout(() => {
      finishPeek(true);
    }, 1500);
  }, [currentWord, finishPeek, isComplete, markCurrentWordRevealed, modal, peekUsedForCurrentWord, restorePracticeInputFocus]);

  const activateEnglishPromptPeek = useCallback(() => {
    if (!currentWord || isComplete || modal || settingsModalOpenRef.current) return;

    restorePracticeInputFocus();

    const currentWordAudioUnavailable = isAudioUnavailableForPrompt(currentWord, audioPlaybackFailedWordIds.has(currentWord.id));
    const promptAlreadyVisible = shouldShowEnglishPrompt(storage.settings.englishVisible, currentWordAudioUnavailable) || isEnglishPromptPeeking;
    if (promptAlreadyVisible) return;

    if (englishPromptPeekTimerRef.current) window.clearTimeout(englishPromptPeekTimerRef.current);
    setIsEnglishPromptPeeking(true);
    englishPromptPeekTimerRef.current = window.setTimeout(() => {
      setIsEnglishPromptPeeking(false);
      englishPromptPeekTimerRef.current = null;
      restorePracticeInputFocus();
    }, 1500);
  }, [audioPlaybackFailedWordIds, currentWord, isComplete, isEnglishPromptPeeking, modal, restorePracticeInputFocus, storage.settings.englishVisible]);

  const beginPeekHold = useCallback((delayMs = 300) => {
    if (!currentWord || isComplete || modal || settingsModalOpenRef.current) return;

    clearPeekTimers();
    peekActivatedRef.current = false;
    peekTimerRef.current = window.setTimeout(activatePeek, delayMs);
  }, [activatePeek, clearPeekTimers, currentWord, isComplete, modal]);

  const endPeekHold = useCallback(() => {
    if (peekTimerRef.current) {
      window.clearTimeout(peekTimerRef.current);
      peekTimerRef.current = null;
    }

    if (isPeekingRef.current) {
      finishPeek(true);
    } else {
      restorePracticeInputFocus();
    }

    peekActivatedRef.current = false;
  }, [finishPeek, restorePracticeInputFocus]);

  const clearScheduledSpellingHintAudioReplay = useCallback(() => {
    if (spellingHintAudioReplayTimerRef.current) {
      window.clearTimeout(spellingHintAudioReplayTimerRef.current);
      spellingHintAudioReplayTimerRef.current = null;
    }
  }, []);

  const clearSpellingHint = useCallback(() => {
    if (spellingHintTimerRef.current) {
      window.clearTimeout(spellingHintTimerRef.current);
      spellingHintTimerRef.current = null;
    }
    clearScheduledSpellingHintAudioReplay();
    setSpellingHint(null);
  }, [clearScheduledSpellingHintAudioReplay]);

  const handlePracticeInput = useCallback((input: string) => {
    const result = handleInput(input);
    if (result.type !== 'incorrect' || !currentWord) return;

    const hint = getSpellingPatternHint({
      targetAnswer: practiceAnswer,
      currentInputPosition: result.inputPosition,
      attempted: result.attempted,
      word: {
        spellingHintId: currentWord.spellingHintId,
        disablePatternHints: currentWord.disablePatternHints
      },
      interfaceLanguage
    });

    if (!hint) return;

    const shownKey = `${currentWord.id}:${result.inputPosition}:${hint.id}`;
    if (shownSpellingHintsRef.current.has(shownKey)) return;
    shownSpellingHintsRef.current.add(shownKey);

    if (spellingHintTimerRef.current) window.clearTimeout(spellingHintTimerRef.current);
    setSpellingHint(hint);
    spellingHintTimerRef.current = window.setTimeout(() => {
      setSpellingHint(null);
      clearScheduledSpellingHintAudioReplay();
      spellingHintTimerRef.current = null;
    }, 4000);

    const currentWordAudioUnavailable = isAudioUnavailableForPrompt(currentWord, audioPlaybackFailedWordIds.has(currentWord.id));
    if (storage.settings.audioPrompts && !currentWordAudioUnavailable) {
      clearScheduledSpellingHintAudioReplay();
      spellingHintAudioReplayTimerRef.current = window.setTimeout(() => {
        spellingHintAudioReplayTimerRef.current = null;
        void playAudio();
      }, SPELLING_HINT_AUDIO_REPLAY_DELAY_MS);
    }
  }, [
    audioPlaybackFailedWordIds,
    clearScheduledSpellingHintAudioReplay,
    currentWord,
    handleInput,
    interfaceLanguage,
    playAudio,
    practiceAnswer,
    storage.settings.audioPrompts
  ]);

  useEffect(() => {
    return () => {
      if (localStatusTimerRef.current) window.clearTimeout(localStatusTimerRef.current);
      if (spellingHintTimerRef.current) window.clearTimeout(spellingHintTimerRef.current);
      if (spellingHintAudioReplayTimerRef.current) window.clearTimeout(spellingHintAudioReplayTimerRef.current);
      clearPeekTimers();
      clearEnglishPromptPeek();
      clearRecallPauseTimer();
      revealShortcutHeldRef.current = false;
    };
  }, [clearEnglishPromptPeek, clearPeekTimers, clearRecallPauseTimer]);

  useEffect(() => {
    isPeekingRef.current = isPeeking;
  }, [isPeeking]);

  useLayoutEffect(() => {
    clearPeekTimers();
    const wasPeeking = isPeekingRef.current;
    peekActivatedRef.current = false;
    isPeekingRef.current = false;
    setIsPeeking(false);
    clearEnglishPromptPeek();
    clearRecallPauseTimer();
    clearSpellingHint();
    setRecallPauseVisibility({ wordId: currentWord?.id ?? null, visible: false });
    shownSpellingHintsRef.current = new Set();
    setPeekUsedForCurrentWord(false);
    revealShortcutHeldRef.current = false;
    if (wasPeeking) restorePracticeInputFocus();
  }, [clearEnglishPromptPeek, clearPeekTimers, clearRecallPauseTimer, clearSpellingHint, currentWord?.id, restorePracticeInputFocus]);

  useEffect(() => {
    if (modal || isComplete || settingsModalOpenRef.current) {
      finishPeek(false);
      clearEnglishPromptPeek();
      clearRecallPauseTimer();
      if (currentWord) setRecallPauseVisibility({ wordId: currentWord.id, visible: true });
      if (isComplete) clearSpellingHint();
      peekActivatedRef.current = false;
      revealShortcutHeldRef.current = false;
    }
  }, [clearEnglishPromptPeek, clearRecallPauseTimer, clearSpellingHint, currentWord?.id, finishPeek, isComplete, modal]);

  useEffect(() => {
    if (status) {
      setLocalStatus(null);
      setLocalStatusSecondary(null);
    }
  }, [status]);

  useEffect(() => {
    function isControlTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      if (target === mobileInputRef.current) return false;
      return Boolean(target.closest('input, textarea, select, button, [contenteditable="true"]'));
    }

    function onKeyDown(event: KeyboardEvent) {
      if (modal || settingsModalOpenRef.current || isComplete || !currentWord) return;
      if (isControlTarget(event.target)) return;

      if (event.code === 'ArrowLeft') {
        if (practiceTestMode) return;
        event.preventDefault();
        activateEnglishPromptPeek();
        return;
      }

      if (event.code === 'ArrowUp') {
        event.preventDefault();
        clearScheduledSpellingHintAudioReplay();
        restorePracticeInputFocus();
        playAudio();
        return;
      }

      if (event.code === 'ArrowRight') {
        if (practiceTestMode) return;
        const result = handleRevealShortcutKeyDown({
          code: event.code,
          repeat: event.repeat,
          held: revealShortcutHeldRef.current
        });
        if (!result.handled) return;

        event.preventDefault();
        revealShortcutHeldRef.current = result.held;
        for (const action of result.actions) {
          if (action === 'reveal-next') revealNext();
          if (action === 'begin-peek-hold') beginPeekHold(KEYBOARD_REVEAL_HOLD_DELAY_MS);
        }
        restorePracticeInputFocus();
        return;
      }

      if (event.key.length === 1 && /[a-zA-ZÀ-žŵŷŴŶ'’‘`´ʻ\-–—‑]/.test(event.key)) {
        handlePracticeInput(event.key);
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      const result = handleRevealShortcutKeyUp({
        code: event.code,
        held: revealShortcutHeldRef.current
      });
      if (!result.handled) return;

      event.preventDefault();
      revealShortcutHeldRef.current = result.held;
      for (const action of result.actions) {
        if (action === 'end-peek-hold') endPeekHold();
      }
    }

    function onWindowBlur() {
      if (!revealShortcutHeldRef.current) return;
      revealShortcutHeldRef.current = false;
      endPeekHold();
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [activateEnglishPromptPeek, beginPeekHold, clearScheduledSpellingHintAudioReplay, currentWord, endPeekHold, handlePracticeInput, isComplete, modal, playAudio, practiceTestMode, restorePracticeInputFocus, revealNext]);

  useEffect(() => {
    if (!currentWord || isComplete || modal || !shouldUseMobileKeyboard()) return;

    const timer = window.setTimeout(() => {
      focusMobileInput();
    }, 80);

    return () => window.clearTimeout(timer);
  }, [currentWord?.id, isComplete, modal]);

  const currentWordComplete = currentWord ? isCommittedAnswerComplete(practiceAnswer, letters, storage.settings.welshSpelling) : false;

  useEffect(() => {
    if (currentWordComplete) finishPeek(false);
  }, [currentWordComplete, finishPeek]);

  useEffect(() => {
    clearRecallPauseTimer();

    if (!currentWord) {
      setRecallPauseVisibility({ wordId: null, visible: false });
      return;
    }

    const playbackFailed = audioPlaybackFailedWordIds.has(currentWord.id);
    const shouldDelay = shouldDelayEnglishPrompt(storage.settings, currentWord, playbackFailed);
    if (!shouldDelay || isComplete || modal || settingsModalOpenRef.current) {
      setRecallPauseVisibility({ wordId: currentWord.id, visible: true });
      return;
    }

    setRecallPauseVisibility({ wordId: currentWord.id, visible: false });
    const recallPauseDelayMs = getRecallPauseDelayMs({
      prompt: getPrompt(currentWord),
      answer: practiceAnswer
    });
    recallPauseScheduledWordIdRef.current = currentWord.id;
    recallPauseTimerRef.current = window.setTimeout(() => {
      if (recallPauseScheduledWordIdRef.current !== currentWord.id) return;
      setRecallPauseVisibility({ wordId: currentWord.id, visible: true });
      recallPauseTimerRef.current = null;
      recallPauseScheduledWordIdRef.current = null;
    }, recallPauseDelayMs);

    return clearRecallPauseTimer;
  }, [
    audioPlaybackFailedWordIds,
    clearRecallPauseTimer,
    currentWord?.audioStatus,
    currentWord?.audioUrl,
    currentWord?.id,
    isComplete,
    modal,
    practiceAnswer,
    storage.settings.audioPrompts,
    storage.settings.englishVisible,
    storage.settings.recallPause
  ]);

  const updateSettings = useCallback((patch: Partial<SpelioSettings>) => {
    const nextSettings = { ...storage.settings, ...patch };
    if (!nextSettings.audioPrompts) {
      nextSettings.englishVisible = true;
    }

    const hasChanged = (Object.keys(nextSettings) as Array<keyof SpelioSettings>).some(settingKey => {
      return storage.settings[settingKey] !== nextSettings[settingKey];
    });

    if (!hasChanged) return;
    onStorageChange({ ...storage, settings: nextSettings });
  }, [onStorageChange, storage]);

  const handleSettingsModalOpenChange = useCallback((open: boolean) => {
    settingsModalOpenRef.current = open;
    if (open) {
      finishPeek(false, false);
      clearRecallPauseTimer();
      if (currentWord) setRecallPauseVisibility({ wordId: currentWord.id, visible: true });
      blurMobileInput();
      peekActivatedRef.current = false;
    } else {
      restorePracticeInputFocus();
    }
  }, [clearRecallPauseTimer, currentWord?.id, finishPeek, restorePracticeInputFocus]);

  function applyWordLists(selectedIds: string[]) {
    const ids = normalizeSingleSelectedListIds(selectedIds, lists);
    const changed = ids.length !== storage.selectedListIds.length || ids.some((id, index) => id !== storage.selectedListIds[index]);

    if (!changed) {
      setModal(null);
      return;
    }

    onWordListsDone(ids);
  }

  function handleRevealLetter(event?: MouseEvent<HTMLButtonElement>) {
    if (practiceTestMode) return;

    if (revealHandledByPointerRef.current) {
      revealHandledByPointerRef.current = false;
      return;
    }

    if (peekActivatedRef.current) {
      peekActivatedRef.current = false;
      event?.currentTarget.blur();
      restorePracticeInputFocus();
      return;
    }

    revealNext();
    event?.currentTarget.blur();
    restorePracticeInputFocus();
  }

  function handleRevealPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (practiceTestMode) return;

    if (shouldUseMobileKeyboard()) {
      event.preventDefault();
      focusMobileInput();
    }

    beginPeekHold();
  }

  function handleRevealPointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (practiceTestMode) return;

    const didPeek = peekActivatedRef.current;
    endPeekHold();
    revealHandledByPointerRef.current = true;

    if (!didPeek) {
      revealNext();
      event.currentTarget.blur();
      restorePracticeInputFocus();
    }
  }

  function showLocalStatus(message: string, secondaryMessage: string | null = null) {
    setLocalStatus(message);
    setLocalStatusSecondary(secondaryMessage);
    if (localStatusTimerRef.current) window.clearTimeout(localStatusTimerRef.current);
    localStatusTimerRef.current = window.setTimeout(() => {
      setLocalStatus(null);
      setLocalStatusSecondary(null);
    }, 1500);
  }

  function toggleEnglishPrompt() {
    if (practiceTestMode) return;

    if (!storage.settings.audioPrompts && storage.settings.englishVisible) {
      showLocalStatus(t('practice.promptNeededWhenAudioOff'));
      return;
    }

    const nextVisible = !storage.settings.englishVisible;
    updateSettings({ englishVisible: nextVisible });
    showLocalStatus(
      nextVisible ? t('practice.promptOn') : t('practice.promptOff'),
      nextVisible ? null : t('practice.promptOffShortcutHint')
    );
  }

  function toggleAudioPrompts() {
    const nextAudioPrompts = !storage.settings.audioPrompts;
    updateSettings(nextAudioPrompts ? { audioPrompts: true } : { audioPrompts: false, englishVisible: true });
    showLocalStatus(nextAudioPrompts ? t('practice.audioOn') : t('practice.audioOff'));
  }

  function handleEnglishToggle(event?: MouseEvent<HTMLButtonElement>) {
    if (englishHandledByPointerRef.current) {
      englishHandledByPointerRef.current = false;
      return;
    }

    toggleEnglishPrompt();
    event?.currentTarget.blur();
    restorePracticeInputFocus();
  }

  function handleEnglishPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (shouldUseMobileKeyboard()) {
      event.preventDefault();
      focusMobileInput();
    }
  }

  function handleEnglishPointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (!shouldUseMobileKeyboard()) return;

    englishHandledByPointerRef.current = true;
    toggleEnglishPrompt();
    event.currentTarget.blur();
    restorePracticeInputFocus();
  }

  function handleAudioToggle(event?: MouseEvent<HTMLButtonElement>) {
    if (audioHandledByPointerRef.current) {
      audioHandledByPointerRef.current = false;
      return;
    }

    toggleAudioPrompts();
    event?.currentTarget.blur();
    restorePracticeInputFocus();
  }

  function handleAudioPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (shouldUseMobileKeyboard()) {
      event.preventDefault();
      focusMobileInput();
    }
  }

  function handleAudioPointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (!shouldUseMobileKeyboard()) return;

    audioHandledByPointerRef.current = true;
    toggleAudioPrompts();
    event.currentTarget.blur();
    restorePracticeInputFocus();
  }

  function handleWordPillClick(event: MouseEvent<HTMLButtonElement>) {
    clearScheduledSpellingHintAudioReplay();

    const wordPillButton = event.currentTarget;
    const restoreFocusAfterClick = () => {
      window.requestAnimationFrame(() => {
        if (isComplete || !currentWord || modal || settingsModalOpenRef.current || !document.contains(wordPillButton)) return;
        wordPillButton.blur();
        restorePracticeInputFocus();
      });
    };

    logAudioPlaybackClick('learner-word-pill', currentWord?.audioUrl);
    if (currentWord && isAudioUnavailableForPrompt(currentWord, audioPlaybackFailedWordIds.has(currentWord.id))) {
      showLocalStatus(t('practice.audioUnavailable'));
      if (shouldUseMobileKeyboard()) {
        window.setTimeout(focusMobileInput, 40);
      }
      restoreFocusAfterClick();
      return;
    }

    if (!storage.settings.audioPrompts && !practiceTestMode) {
      restoreFocusAfterClick();
      return;
    }

    playAudio();
    if (shouldUseMobileKeyboard()) {
      window.setTimeout(focusMobileInput, 40);
    }
    restoreFocusAfterClick();
  }

  if (!hasWords || !currentWord) {
    return (
      <main className="app-bg practice-app relative overflow-hidden">
        <Progress value={0} count="0 / 0" />
        <PracticeTopNav onBackHome={onBackHome} />
        <section className="page-shell practice-shell">
          <div className="status-line">{t('practice.selectListToBegin')}</div>
          <button className="done-button mt-10" onClick={() => setModal('wordlist')}>{t('home.selectWordList')}</button>
          <button className="clear-button mt-8" onClick={onBackHome}>{t('practice.backToHome')}</button>
          <Footer className="home-footer" interfaceLanguage={interfaceLanguage} onInterfaceLanguageChange={onInterfaceLanguageChange} t={t} />
        </section>
        {modal === 'wordlist' && (
          <WordListModal
            lists={lists}
            initialSelectedIds={storage.selectedListIds}
            completedListIds={completedListIds}
            onClose={() => setModal(null)}
            onDone={applyWordLists}
            interfaceLanguage={interfaceLanguage}
            t={t}
          />
        )}
      </main>
    );
  }

  const answer = practiceAnswer;
  const prompt = getPrompt(currentWord);
  const answerLayoutClass = getAnswerLayoutClass(answer);
  const wordComplete = currentWordComplete;
  const displayStatus = status ?? localStatus;
  const displayStatusSecondary = status ? null : localStatusSecondary;
  const displayTone = status ? statusTone : 'neutral';
  const dialectLabel = getDialectLabel(currentWord, t);
  const spellingHintText = !practiceTestMode && spellingHint ? t(spellingHint.translationKey) : null;
  const currentWordAudioUnavailable = isAudioUnavailableForPrompt(currentWord, audioPlaybackFailedWordIds.has(currentWord.id));
  const effectiveEnglishVisible = practiceTestMode ? false : storage.settings.englishVisible;
  const shouldDelayCurrentEnglishPrompt = shouldDelayEnglishPrompt(
    practiceTestMode ? { ...storage.settings, englishVisible: false, recallPause: false } : storage.settings,
    currentWord,
    audioPlaybackFailedWordIds.has(currentWord.id)
  );
  const basePromptVisible = practiceTestMode ? false : shouldShowEnglishPrompt(effectiveEnglishVisible, currentWordAudioUnavailable);
  const recallPausePromptReleased =
    !shouldDelayCurrentEnglishPrompt ||
    (recallPauseVisibility.wordId === currentWord.id && recallPauseVisibility.visible);
  const promptDisplay = getEnglishPromptDisplayState({
    basePromptVisible,
    shouldDelay: shouldDelayCurrentEnglishPrompt,
    delayedVisible: recallPausePromptReleased,
    peeking: isEnglishPromptPeeking
  });
  const promptVisible = promptDisplay.visible;
  const promptDelayed = promptDisplay.reserved;
  const promptUsesRecallPauseShell = promptDelayed || (promptVisible && shouldDelayCurrentEnglishPrompt);
  const wordPillAudioIconVisible = storage.settings.audioPrompts || practiceTestMode;
  const wordInsights = !practiceTestMode && interfaceLanguage === 'en'
    ? [currentWord.dialectNote, currentWord.usageNote]
      .map(note => note?.trim())
      .filter((note): note is string => Boolean(note))
    : [];
  const learnerNoteVisible = !practiceTestMode && Boolean(spellingHintText || dialectLabel || wordInsights.length);

  return (
    <main className="app-bg practice-app relative overflow-hidden">
      <Progress value={isComplete ? 100 : progressValue} count={isComplete ? `${stats.total} / ${stats.total}` : progressCount} />
      <PracticeTopNav onBackHome={onBackHome} />

      <section className="page-shell practice-shell">
        <button className="word-pill" onClick={handleWordPillClick}>
          {wordPillAudioIconVisible && <Repeat className="prompt-audio-icon" size={23} />}
          {promptUsesRecallPauseShell ? (
            <span key={currentWord.id} className={`prompt-text ${promptVisible ? 'visible' : 'delayed'}`.trim()}>
              <span className="prompt-text-reserve" style={HIDDEN_PROMPT_STYLE} aria-hidden="true">{prompt}</span>
              <span className="prompt-text-value" style={promptVisible ? undefined : HIDDEN_PROMPT_STYLE} aria-hidden={!promptVisible}>{prompt}</span>
            </span>
          ) : (
            promptVisible && <span>{prompt}</span>
          )}
        </button>
        {currentWordAudioUnavailable && !effectiveEnglishVisible && !practiceTestMode && (
          <div className="audio-fallback-label">{t('practice.audioFallbackPromptShown')}</div>
        )}
        <div
          className={`word-insight learner-note ${spellingHintText ? 'pattern-hint' : ''} ${learnerNoteVisible ? '' : 'empty'}`.trim()}
          aria-label={t('practice.wordInsight')}
          aria-live="polite"
        >
          {spellingHintText ? (
            <span>{spellingHintText}</span>
          ) : (
            <>
              {dialectLabel && <span className="learner-note-dialect">{dialectLabel}</span>}
              {wordInsights.map(note => (
                <span key={note}>{note}</span>
              ))}
            </>
          )}
        </div>

        <input
          ref={mobileInputRef}
          value=""
          onChange={(event) => {
            if (!mobileKeyboardEnabledRef.current || !shouldUseMobileKeyboard()) {
              event.target.value = '';
              return;
            }

            const value = event.target.value;
            if (value) handlePracticeInput(value);
            event.target.value = '';
          }}
          inputMode="text"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label={t('practice.typeAnswer')}
          onBlur={() => {
            mobileKeyboardEnabledRef.current = false;
          }}
          className="mobile-practice-input"
        />

        <div
          onClick={focusMobileInput}
          className="letter-input-tap-zone"
        >
          <LetterSlots word={answer} letters={letters} wrongIndex={wrongIndex} wrongAttempt={wrongAttempt} activeIndex={activeIndex} layoutClass={answerLayoutClass} wordComplete={wordComplete} />
          <GhostAnswer answer={answer} layoutClass={answerLayoutClass} visible={isPeeking} />
        </div>

        <AnimatedStatusLine status={displayStatus} secondaryStatus={displayStatusSecondary} tone={displayTone} />
        {showKeyboardHint && (
          <div className="keyboard-shortcut-hint">
            <span className="keyboard-shortcut-item">
              <SquareArrowUp size={14} strokeWidth={1.8} aria-hidden="true" />
              <span>{t('practice.shortcutReplayAudio')}</span>
            </span>
            {!practiceTestMode && (
              <>
                <span aria-hidden="true">·</span>
                <span className="keyboard-shortcut-item">
                  <SquareArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
                  <span>{t('practice.shortcutRevealNextLetter')}</span>
                </span>
              </>
            )}
          </div>
        )}

        <div className={`utility-bar ${practiceTestMode ? 'practice-test-utility-bar' : ''}`.trim()}>
          {!practiceTestMode && (
            <button
              onClick={handleEnglishToggle}
              onPointerDown={handleEnglishPointerDown}
              onPointerUp={handleEnglishPointerUp}
              aria-label={t('practice.togglePrompt')}
              aria-pressed={storage.settings.englishVisible}
            >
              <MessageSquareQuote size={22} />
              <span className="english-toggle-label">{t('practice.promptToggle')}</span>
            </button>
          )}

          <button
            onClick={handleAudioToggle}
            onPointerDown={handleAudioPointerDown}
            onPointerUp={handleAudioPointerUp}
            aria-label={t('practice.toggleAudio')}
            aria-pressed={storage.settings.audioPrompts}
          >
            {storage.settings.audioPrompts ? <Volume2 size={22} /> : <VolumeX size={22} />}
            <span>{t('practice.audio')}</span>
          </button>

          {!practiceTestMode && (
            <button
              className="reveal-button"
              aria-label={t('practice.revealNext')}
              onPointerDown={handleRevealPointerDown}
              onPointerUp={handleRevealPointerUp}
              onPointerCancel={endPeekHold}
              onPointerLeave={endPeekHold}
              onContextMenu={(event) => event.preventDefault()}
              onClick={handleRevealLetter}
            >
              <Eye size={23} />
              <span>{t('practice.reveal')}</span>
            </button>
          )}
        </div>

        <SettingsLauncher
          settings={storage.settings}
          activePracticeSession={Boolean(currentWord && hasWords && !isComplete)}
          onChange={updateSettings}
          onOpenChange={handleSettingsModalOpenChange}
          onResetProgress={onResetProgress}
          initiallyOpen={initialModal === 'settings'}
          t={t}
        />

        <Footer className="home-footer" interfaceLanguage={interfaceLanguage} onInterfaceLanguageChange={onInterfaceLanguageChange} t={t} />
      </section>

      {modal === 'wordlist' && (
        <WordListModal
          lists={lists}
          initialSelectedIds={storage.selectedListIds}
          completedListIds={completedListIds}
          onClose={() => setModal(null)}
          onDone={applyWordLists}
          interfaceLanguage={interfaceLanguage}
          t={t}
        />
      )}
    </main>
  );
}

function PracticeTopNav({ onBackHome }: { onBackHome: () => void }) {
  return (
    <>
      <button className="practice-home-back" onClick={onBackHome} aria-label="Back to home" type="button">
        <ArrowLeft size={25} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <div className="practice-home-logo">
        <button onClick={onBackHome} aria-label="Go to home" type="button">
          <span>S<span aria-hidden="true">_</span></span>
        </button>
      </div>
    </>
  );
}

function AnimatedStatusLine({
  status,
  secondaryStatus,
  tone
}: {
  status: string | null;
  secondaryStatus?: string | null;
  tone: 'success' | 'error' | 'neutral';
}) {
  const [visibleStatus, setVisibleStatus] = useState(status);
  const [visibleSecondaryStatus, setVisibleSecondaryStatus] = useState(secondaryStatus ?? null);
  const [visibleTone, setVisibleTone] = useState(tone);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let timer: number | undefined;

    if (status) {
      setVisibleStatus(status);
      setVisibleSecondaryStatus(secondaryStatus ?? null);
      setVisibleTone(tone);
      setLeaving(false);
      return undefined;
    }

    if (visibleStatus) {
      setLeaving(true);
      timer = window.setTimeout(() => {
        setVisibleStatus(null);
        setVisibleSecondaryStatus(null);
        setLeaving(false);
      }, 260);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [secondaryStatus, status, tone, visibleStatus]);

  return (
    <div className={`status-line status-line-${visibleStatus ? visibleTone : tone}`}>
      {visibleStatus && (
        <span className={`status-message ${leaving ? 'leaving' : 'entering'}`} key={visibleStatus}>
          <span className="status-message-primary">
            {visibleTone === 'error' && <CircleX size={22} />}
            {visibleStatus}
          </span>
          {visibleSecondaryStatus && (
            <span className="status-message-secondary">
              <SquareArrowLeft size={12} strokeWidth={2} aria-hidden="true" />
              {visibleSecondaryStatus}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

function Overlay({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={['overlay', className].filter(Boolean).join(' ')}>{children}</div>;
}

function Toggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button className={`toggle-switch ${active ? 'on' : ''}`} onClick={onClick} type="button" aria-pressed={active}>
      <span />
    </button>
  );
}

function Radio({ active = false }: { active?: boolean }) {
  return (
    <span className={`settings-radio ${active ? 'active' : ''}`} aria-hidden="true">
      {active && <span />}
    </span>
  );
}

const SettingsLauncher = memo(function SettingsLauncher({
  settings,
  activePracticeSession,
  onChange,
  onOpenChange,
  onResetProgress,
  initiallyOpen = false,
  t
}: {
  settings: SpelioSettings;
  activePracticeSession: boolean;
  onChange: (patch: Partial<SpelioSettings>) => void;
  onOpenChange: (open: boolean) => void;
  onResetProgress: () => void;
  initiallyOpen?: boolean;
  t: Translate;
}) {
  const [open, setOpen] = useState(initiallyOpen);

  const setModalOpen = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange(nextOpen);
  }, [onOpenChange]);

  return (
    <>
      <button className="settings-cog" onClick={() => setModalOpen(true)} aria-label={t('settings.open')}>
        <Settings size={22} />
      </button>
      {open && (
        <SettingsModal
          settings={settings}
          activePracticeSession={activePracticeSession}
          onChange={onChange}
          onClose={() => setModalOpen(false)}
          onResetProgress={onResetProgress}
          t={t}
        />
      )}
    </>
  );
});

export function SettingsModal({
  settings,
  activePracticeSession,
  onChange,
  onClose,
  onResetProgress,
  t
}: {
  settings: SpelioSettings;
  activePracticeSession: boolean;
  onChange: (patch: Partial<SpelioSettings>) => void;
  onClose: () => void;
  onResetProgress: () => void;
  t: Translate;
}) {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [welshStyleNoticeVisible, setWelshStyleNoticeVisible] = useState(false);

  function handleResetConfirm() {
    setConfirmingReset(false);
    onClose();
    onResetProgress();
  }

  function handleDialectPreferenceChange(dialectPreference: SpelioSettings['dialectPreference']) {
    if (dialectPreference === settings.dialectPreference) return;

    onChange({ dialectPreference });
    if (activePracticeSession) {
      setWelshStyleNoticeVisible(true);
    }
  }

  return (
    <Overlay>
      <section className="modal modal-small settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="settings-modal-header flex items-center justify-between">
          <h2 className="modal-title" id="settings-title">{t('settings.title')}</h2>
          <button className="modal-close" onClick={onClose} aria-label={t('settings.close')}>×</button>
        </div>

        <div className="settings-modal-body">
          <div>
            <h3 className="text-[16px] md:text-[15px] font-extrabold">{t('settings.interfaceLanguage')}</h3>

            <div className="mt-7 space-y-7">
              <button className="flex gap-5 text-left" onClick={() => onChange({ interfaceLanguage: 'en' })}>
                <Radio active={settings.interfaceLanguage === 'en'} />
                <span>
                  <b className="block text-[18px] md:text-[15px]">{t('settings.english')}</b>
                </span>
              </button>

              <button className="flex gap-5 text-left" onClick={() => onChange({ interfaceLanguage: 'cy' })}>
                <Radio active={settings.interfaceLanguage === 'cy'} />
                <span>
                  <b className="block text-[18px] md:text-[15px]">{t('settings.cymraeg')}</b>
                </span>
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="text-[16px] md:text-[15px] font-extrabold">{t('settings.appearance')}</h3>

            <div className="mt-7 space-y-7">
              <button className="flex gap-5 text-left" onClick={() => onChange({ theme: 'light' })}>
                <Radio active={settings.theme === 'light'} />
                <span>
                  <b className="block text-[18px] md:text-[15px]">{t('settings.light')}</b>
                </span>
              </button>

              <button className="flex gap-5 text-left" onClick={() => onChange({ theme: 'dark' })}>
                <Radio active={settings.theme === 'dark'} />
                <span>
                  <b className="block text-[18px] md:text-[15px]">{t('settings.dark')}</b>
                </span>
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="text-[16px] md:text-[15px] font-extrabold">{t('settings.welshSpelling')}</h3>
            <p className="mt-2 field-note">{t('settings.welshSpellingNote')}</p>

            <div className="mt-7 space-y-7">
              <button className="flex gap-5 text-left" onClick={() => onChange({ welshSpelling: 'flexible' })}>
                <Radio active={settings.welshSpelling === 'flexible'} />
                <span>
                  <b className="block text-[18px] md:text-[15px]">{t('settings.flexible')}</b>
                  <span className="mt-2 block field-note">{t('settings.flexibleNote')}</span>
                </span>
              </button>

              <button className="flex gap-5 text-left" onClick={() => onChange({ welshSpelling: 'strict' })}>
                <Radio active={settings.welshSpelling === 'strict'} />
                <span>
                  <b className="block text-[18px] md:text-[15px]">{t('settings.strict')}</b>
                  <span className="mt-2 block field-note">{t('settings.strictNote')}</span>
                </span>
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="text-[16px] md:text-[15px] font-extrabold">{t('settings.welshStyle')}</h3>

            <div className="mt-7 space-y-7">
              <button className="flex gap-5 text-left" onClick={() => handleDialectPreferenceChange('mixed')}>
                <Radio active={settings.dialectPreference === 'mixed'} />
                <span>
                  <b className="block text-[18px] md:text-[15px]">{t('settings.mixedWelsh')}</b>
                </span>
              </button>

              <button className="flex gap-5 text-left" onClick={() => handleDialectPreferenceChange('north')}>
                <Radio active={settings.dialectPreference === 'north'} />
                <span>
                  <b className="block text-[18px] md:text-[15px]">{t('settings.northWales')}</b>
                </span>
              </button>

              <button className="flex gap-5 text-left" onClick={() => handleDialectPreferenceChange('south_standard')}>
                <Radio active={settings.dialectPreference === 'south_standard'} />
                <span>
                  <b className="block text-[18px] md:text-[15px]">{t('settings.southStandard')}</b>
                </span>
              </button>
            </div>
            {welshStyleNoticeVisible && (
              <p className="mt-5 field-note" role="status">
                {t('settings.styleAppliesNextSession')}
              </p>
            )}
          </div>

          <div className="settings-section space-y-8">
            <div className="flex items-center justify-between gap-8">
              <span>
                <b className="block text-[18px] md:text-[15px]">{t('settings.audioPrompts')}</b>
                <span className="mt-2 block field-note">{t('settings.audioPromptsNote')}</span>
              </span>
              <Toggle active={settings.audioPrompts} onClick={() => onChange({ audioPrompts: !settings.audioPrompts })} />
            </div>

            <div className="flex items-center justify-between gap-8">
              <span>
                <b className="block text-[18px] md:text-[15px]">{t('settings.recallPause')}</b>
                <span className="mt-2 block field-note">{t('settings.recallPauseNote')}</span>
              </span>
              <Toggle active={settings.recallPause} onClick={() => onChange({ recallPause: !settings.recallPause })} />
            </div>

            <div className="flex items-center justify-between gap-8">
              <span>
                <b className="block text-[18px] md:text-[15px]">{t('settings.soundEffects')}</b>
                <span className="mt-2 block field-note">{t('settings.soundEffectsNote')}</span>
              </span>
              <Toggle active={settings.soundEffects} onClick={() => onChange({ soundEffects: !settings.soundEffects })} />
            </div>
          </div>

          <div className="settings-section settings-section-reset">
            <h3 className="text-[16px] md:text-[15px] font-extrabold text-[var(--red)]">{t('settings.resetProgress')}</h3>
            <p className="mt-2 field-note">{t('settings.localProgressNote')}</p>
            <button className="reset-progress-button" onClick={() => setConfirmingReset(true)} type="button">
              <Trash2 size={18} aria-hidden="true" />
              {t('settings.resetProgress')}
            </button>
          </div>
        </div>

        <div className="settings-modal-footer">
          <button className="settings-close-button" onClick={onClose}>{t('settings.closeButton')}</button>
        </div>
      </section>

      {confirmingReset && (
        <div className="confirm-layer" role="presentation">
          <section className="modal modal-small reset-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-progress-title">
            <h2 className="modal-title" id="reset-progress-title">{t('settings.resetProgressTitle')}</h2>
            <p className="modal-text mt-5">
              {t('settings.resetProgressBody')}
            </p>
            <div className="mt-9 flex justify-end gap-3">
              <button className="confirm-cancel-button" onClick={() => setConfirmingReset(false)} type="button">
                {t('settings.cancel')}
              </button>
              <button className="confirm-reset-button" onClick={handleResetConfirm} type="button">
                {t('settings.reset')}
              </button>
            </div>
          </section>
        </div>
      )}
    </Overlay>
  );
}

const WordListRow = memo(function WordListRow({
  list,
  displayName,
  selected,
  completed,
  completedLabel,
  shareLabel,
  onSelect,
  onShare
}: {
  list: WordList;
  displayName: string;
  selected: boolean;
  completed: boolean;
  completedLabel: string;
  shareLabel: string;
  onSelect: (listId: string) => void;
  onShare: (list: WordList) => void;
}) {
  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onSelect(list.id);
  }

  return (
    <div
      className={`wordlist-row ${selected ? 'selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onSelect(list.id)}
      onKeyDown={handleKeyDown}
    >
      <span className="check-left">
        <span className="check-name">{displayName}</span>
      </span>
      <span className="wordlist-row-indicators">
        {completed && (
          <span className="wordlist-completed-indicator" title={completedLabel} aria-label={completedLabel} role="img">
            <Check size={16} strokeWidth={2.2} aria-hidden="true" />
          </span>
        )}
        {selected && (
          <span className="wordlist-selected-indicator" aria-hidden="true">
            <Check size={16} strokeWidth={2.2} />
          </span>
        )}
        {shouldShowSelectedListShareAction(list.id, selected ? list.id : undefined) && (
          <button
            className="wordlist-share-button"
            type="button"
            aria-label={shareLabel}
            onClick={event => {
              event.stopPropagation();
              onShare(list);
            }}
          >
            <Share2 size={17} strokeWidth={1.9} aria-hidden="true" />
          </button>
        )}
      </span>
    </div>
  );
});

function getWordListStageLabel(stage: string, t: Translate) {
  if (stage === 'Foundations') return t('wordLists.stageFoundations');
  if (stage === 'Core') return t('wordLists.stageCore');
  if (stage === 'Spelling') return t('wordLists.stageSpelling');
  if (stage === 'Usage') return t('wordLists.stageUsage');
  if (stage === 'Mixed') return t('wordLists.stageMixed');
  if (stage === 'Review') return t('wordLists.stageReview');
  if (stage === 'Confidence') return t('wordLists.stageConfidence');
  return stage;
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function WordListShareView({
  list,
  displayName,
  onBack,
  onClose,
  t
}: {
  list: WordList;
  displayName: string;
  onBack: () => void;
  onClose: () => void;
  t: Translate;
}) {
  const [practiceTestLink, setPracticeTestLink] = useState(false);
  const shareUrl = useMemo(() => getWordListCanonicalUrl(list, undefined, { practiceTest: practiceTestLink }), [list, practiceTestLink]);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [largeQrOpen, setLargeQrOpen] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const shareNavigator = navigator as ShareDataNavigator;
    if (typeof shareNavigator.share !== 'function') return;
    const shareData = { title: displayName, text: t('wordLists.shareNativeText'), url: shareUrl };
    setCanNativeShare(typeof shareNavigator.canShare === 'function' ? shareNavigator.canShare(shareData) : true);
  }, [displayName, shareUrl, t]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  async function copyShareUrl() {
    await copyTextToClipboard(shareUrl);
    setCopied(true);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      copyTimerRef.current = null;
    }, COPY_STATUS_VISIBLE_MS);
  }

  async function shareNative() {
    const shareNavigator = navigator as ShareDataNavigator;
    if (typeof shareNavigator.share !== 'function') return;
    await shareNavigator.share({ title: displayName, text: t('wordLists.shareNativeText'), url: shareUrl });
  }

  return (
    <>
      <div className="wordlist-share-header">
        <button className="wordlist-share-nav-button" type="button" onClick={onBack} aria-label={t('wordLists.back')}>
          <ArrowLeft size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <button className="wordlist-share-nav-button" type="button" onClick={onClose} aria-label={t('wordLists.close')}>
          <X size={24} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <div className="wordlist-share-body">
        <div className="wordlist-share-intro">
          <h2 className="modal-title">{t('wordLists.shareThisWordList')}</h2>
          <p>{displayName}</p>
        </div>

        <div className="wordlist-share-layout">
          <section className="wordlist-share-qr-section" aria-labelledby="wordlist-share-qr-title">
            <h3 id="wordlist-share-qr-title" className="group-title">{t('wordLists.qrCode')}</h3>
            <button className="wordlist-share-qr-card" type="button" onClick={() => setLargeQrOpen(true)}>
              <QRCodeSVG value={shareUrl} size={208} marginSize={2} className="wordlist-share-qr" />
              <span>{t('wordLists.scanToOpenList')}</span>
            </button>
          </section>

          <section className="wordlist-share-link-section" aria-labelledby="wordlist-share-link-title">
            <h3 id="wordlist-share-link-title" className="group-title">{t('wordLists.shareLink')}</h3>
            <div className="wordlist-share-link-box">
              <a href={shareUrl} target="_blank" rel="noreferrer">{shareUrl}</a>
              <button className="wordlist-copy-button" type="button" onClick={copyShareUrl}>
                <Copy size={18} strokeWidth={2} aria-hidden="true" />
                {copied ? t('wordLists.linkCopied') : t('wordLists.copyLink')}
              </button>
            </div>
            {canNativeShare && (
              <button className="wordlist-native-share-button" type="button" onClick={shareNative}>
                <Share2 size={18} strokeWidth={2} aria-hidden="true" />
                {t('wordLists.share')}
              </button>
            )}
            <label className="wordlist-practice-test-option">
              <input
                type="checkbox"
                checked={practiceTestLink}
                onChange={event => setPracticeTestLink(event.target.checked)}
              />
              <span>
                <b>{t('wordLists.practiceTest')}</b>
                <small>{t('wordLists.practiceTestHelper')}</small>
              </span>
            </label>
          </section>
        </div>

        <div className="wordlist-share-privacy-panel">
          <span className="wordlist-share-privacy-icon" aria-hidden="true">
            <ShieldCheck size={27} strokeWidth={1.9} />
          </span>
          <div>
            <h3>{t('wordLists.safeAndPrivate')}</h3>
            <p>{t('wordLists.sharePrivacyBody')}</p>
          </div>
        </div>
      </div>

      {largeQrOpen && (
        <LargeWordListQrOverlay
          listName={displayName}
          shareUrl={shareUrl}
          onClose={() => setLargeQrOpen(false)}
          t={t}
        />
      )}
    </>
  );
}

function LargeWordListQrOverlay({
  listName,
  shareUrl,
  onClose,
  t
}: {
  listName: string;
  shareUrl: string;
  onClose: () => void;
  t: Translate;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  useEffect(() => {
    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus({ preventScroll: true });

    return () => {
      if (previousActiveElement?.isConnected) previousActiveElement.focus({ preventScroll: true });
    };
  }, []);

  const overlay = (
    <div className="wordlist-large-qr-overlay" role="dialog" aria-modal="true" aria-label={t('wordLists.scanToOpenList')}>
      <div className="wordlist-large-qr-card">
        <button ref={closeButtonRef} className="wordlist-large-qr-close" type="button" onClick={onClose} aria-label={t('wordLists.close')}>
          <X size={24} strokeWidth={2.1} aria-hidden="true" />
          <span>{t('wordLists.close')}</span>
        </button>
        <div className="wordlist-large-qr-heading">
          <p>{t('wordLists.scanToOpenList')}</p>
          <h2>{listName}</h2>
        </div>
        <QRCodeSVG value={shareUrl} size={520} marginSize={3} className="wordlist-large-qr" />
        <a href={shareUrl} target="_blank" rel="noreferrer" className="wordlist-large-qr-url">{shareUrl}</a>
      </div>
    </div>
  );

  const portalTarget = document.querySelector('.public-app') ?? document.body;
  return createPortal(overlay, portalTarget);
}

export function WordListModal({
  lists,
  initialSelectedIds,
  completedListIds = [],
  onClose,
  onDone,
  onSuggestWordList,
  interfaceLanguage,
  t
}: {
  lists: WordList[];
  initialSelectedIds: string[];
  completedListIds?: string[];
  onClose: () => void;
  onDone: (selectedIds: string[]) => void;
  onSuggestWordList?: () => void;
  interfaceLanguage: InterfaceLanguage;
  t: Translate;
}) {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => normalizeSingleSelectedListIds(initialSelectedIds, lists));
  const [shareList, setShareList] = useState<WordList | null>(null);
  const selectedId = selectedIds[0];
  const completedSet = useMemo(() => new Set(completedListIds), [completedListIds]);
  const filteredLists = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return lists;
    return lists.filter(list => {
      const displayName = getListDisplayName(list, interfaceLanguage);
      const displayDescription = getListDisplayDescription(list, interfaceLanguage);
      return `${displayName} ${displayDescription} ${list.name} ${list.description}`.toLowerCase().includes(normalizedQuery);
    });
  }, [interfaceLanguage, lists, query]);
  const groups = useMemo(() => {
    return filteredLists.reduce<Record<string, Record<string, WordList[]>>>((acc, list) => {
      const collectionName = list.collection?.name ?? 'Spelio Core Welsh';
      const collection = (acc[collectionName] ??= {});
      (collection[list.stage] ??= []).push(list);
      return acc;
    }, {});
  }, [filteredLists]);
  const showCollections = Object.keys(groups).length > 1;
  const singleCollectionStageGroups = Object.values(groups)[0] ?? {};

  const selectList = useCallback((listId: string) => {
    setSelectedIds(selectSingleWordList(listId));
  }, []);

  const closeShareView = useCallback(() => setShareList(null), []);

  return (
    <Overlay className="wordlist-overlay">
      <section className={`modal modal-wide modal-accent wordlist-modal ${shareList ? 'wordlist-share-mode' : ''}`}>
        {shareList ? (
          <WordListShareView
            list={shareList}
            displayName={getListDisplayName(shareList, interfaceLanguage)}
            onBack={closeShareView}
            onClose={onClose}
            t={t}
          />
        ) : (
          <>
            <div className="modal-header flex items-start justify-between gap-4">
              <div>
                <h2 className="modal-title">{t('wordLists.title')}</h2>
              </div>
              <button className="modal-close" onClick={onClose} aria-label={t('wordLists.close')}>×</button>
            </div>

            <div className="wordlist-body">
              <input className="search-input" placeholder={t('wordLists.searchPlaceholder')} value={query} onChange={event => setQuery(event.target.value)} />

              <div className="list-grid">
                {!showCollections && Object.entries(singleCollectionStageGroups).map(([group, groupLists]) => (
                  <div key={group}>
                    <h3 className="group-title">{getWordListStageLabel(group, t)}</h3>
                    {groupLists.map(list => {
                      const displayName = getListDisplayName(list, interfaceLanguage);
                      return (
                        <WordListRow
                          key={list.id}
                          list={list}
                          displayName={displayName}
                          selected={selectedId === list.id}
                          completed={completedSet.has(list.id)}
                          completedLabel={t('wordLists.completed')}
                          shareLabel={`${t('wordLists.shareWordList')} - ${displayName}`}
                          onSelect={selectList}
                          onShare={setShareList}
                        />
                      );
                    })}
                  </div>
                ))}
                {showCollections && Object.entries(groups).map(([collectionName, stageGroups]) => (
                  <div key={collectionName} className={showCollections ? 'collection-group' : undefined}>
                    <h3 className="collection-title">{collectionName}</h3>
                    {Object.entries(stageGroups).map(([group, groupLists]) => (
                      <div key={`${collectionName}-${group}`} className="stage-group">
                        <h4 className="group-title">{getWordListStageLabel(group, t)}</h4>
                        {groupLists.map(list => {
                          const displayName = getListDisplayName(list, interfaceLanguage);
                          return (
                            <WordListRow
                              key={list.id}
                              list={list}
                              displayName={displayName}
                              selected={selectedId === list.id}
                              completed={completedSet.has(list.id)}
                              completedLabel={t('wordLists.completed')}
                              shareLabel={`${t('wordLists.shareWordList')} - ${displayName}`}
                              onSelect={selectList}
                              onShare={setShareList}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {onSuggestWordList && (
                <p className="wordlist-suggestion">
                  <span>{t('wordLists.suggestionPrompt')}</span>
                  <button className="wordlist-suggestion-link" type="button" onClick={onSuggestWordList}>
                    {t('wordLists.suggestionLink')}
                  </button>
                </p>
              )}
            </div>

            <div className="wordlist-footer sticky-done">
              <div className="done-row wordlist-actions">
                <button className="done-button" onClick={() => onDone(selectedIds)}>{t('wordLists.done')}</button>
              </div>
            </div>
          </>
        )}
      </section>
    </Overlay>
  );
}
