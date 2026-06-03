import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Share2, ShieldCheck, SquareArrowLeft, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Check, CircleX, Eye, MessageSquareQuote, Repeat, Settings, Trash2, Volume2, VolumeX } from './Icons';
import { SpelioTouchKeyboard } from './SpelioTouchKeyboard';
import { usePracticeSession } from '../hooks/usePracticeSession';
import type { PracticeWord, WordList } from '../data/wordLists';
import { mainWordLists } from '../data/supportWordLists';
import { getAnswer, getPrompt } from '../data/wordLists';
import type { InterfaceLanguage, Translate } from '../i18n';
import type { SessionResult, SpelioSettings, SpelioStorage } from '../lib/practice/storage';
import { DEFAULT_AUDIO_PROVIDER, type DefaultAudioProvider } from '../lib/audioProvider';
import { getFullyCompletedListIds, getInProgressListIds } from '../lib/practice/storage';
import { getListDisplayDescription, getListDisplayName } from '../lib/practice/wordListDisplay';
import { logAudioPlaybackClick } from '../lib/audioPlayback';
import { getEnglishPromptDisplayState, getRecallPauseDelayMs, isAudioUnavailableForPrompt, shouldDelayEnglishPrompt, shouldShowEnglishPrompt } from '../lib/practice/audioAvailability';
import { KEYBOARD_REVEAL_HOLD_DELAY_MS, handleRevealShortcutKeyDown, handleRevealShortcutKeyUp } from '../lib/practice/revealShortcut';
import { getSpellingPatternHint, type SpellingPatternHint } from '../lib/practice/spellingPatternHints';
import { normalizeSingleSelectedListIds, selectSingleWordList } from '../lib/practice/wordListSelection';
import { isCommittedAnswerComplete } from '../lib/practice/inputFlow';
import { detectCustomTouchKeyboardAvailability, detectCustomTouchKeyboardEligibility } from '../lib/practice/touchKeyboard';
import { resetPublicPageScrollToTop } from '../lib/scrollRestoration';
import { getWordListCanonicalUrl, shouldShowSelectedListShareAction } from '../lib/wordListSharing';
import { getPlayableInterfaceAudioUrl, PRACTICE_STRUGGLE_ASSIST_AUDIO_KEY, resolveInterfaceAudioClip, type InterfaceAudioClipRegistry } from '../lib/interfaceAudio';
import { shouldIgnoreGlobalKeyboardShortcut } from '../lib/keyboardShortcuts';
import {
  createStruggleAssistState,
  createStruggleAssistAudioPlan,
  createStruggleAssistEmphasisPlan,
  createStruggleAssistPreAssistPlan,
  createRepeatedIncorrectReplayState,
  hasSeenPracticeStruggleAssist,
  markPracticeStruggleAssistSeen,
  PRACTICE_STRUGGLE_ASSIST_HELPER_AUDIO_FALLBACK_MS,
  PRACTICE_STRUGGLE_ASSIST_HELPER_DELAY_MS,
  PRACTICE_STRUGGLE_ASSIST_HINT_VISIBLE_MS,
  PRACTICE_STRUGGLE_ASSIST_TEXT_EMPHASIS_DELAY_MS,
  registerRepeatedIncorrectReplayAttempt,
  registerStruggleAssistIncorrectAttempt,
  resetRepeatedIncorrectReplayForWord,
  resetStruggleAssistForWord,
  shouldShowStruggleAssistMobileHint,
  shouldShowStruggleAssistShortcutHint,
  shouldStartStruggleAssistHelperInGesture,
  shouldWaitForStruggleAssistHelperAudio,
  type RepeatedIncorrectReplayState,
  type StruggleAssistEmphasisTarget,
  type StruggleAssistState
} from '../lib/practice/struggleAssist';

const SPELLING_HINT_AUDIO_REPLAY_DELAY_MS = 900;
const COPY_STATUS_VISIBLE_MS = 1600;

type RecallPauseVisibility = {
  wordId: string | null;
  visible: boolean;
};

type StruggleAssistGuidanceKind = 'shortcut' | 'mobile';

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
  practiceTestMode = false,
  defaultAudioProvider = DEFAULT_AUDIO_PROVIDER,
  interfaceAudioClips,
  interfaceAudioReady = true,
  disableQuickRecap = false,
  detached = false,
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
  practiceTestMode?: boolean;
  defaultAudioProvider?: DefaultAudioProvider;
  interfaceAudioClips: InterfaceAudioClipRegistry;
  interfaceAudioReady?: boolean;
  disableQuickRecap?: boolean;
  detached?: boolean;
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
  const [customTouchKeyboardActive, setCustomTouchKeyboardActive] = useState(false);
  const [customTouchKeyboardAvailable, setCustomTouchKeyboardAvailable] = useState(false);
  const [keyboardPortalTarget, setKeyboardPortalTarget] = useState<HTMLElement | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(initialModal === 'settings');
  const settingsModalOpenRef = useRef(initialModal === 'settings');
  const localStatusTimerRef = useRef<number | null>(null);
  const spellingHintTimerRef = useRef<number | null>(null);
  const spellingHintAudioReplayTimerRef = useRef<number | null>(null);
  const shownSpellingHintsRef = useRef(new Set<string>());
  const [spellingHint, setSpellingHint] = useState<SpellingPatternHint | null>(null);
  const [isPeeking, setIsPeeking] = useState(false);
  const [isEnglishPromptPeeking, setIsEnglishPromptPeeking] = useState(false);
  const [postAnswerEnglishConfirmationWordId, setPostAnswerEnglishConfirmationWordId] = useState<string | null>(null);
  const [peekUsedForCurrentWord, setPeekUsedForCurrentWord] = useState(false);
  const peekTimerRef = useRef<number | null>(null);
  const peekAutoHideTimerRef = useRef<number | null>(null);
  const englishPromptPeekTimerRef = useRef<number | null>(null);
  const recallPauseTimerRef = useRef<number | null>(null);
  const struggleAssistHelperTimerRef = useRef<number | null>(null);
  const struggleAssistHelperFallbackTimerRef = useRef<number | null>(null);
  const struggleAssistHintTimerRef = useRef<number | null>(null);
  const struggleAssistEmphasisTimerRefs = useRef<number[]>([]);
  const struggleAssistHelperAudioRef = useRef<HTMLAudioElement | null>(null);
  const struggleAssistStateRef = useRef<StruggleAssistState>(createStruggleAssistState(null));
  const repeatedIncorrectReplayStateRef = useRef<RepeatedIncorrectReplayState>(createRepeatedIncorrectReplayState(null));
  const struggleAssistSeenRef = useRef(hasSeenPracticeStruggleAssist(typeof window === 'undefined' ? null : window.localStorage));
  const struggleAssistFallbackShownWordIdRef = useRef<string | null>(null);
  const pendingStruggleAssistHelperWordIdRef = useRef<string | null>(null);
  const recallPauseScheduledWordIdRef = useRef<string | null>(null);
  const [recallPauseVisibility, setRecallPauseVisibility] = useState<RecallPauseVisibility>({ wordId: null, visible: false });
  const [struggleAssistGuidance, setStruggleAssistGuidance] = useState<StruggleAssistGuidanceKind | null>(null);
  const [struggleAssistEmphasis, setStruggleAssistEmphasis] = useState<StruggleAssistEmphasisTarget | null>(null);
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
    if (customTouchKeyboardActive) return;

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
  } = usePracticeSession({
    lists,
    storage,
    sessionStorage,
    reviewDifficult,
    includeRecapDue,
    forceAudioAvailable: practiceTestMode,
    defaultAudioProvider,
    disableQuickRecap,
    detached,
    sessionKey,
    onStorageChange,
    onComplete,
    onPostAnswerEnglishConfirmation: setPostAnswerEnglishConfirmationWordId,
    t
  });
  const completedListIds = useMemo(
    () => getFullyCompletedListIds(storage, lists),
    [lists, storage.listProgress, storage.settings.dialectPreference, storage.wordProgress]
  );
  const inProgressListIds = useMemo(
    () => getInProgressListIds(storage, lists),
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

  const clearPostAnswerEnglishConfirmation = useCallback(() => {
    setPostAnswerEnglishConfirmationWordId(null);
  }, []);

  const clearRecallPauseTimer = useCallback(() => {
    if (recallPauseTimerRef.current) {
      window.clearTimeout(recallPauseTimerRef.current);
      recallPauseTimerRef.current = null;
    }
    recallPauseScheduledWordIdRef.current = null;
  }, []);

  const stopStruggleAssistHelperAudio = useCallback(() => {
    const audio = struggleAssistHelperAudioRef.current;
    if (!audio) return;
    audio.pause();
    audio.onended = null;
    audio.onerror = null;
    try {
      audio.currentTime = 0;
    } catch {
      // Helper audio cleanup is best-effort.
    }
    audio.removeAttribute('src');
    try {
      audio.load();
    } catch {
      // Some browsers reject load() after src cleanup.
    }
    struggleAssistHelperAudioRef.current = null;
  }, []);

  const clearStruggleAssistEmphasis = useCallback(() => {
    for (const timer of struggleAssistEmphasisTimerRefs.current) {
      window.clearTimeout(timer);
    }
    struggleAssistEmphasisTimerRefs.current = [];
    setStruggleAssistEmphasis(null);
  }, []);

  const clearStruggleAssistTimers = useCallback(() => {
    if (struggleAssistHelperTimerRef.current) {
      window.clearTimeout(struggleAssistHelperTimerRef.current);
      struggleAssistHelperTimerRef.current = null;
    }
    if (struggleAssistHelperFallbackTimerRef.current) {
      window.clearTimeout(struggleAssistHelperFallbackTimerRef.current);
      struggleAssistHelperFallbackTimerRef.current = null;
    }
    if (struggleAssistHintTimerRef.current) {
      window.clearTimeout(struggleAssistHintTimerRef.current);
      struggleAssistHintTimerRef.current = null;
    }
    pendingStruggleAssistHelperWordIdRef.current = null;
    setStruggleAssistGuidance(null);
    clearStruggleAssistEmphasis();
    stopStruggleAssistHelperAudio();
  }, [clearStruggleAssistEmphasis, stopStruggleAssistHelperAudio]);

  const restorePracticeInputFocus = useCallback(() => {
    if (shouldUseMobileKeyboard() && !customTouchKeyboardActive) {
      focusMobileInput();
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [customTouchKeyboardActive]);

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

    const currentWordAudioUnavailable = isAudioUnavailableForPrompt(currentWord, audioPlaybackFailedWordIds.has(currentWord.id), defaultAudioProvider);
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

    const assistResult = registerStruggleAssistIncorrectAttempt({
      state: struggleAssistStateRef.current,
      wordId: currentWord.id,
      practiceTestMode,
      alreadySeen: struggleAssistSeenRef.current
    });
    struggleAssistStateRef.current = assistResult.state;
    const currentWordAudioUnavailable = isAudioUnavailableForPrompt(currentWord, audioPlaybackFailedWordIds.has(currentWord.id), defaultAudioProvider);
    const struggleAssistClip = resolveInterfaceAudioClip(interfaceAudioClips, PRACTICE_STRUGGLE_ASSIST_AUDIO_KEY, interfaceLanguage);
    const struggleAssistHelperAudioAvailable = Boolean(getPlayableInterfaceAudioUrl(struggleAssistClip));
    const suppressReplayForHelperAudio =
      assistResult.shouldTrigger &&
      storage.settings.audioPrompts &&
      struggleAssistHelperAudioAvailable;
    const replayResult = registerRepeatedIncorrectReplayAttempt({
      state: repeatedIncorrectReplayStateRef.current,
      wordId: currentWord.id,
      audioPrompts: storage.settings.audioPrompts,
      audioAvailable: !currentWordAudioUnavailable,
      practiceTestMode,
      suppressForHelperAudio: suppressReplayForHelperAudio
    });
    repeatedIncorrectReplayStateRef.current = replayResult.state;
    const preAssistPlan = createStruggleAssistPreAssistPlan({
      incorrectAttempts: assistResult.state.incorrectAttempts,
      audioPrompts: storage.settings.audioPrompts,
      audioAvailable: !currentWordAudioUnavailable,
      keyboardCapable: isKeyboardShortcutHintCapable(),
      practiceTestMode,
      alreadySeen: struggleAssistSeenRef.current
    });
    const didPlayAutomaticReplay = replayResult.shouldReplay || preAssistPlan.includes('replay-word');
    if (didPlayAutomaticReplay) {
      clearScheduledSpellingHintAudioReplay();
      void playAudio({ recordInteraction: false, showUnavailableStatus: false });
    }
    if (preAssistPlan.includes('show-shortcut-hint') || preAssistPlan.includes('show-mobile-guidance')) {
      showStruggleAssistFallbackGuidance(currentWord.id, preAssistPlan.includes('show-shortcut-hint') ? 'shortcut' : 'mobile');
    }
    if (preAssistPlan.includes('emphasize-controls')) {
      scheduleStruggleAssistEmphasis(PRACTICE_STRUGGLE_ASSIST_TEXT_EMPHASIS_DELAY_MS);
    }

    if (assistResult.shouldTrigger) {
      triggerStruggleAssist(currentWord.id);
      return;
    }

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

    if (storage.settings.audioPrompts && !currentWordAudioUnavailable && !didPlayAutomaticReplay) {
      clearScheduledSpellingHintAudioReplay();
      spellingHintAudioReplayTimerRef.current = window.setTimeout(() => {
        spellingHintAudioReplayTimerRef.current = null;
        void playAudio();
      }, SPELLING_HINT_AUDIO_REPLAY_DELAY_MS);
    }
  }, [
    audioPlaybackFailedWordIds,
    clearScheduledSpellingHintAudioReplay,
    clearStruggleAssistTimers,
    currentWord,
    defaultAudioProvider,
    handleInput,
    interfaceAudioClips,
    interfaceLanguage,
    isComplete,
    modal,
    playAudio,
    practiceTestMode,
    practiceAnswer,
    storage.settings.audioPrompts
  ]);

  function isKeyboardShortcutHintCapable() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 521px)').matches;
  }

  function showStruggleAssistFallbackGuidance(wordId: string, kind?: StruggleAssistGuidanceKind, options: { force?: boolean } = {}) {
    const guidanceKind = kind ?? (isKeyboardShortcutHintCapable() ? 'shortcut' : 'mobile');
    const clip = resolveInterfaceAudioClip(interfaceAudioClips, PRACTICE_STRUGGLE_ASSIST_AUDIO_KEY, interfaceLanguage);
    if (practiceTestMode) return;
    if (!options.force) {
      if (guidanceKind === 'shortcut') {
        if (!shouldShowStruggleAssistShortcutHint({
          keyboardCapable: true,
          practiceTestMode,
          audioPrompts: storage.settings.audioPrompts,
          helperAudioAvailable: Boolean(getPlayableInterfaceAudioUrl(clip))
        })) return;
      } else {
        if (!shouldShowStruggleAssistMobileHint({
          practiceTestMode,
          audioPrompts: storage.settings.audioPrompts,
          helperAudioAvailable: Boolean(getPlayableInterfaceAudioUrl(clip))
        })) return;
      }
    }

    struggleAssistFallbackShownWordIdRef.current = wordId;
    setStruggleAssistGuidance(guidanceKind);
    if (struggleAssistHintTimerRef.current) window.clearTimeout(struggleAssistHintTimerRef.current);
    struggleAssistHintTimerRef.current = window.setTimeout(() => {
      setStruggleAssistGuidance(null);
      struggleAssistHintTimerRef.current = null;
    }, PRACTICE_STRUGGLE_ASSIST_HINT_VISIBLE_MS);
  }

  function playStruggleAssistHelperAudio(onGuidanceFinished: (played: boolean) => void) {
    const clip = resolveInterfaceAudioClip(interfaceAudioClips, PRACTICE_STRUGGLE_ASSIST_AUDIO_KEY, interfaceLanguage);
    const playableUrl = getPlayableInterfaceAudioUrl(clip);
    if (!playableUrl) {
      onGuidanceFinished(false);
      return;
    }

    stopStruggleAssistHelperAudio();
    try {
      const audio = new Audio();
      let finished = false;
      const finishGuidance = (played: boolean) => {
        if (finished) return;
        finished = true;
        if (struggleAssistHelperFallbackTimerRef.current) {
          window.clearTimeout(struggleAssistHelperFallbackTimerRef.current);
          struggleAssistHelperFallbackTimerRef.current = null;
        }
        if (struggleAssistHelperAudioRef.current === audio) struggleAssistHelperAudioRef.current = null;
        onGuidanceFinished(played);
      };
      struggleAssistHelperAudioRef.current = audio;
      audio.preload = 'auto';
      audio.src = playableUrl;
      audio.onended = () => finishGuidance(true);
      audio.onerror = () => finishGuidance(false);
      struggleAssistHelperFallbackTimerRef.current = window.setTimeout(() => finishGuidance(true), PRACTICE_STRUGGLE_ASSIST_HELPER_AUDIO_FALLBACK_MS);
      void audio.play().catch(() => {
        finishGuidance(false);
      });
    } catch {
      struggleAssistHelperAudioRef.current = null;
      onGuidanceFinished(false);
    }
  }

  function scheduleStruggleAssistEmphasis(startDelayMs = 0) {
    clearStruggleAssistEmphasis();
    const emphasisPlan = createStruggleAssistEmphasisPlan({ practiceTestMode, startDelayMs });
    for (const step of emphasisPlan) {
      const timer = window.setTimeout(() => {
        setStruggleAssistEmphasis(step.target);
      }, step.delayMs);
      struggleAssistEmphasisTimerRefs.current.push(timer);
    }
  }

  function startStruggleAssistGuidance(wordId: string) {
    const clip = resolveInterfaceAudioClip(interfaceAudioClips, PRACTICE_STRUGGLE_ASSIST_AUDIO_KEY, interfaceLanguage);
    const helperAudioAvailable = Boolean(getPlayableInterfaceAudioUrl(clip));
    const audioPlan = createStruggleAssistAudioPlan({
      audioPrompts: storage.settings.audioPrompts,
      helperAudioAvailable
    });
    const hasSpokenHelper = audioPlan.includes('play-helper');
    const mobileLayout = shouldUseMobileKeyboard();

    if (!hasSpokenHelper && struggleAssistFallbackShownWordIdRef.current !== wordId) {
      showStruggleAssistFallbackGuidance(wordId);
      scheduleStruggleAssistEmphasis(
        PRACTICE_STRUGGLE_ASSIST_TEXT_EMPHASIS_DELAY_MS
      );
    }

    if (!audioPlan.includes('play-helper')) return;

    const playHelper = () => {
      if (!currentWord || currentWord.id !== wordId || modal || settingsModalOpenRef.current || isComplete) return;
      if (!storage.settings.audioPrompts) return;
      playStruggleAssistHelperAudio(played => {
        if (!currentWord || currentWord.id !== wordId || modal || settingsModalOpenRef.current || isComplete) return;
        if (played) {
          scheduleStruggleAssistEmphasis();
          return;
        }
        if (struggleAssistFallbackShownWordIdRef.current !== wordId) {
          showStruggleAssistFallbackGuidance(wordId, undefined, { force: true });
          scheduleStruggleAssistEmphasis(
            PRACTICE_STRUGGLE_ASSIST_TEXT_EMPHASIS_DELAY_MS
          );
        } else {
          scheduleStruggleAssistEmphasis();
        }
      });
    };

    if (shouldStartStruggleAssistHelperInGesture({
      audioPrompts: storage.settings.audioPrompts,
      helperAudioAvailable,
      mobileLayout,
      practiceTestMode
    })) {
      playHelper();
      return;
    }

    struggleAssistHelperTimerRef.current = window.setTimeout(() => {
      struggleAssistHelperTimerRef.current = null;
      playHelper();
    }, PRACTICE_STRUGGLE_ASSIST_HELPER_DELAY_MS);
  }

  function triggerStruggleAssist(wordId: string) {
    struggleAssistSeenRef.current = true;
    markPracticeStruggleAssistSeen(typeof window === 'undefined' ? null : window.localStorage);
    clearStruggleAssistTimers();

    if (shouldWaitForStruggleAssistHelperAudio({
      audioPrompts: storage.settings.audioPrompts,
      interfaceAudioReady,
      practiceTestMode
    })) {
      pendingStruggleAssistHelperWordIdRef.current = wordId;
      return;
    }

    startStruggleAssistGuidance(wordId);
  }

  useEffect(() => {
    if (!interfaceAudioReady) return;
    const wordId = pendingStruggleAssistHelperWordIdRef.current;
    if (!wordId) return;
    pendingStruggleAssistHelperWordIdRef.current = null;
    if (!currentWord || currentWord.id !== wordId || modal || settingsModalOpenRef.current || isComplete) return;
    startStruggleAssistGuidance(wordId);
  }, [currentWord?.id, interfaceAudioClips, interfaceAudioReady, interfaceLanguage, isComplete, modal, practiceTestMode, storage.settings.audioPrompts]);

  useEffect(() => {
    return () => {
      if (localStatusTimerRef.current) window.clearTimeout(localStatusTimerRef.current);
      if (spellingHintTimerRef.current) window.clearTimeout(spellingHintTimerRef.current);
      if (spellingHintAudioReplayTimerRef.current) window.clearTimeout(spellingHintAudioReplayTimerRef.current);
      clearStruggleAssistTimers();
      clearPeekTimers();
      clearEnglishPromptPeek();
      clearPostAnswerEnglishConfirmation();
      clearRecallPauseTimer();
      revealShortcutHeldRef.current = false;
    };
  }, [clearEnglishPromptPeek, clearPeekTimers, clearPostAnswerEnglishConfirmation, clearRecallPauseTimer, clearStruggleAssistTimers]);

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
    clearPostAnswerEnglishConfirmation();
    clearRecallPauseTimer();
    clearStruggleAssistTimers();
    clearSpellingHint();
    struggleAssistStateRef.current = resetStruggleAssistForWord(struggleAssistStateRef.current, currentWord?.id ?? null);
    repeatedIncorrectReplayStateRef.current = resetRepeatedIncorrectReplayForWord(repeatedIncorrectReplayStateRef.current, currentWord?.id ?? null);
    struggleAssistFallbackShownWordIdRef.current = null;
    setRecallPauseVisibility({ wordId: currentWord?.id ?? null, visible: false });
    shownSpellingHintsRef.current = new Set();
    setPeekUsedForCurrentWord(false);
    revealShortcutHeldRef.current = false;
    if (wasPeeking) restorePracticeInputFocus();
  }, [clearEnglishPromptPeek, clearPeekTimers, clearPostAnswerEnglishConfirmation, clearRecallPauseTimer, clearSpellingHint, clearStruggleAssistTimers, currentWord?.id, restorePracticeInputFocus]);

  useEffect(() => {
    if (modal || isComplete || settingsModalOpenRef.current) {
      finishPeek(false);
      clearEnglishPromptPeek();
      clearPostAnswerEnglishConfirmation();
      clearRecallPauseTimer();
      if (currentWord) setRecallPauseVisibility({ wordId: currentWord.id, visible: true });
      if (isComplete) clearSpellingHint();
      clearStruggleAssistTimers();
      peekActivatedRef.current = false;
      revealShortcutHeldRef.current = false;
    }
  }, [clearEnglishPromptPeek, clearPostAnswerEnglishConfirmation, clearRecallPauseTimer, clearSpellingHint, clearStruggleAssistTimers, currentWord?.id, finishPeek, isComplete, modal]);

  useEffect(() => {
    struggleAssistSeenRef.current = hasSeenPracticeStruggleAssist(typeof window === 'undefined' ? null : window.localStorage);
  }, []);

  useEffect(() => {
    setKeyboardPortalTarget(document.querySelector('.public-app') ?? document.body);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateEligibility = () => {
      const available = detectCustomTouchKeyboardAvailability();
      const eligible = available && detectCustomTouchKeyboardEligibility(storage.settings.customTouchKeyboard);
      setCustomTouchKeyboardAvailable(previous => previous === available ? previous : available);
      setCustomTouchKeyboardActive(previous => previous === eligible ? previous : eligible);
    };
    const restoreAfterVisibilityReturn = () => {
      if (document.visibilityState === 'hidden') return;
      updateEligibility();
    };
    const mediaQueries = [
      window.matchMedia('(pointer: coarse)'),
      window.matchMedia('(hover: none)'),
      window.matchMedia('(forced-colors: active)')
    ];

    updateEligibility();
    window.addEventListener('resize', updateEligibility);
    window.addEventListener('focus', restoreAfterVisibilityReturn);
    window.addEventListener('pageshow', restoreAfterVisibilityReturn);
    document.addEventListener('visibilitychange', restoreAfterVisibilityReturn);
    for (const query of mediaQueries) query.addEventListener('change', updateEligibility);

    return () => {
      window.removeEventListener('resize', updateEligibility);
      window.removeEventListener('focus', restoreAfterVisibilityReturn);
      window.removeEventListener('pageshow', restoreAfterVisibilityReturn);
      document.removeEventListener('visibilitychange', restoreAfterVisibilityReturn);
      for (const query of mediaQueries) query.removeEventListener('change', updateEligibility);
    };
  }, [storage.settings.customTouchKeyboard]);

  useEffect(() => {
    if (!customTouchKeyboardActive) return;
    mobileKeyboardEnabledRef.current = false;
    mobileInputRef.current?.blur();
  }, [customTouchKeyboardActive, currentWord?.id]);

  useEffect(() => {
    if (status) {
      setLocalStatus(null);
      setLocalStatusSecondary(null);
    }
  }, [status]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (modal || settingsModalOpenRef.current || isComplete || !currentWord) return;
      if (shouldIgnoreGlobalKeyboardShortcut(event.target, {
        allowTarget: target => target === mobileInputRef.current,
        ignoreWithinSelector: '.spelio-touch-keyboard-shell'
      })) return;

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
      if (shouldIgnoreGlobalKeyboardShortcut(event.target, {
        allowTarget: target => target === mobileInputRef.current,
        ignoreWithinSelector: '.spelio-touch-keyboard-shell'
      })) return;

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
    if (!currentWord || isComplete || modal || !shouldUseMobileKeyboard() || customTouchKeyboardActive) return;

    const timer = window.setTimeout(() => {
      focusMobileInput();
    }, 80);

    return () => window.clearTimeout(timer);
  }, [currentWord?.id, customTouchKeyboardActive, isComplete, modal]);

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
    const shouldDelay = shouldDelayEnglishPrompt(storage.settings, currentWord, playbackFailed, defaultAudioProvider);
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
    currentWord?.elevenLabsAudioStatus,
    currentWord?.elevenLabsAudioUrl,
    defaultAudioProvider,
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
    setSettingsModalOpen(open);
    if (open) {
      finishPeek(false, false);
      clearRecallPauseTimer();
      clearPostAnswerEnglishConfirmation();
      clearStruggleAssistTimers();
      if (currentWord) setRecallPauseVisibility({ wordId: currentWord.id, visible: true });
      blurMobileInput();
      peekActivatedRef.current = false;
    } else {
      restorePracticeInputFocus();
    }
  }, [clearPostAnswerEnglishConfirmation, clearRecallPauseTimer, currentWord?.id, finishPeek, restorePracticeInputFocus]);

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
    if (nextVisible && currentWord) {
      const nextSettings = { ...storage.settings, englishVisible: true };
      const playbackFailed = audioPlaybackFailedWordIds.has(currentWord.id);
      if (shouldDelayEnglishPrompt(nextSettings, currentWord, playbackFailed, defaultAudioProvider)) {
        clearRecallPauseTimer();
        setRecallPauseVisibility({ wordId: currentWord.id, visible: false });
      }
    }

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

  function useNativeTouchKeyboard() {
    updateSettings({ customTouchKeyboard: false });
    setCustomTouchKeyboardActive(false);

    window.setTimeout(() => {
      if (!shouldUseMobileKeyboard() || modal || settingsModalOpenRef.current || isComplete) return;
      mobileKeyboardEnabledRef.current = true;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      mobileInputRef.current?.focus({ preventScroll: true });
      window.requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
    }, 40);
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
    if (currentWord && isAudioUnavailableForPrompt(currentWord, audioPlaybackFailedWordIds.has(currentWord.id), defaultAudioProvider)) {
      showLocalStatus(t('practice.audioUnavailable'));
      if (shouldUseMobileKeyboard()) {
        window.setTimeout(focusMobileInput, 40);
      }
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
        </section>
        {modal === 'wordlist' && (
          <WordListModal
            lists={lists}
            initialSelectedIds={storage.selectedListIds}
            completedListIds={completedListIds}
            inProgressListIds={inProgressListIds}
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
  const currentWordAudioUnavailable = isAudioUnavailableForPrompt(currentWord, audioPlaybackFailedWordIds.has(currentWord.id), defaultAudioProvider);
  const effectiveEnglishVisible = practiceTestMode ? false : storage.settings.englishVisible;
  const shouldDelayCurrentEnglishPrompt = shouldDelayEnglishPrompt(
    practiceTestMode ? { ...storage.settings, englishVisible: false, recallPause: false } : storage.settings,
    currentWord,
    audioPlaybackFailedWordIds.has(currentWord.id),
    defaultAudioProvider
  );
  const basePromptVisible = practiceTestMode ? false : shouldShowEnglishPrompt(effectiveEnglishVisible, currentWordAudioUnavailable);
  const recallPausePromptReleased =
    !shouldDelayCurrentEnglishPrompt ||
    (recallPauseVisibility.wordId === currentWord.id && recallPauseVisibility.visible);
  const postAnswerEnglishConfirmationVisible = postAnswerEnglishConfirmationWordId === currentWord.id;
  const promptDisplay = getEnglishPromptDisplayState({
    basePromptVisible,
    shouldDelay: shouldDelayCurrentEnglishPrompt,
    delayedVisible: recallPausePromptReleased,
    peeking: isEnglishPromptPeeking || postAnswerEnglishConfirmationVisible
  });
  const promptVisible = promptDisplay.visible;
  const promptDelayed = promptDisplay.reserved;
  const promptUsesRecallPauseShell = promptDelayed || (promptVisible && (shouldDelayCurrentEnglishPrompt || postAnswerEnglishConfirmationVisible));
  const wordPillAudioIconVisible = !currentWordAudioUnavailable;
  const WordPillAudioIcon = storage.settings.audioPrompts ? Repeat : Volume2;
  const wordInsights = !practiceTestMode && interfaceLanguage === 'en'
    ? [currentWord.dialectNote, currentWord.usageNote]
      .map(note => note?.trim())
      .filter((note): note is string => Boolean(note))
    : [];
  const learnerNoteVisible = !practiceTestMode && Boolean(spellingHintText || dialectLabel || wordInsights.length);
  const practiceOverlayOpen = Boolean(modal) || settingsModalOpen;
  const shouldShowCustomKeyboard = customTouchKeyboardActive && !isComplete && !practiceOverlayOpen;

  return (
    <main className={`app-bg practice-app relative ${shouldShowCustomKeyboard ? 'touch-keyboard-active' : 'overflow-hidden'}`.trim()}>
      <Progress value={isComplete ? 100 : progressValue} count={isComplete ? `${stats.total} / ${stats.total}` : progressCount} />
      <PracticeTopNav onBackHome={onBackHome} />

      <section className="page-shell practice-shell">
        <button className={`word-pill ${struggleAssistEmphasis === 'audio' ? 'assist-emphasis assist-emphasis-audio' : ''}`.trim()} onClick={handleWordPillClick}>
          {wordPillAudioIconVisible && <WordPillAudioIcon className="prompt-audio-icon" size={23} />}
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
          autoCapitalize="off"
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
          onClick={shouldShowCustomKeyboard ? undefined : focusMobileInput}
          className="letter-input-tap-zone"
        >
          <LetterSlots word={answer} letters={letters} wrongIndex={wrongIndex} wrongAttempt={wrongAttempt} activeIndex={activeIndex} layoutClass={answerLayoutClass} wordComplete={wordComplete} />
          <GhostAnswer answer={answer} layoutClass={answerLayoutClass} visible={isPeeking} />
        </div>

        <AnimatedStatusLine status={displayStatus} secondaryStatus={displayStatusSecondary} tone={displayTone} />
        <div className={`keyboard-shortcut-hint-shell ${struggleAssistGuidance === 'mobile' ? 'mobile-visible' : ''}`.trim()} aria-live="polite">
          <div className={`keyboard-shortcut-hint contextual-assist-hint ${struggleAssistGuidance === 'mobile' ? 'mobile-assist-hint' : ''} ${struggleAssistGuidance && !practiceTestMode ? 'visible' : ''}`.trim()}>
            {struggleAssistGuidance === 'mobile' ? (
              <span>{t('practice.struggleAssistMobileHint')}</span>
            ) : (
              <>
                <span>{t('practice.struggleAssistDesktopHint')}</span>
                <span className="contextual-assist-shortcut-line">{t('practice.struggleAssistShortcutHint')}</span>
              </>
            )}
          </div>
        </div>

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
              className={`reveal-button ${struggleAssistEmphasis === 'reveal' ? 'assist-emphasis assist-emphasis-reveal' : ''}`.trim()}
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
          showKeyboardPreference={customTouchKeyboardAvailable}
          activePracticeSession={Boolean(currentWord && hasWords && !isComplete)}
          onChange={updateSettings}
          onOpenChange={handleSettingsModalOpenChange}
          onResetProgress={onResetProgress}
          initiallyOpen={initialModal === 'settings'}
          t={t}
        />

      </section>

      {shouldShowCustomKeyboard && keyboardPortalTarget && createPortal(
        <SpelioTouchKeyboard
          answer={answer}
          disabled={false}
          onInput={handlePracticeInput}
          onUseNativeKeyboard={useNativeTouchKeyboard}
          t={t}
        />,
        keyboardPortalTarget
      )}

      {modal === 'wordlist' && (
        <WordListModal
          lists={lists}
          initialSelectedIds={storage.selectedListIds}
          completedListIds={completedListIds}
          inProgressListIds={inProgressListIds}
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
  showKeyboardPreference,
  activePracticeSession,
  onChange,
  onOpenChange,
  onResetProgress,
  initiallyOpen = false,
  t
}: {
  settings: SpelioSettings;
  showKeyboardPreference: boolean;
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
          showKeyboardPreference={showKeyboardPreference}
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
  showKeyboardPreference,
  activePracticeSession,
  onChange,
  onClose,
  onResetProgress,
  t
}: {
  settings: SpelioSettings;
  showKeyboardPreference?: boolean;
  activePracticeSession: boolean;
  onChange: (patch: Partial<SpelioSettings>) => void;
  onClose: () => void;
  onResetProgress: () => void;
  t: Translate;
}) {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [detectedKeyboardPreferenceVisible, setDetectedKeyboardPreferenceVisible] = useState(false);
  const [welshStyleNoticeVisible, setWelshStyleNoticeVisible] = useState(false);
  const keyboardPreferenceVisible = showKeyboardPreference ?? detectedKeyboardPreferenceVisible;

  useEffect(() => {
    if (showKeyboardPreference !== undefined || typeof window === 'undefined') return undefined;

    const updateAvailability = () => {
      setDetectedKeyboardPreferenceVisible(detectCustomTouchKeyboardAvailability());
    };
    const mediaQueries = [
      window.matchMedia('(pointer: coarse)'),
      window.matchMedia('(hover: none)'),
      window.matchMedia('(forced-colors: active)')
    ];

    updateAvailability();
    window.addEventListener('resize', updateAvailability);
    for (const query of mediaQueries) query.addEventListener('change', updateAvailability);

    return () => {
      window.removeEventListener('resize', updateAvailability);
      for (const query of mediaQueries) query.removeEventListener('change', updateAvailability);
    };
  }, [showKeyboardPreference]);

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

          {keyboardPreferenceVisible && (
            <div className="settings-section">
              <h3 className="text-[16px] md:text-[15px] font-extrabold">{t('settings.keyboard')}</h3>
              <p className="mt-2 field-note">{t('settings.keyboardNote')}</p>

              <div className="mt-7 space-y-7">
                <button className="flex gap-5 text-left" onClick={() => onChange({ customTouchKeyboard: true })}>
                  <Radio active={settings.customTouchKeyboard} />
                  <span>
                    <b className="block text-[18px] md:text-[15px]">{t('settings.spelioKeyboard')}</b>
                  </span>
                </button>

                <button className="flex gap-5 text-left" onClick={() => onChange({ customTouchKeyboard: false })}>
                  <Radio active={!settings.customTouchKeyboard} />
                  <span>
                    <b className="block text-[18px] md:text-[15px]">{t('settings.nativeKeyboard')}</b>
                  </span>
                </button>
              </div>
            </div>
          )}

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
  inProgress,
  completedLabel,
  inProgressLabel,
  shareLabel,
  onSelect,
  onShare
}: {
  list: WordList;
  displayName: string;
  selected: boolean;
  completed: boolean;
  inProgress: boolean;
  completedLabel: string;
  inProgressLabel: string;
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
        {!completed && inProgress && (
          <span className="wordlist-in-progress-indicator" title={inProgressLabel} aria-label={inProgressLabel} role="img">
            <span aria-hidden="true" />
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
  onClose,
  showClose = true,
  t
}: {
  list: WordList;
  displayName: string;
  onClose: () => void;
  showClose?: boolean;
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
      {showClose && (
        <div className="wordlist-share-header">
          <button className="wordlist-share-nav-button" type="button" onClick={onClose} aria-label={t('wordLists.close')}>
            <X size={24} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      )}

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

export function WordListSelectorPanel({
  lists,
  initialSelectedIds,
  completedListIds = [],
  inProgressListIds = [],
  onClose,
  onDone,
  onCreateCustomList,
  onSuggestWordList,
  onPageShareBackChange,
  afterListGridContent,
  interfaceLanguage,
  t,
  variant = 'modal'
}: {
  lists: WordList[];
  initialSelectedIds: string[];
  completedListIds?: string[];
  inProgressListIds?: string[];
  onClose: () => void;
  onDone: (selectedIds: string[]) => void;
  onCreateCustomList?: () => void;
  onSuggestWordList?: () => void;
  onPageShareBackChange?: (handler: (() => void) | null) => void;
  afterListGridContent?: ReactNode;
  interfaceLanguage: InterfaceLanguage;
  t: Translate;
  variant?: 'modal' | 'page';
}) {
  const [query, setQuery] = useState('');
  const selectableLists = useMemo(() => mainWordLists(lists), [lists]);
  const [selectedIds, setSelectedIds] = useState(() => normalizeSingleSelectedListIds(initialSelectedIds, selectableLists));
  const [shareList, setShareList] = useState<WordList | null>(null);
  const selectedId = selectedIds[0];
  const completedSet = useMemo(() => new Set(completedListIds), [completedListIds]);
  const inProgressSet = useMemo(() => new Set(inProgressListIds), [inProgressListIds]);
  const filteredLists = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return selectableLists;
    return selectableLists.filter(list => {
      const displayName = getListDisplayName(list, interfaceLanguage);
      const displayDescription = getListDisplayDescription(list, interfaceLanguage);
      return `${displayName} ${displayDescription} ${list.name} ${list.description}`.toLowerCase().includes(normalizedQuery);
    });
  }, [interfaceLanguage, selectableLists, query]);
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

  const listGridId = variant === 'page' ? 'word-list-page-list-grid' : 'word-list-modal-list-grid';
  const searchId = variant === 'page' ? 'word-list-page-search' : 'word-list-modal-search';
  const [pageActionPortalTarget, setPageActionPortalTarget] = useState<Element | null>(null);
  const pageShareReturnScrollRef = useRef<{ left: number; top: number } | null>(null);
  const shouldRestorePageShareScrollRef = useRef(false);

  useEffect(() => {
    if (variant !== 'page') return;
    setPageActionPortalTarget(document.querySelector('.public-app') ?? document.body);
  }, [variant]);

  const openShareList = useCallback((list: WordList) => {
    if (variant === 'page') {
      pageShareReturnScrollRef.current = {
        left: window.scrollX || document.scrollingElement?.scrollLeft || 0,
        top: window.scrollY || document.scrollingElement?.scrollTop || 0
      };
    }

    setShareList(list);
    if (variant === 'page') resetPublicPageScrollToTop();
  }, [variant]);

  const closePageShareList = useCallback(() => {
    if (variant === 'page') shouldRestorePageShareScrollRef.current = true;
    setShareList(null);
  }, [variant]);

  useEffect(() => {
    if (variant !== 'page' || !onPageShareBackChange) return;

    if (!shareList) {
      onPageShareBackChange(null);
      return;
    }

    onPageShareBackChange(closePageShareList);
    return () => onPageShareBackChange(null);
  }, [closePageShareList, onPageShareBackChange, shareList, variant]);

  useEffect(() => {
    if (shareList || !shouldRestorePageShareScrollRef.current) return;
    shouldRestorePageShareScrollRef.current = false;
    const position = pageShareReturnScrollRef.current;
    pageShareReturnScrollRef.current = null;
    if (!position) return;

    window.requestAnimationFrame(() => {
      window.scrollTo({ left: position.left, top: position.top, behavior: 'auto' });
      document.scrollingElement?.scrollTo({ left: position.left, top: position.top, behavior: 'auto' });
    });
  }, [shareList]);

  if (shareList) {
    return (
      <WordListShareView
        list={shareList}
        displayName={getListDisplayName(shareList, interfaceLanguage)}
        onClose={onClose}
        showClose={variant === 'modal'}
        t={t}
      />
    );
  }

  const actionBar = (
    <div className={`wordlist-footer sticky-done ${variant === 'page' ? 'wordlist-page-actions' : ''}`.trim()}>
      <div className="done-row wordlist-actions">
        {onCreateCustomList && (
          <button className="wordlist-custom-list-link" type="button" onClick={onCreateCustomList}>
            {t('customLists.createCta')}
          </button>
        )}
        <button className="done-button" onClick={() => onDone(selectedIds)}>{t('wordLists.done')}</button>
      </div>
    </div>
  );

  return (
    <>
      {variant === 'modal' && (
        <div className="modal-header flex items-start justify-between gap-4">
          <div>
            <h2 className="modal-title">{t('wordLists.title')}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label={t('wordLists.close')}>×</button>
        </div>
      )}

      <div className={`wordlist-body ${variant === 'page' ? 'wordlist-page-body' : ''}`.trim()}>
        <label className="wordlist-search-label" htmlFor={searchId}>{t('wordLists.searchLabel')}</label>
        <input
          id={searchId}
          className="search-input"
          placeholder={t('wordLists.searchPlaceholder')}
          value={query}
          onChange={event => setQuery(event.target.value)}
        />

        <div id={listGridId} className="list-grid">
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
                    inProgress={!completedSet.has(list.id) && inProgressSet.has(list.id)}
                    completedLabel={t('wordLists.completed')}
                    inProgressLabel={t('wordLists.inProgress')}
                    shareLabel={`${t('wordLists.shareWordList')} - ${displayName}`}
                    onSelect={selectList}
                    onShare={openShareList}
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
                        inProgress={!completedSet.has(list.id) && inProgressSet.has(list.id)}
                        completedLabel={t('wordLists.completed')}
                        inProgressLabel={t('wordLists.inProgress')}
                        shareLabel={`${t('wordLists.shareWordList')} - ${displayName}`}
                        onSelect={selectList}
                        onShare={openShareList}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
          {afterListGridContent}
        </div>

        {onSuggestWordList && variant === 'modal' && (
          <p className="wordlist-suggestion">
            <span>{t('wordLists.suggestionPrompt')}</span>
            <button className="wordlist-suggestion-link" type="button" onClick={onSuggestWordList}>
              {t('wordLists.suggestionLink')}
            </button>
          </p>
        )}
      </div>

      {variant === 'page'
        ? pageActionPortalTarget ? createPortal(actionBar, pageActionPortalTarget) : null
        : actionBar}
    </>
  );
}

export function LargeWordListQrOverlay({
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
      if (shouldIgnoreGlobalKeyboardShortcut(event.target)) return;
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
  inProgressListIds = [],
  onClose,
  onDone,
  onCreateCustomList,
  onSuggestWordList,
  interfaceLanguage,
  t
}: {
  lists: WordList[];
  initialSelectedIds: string[];
  completedListIds?: string[];
  inProgressListIds?: string[];
  onClose: () => void;
  onDone: (selectedIds: string[]) => void;
  onCreateCustomList?: () => void;
  onSuggestWordList?: () => void;
  interfaceLanguage: InterfaceLanguage;
  t: Translate;
}) {
  return (
    <Overlay className="wordlist-overlay">
      <section className="modal modal-wide modal-accent wordlist-modal">
        <WordListSelectorPanel
          lists={lists}
          initialSelectedIds={initialSelectedIds}
          completedListIds={completedListIds}
          inProgressListIds={inProgressListIds}
          onClose={onClose}
          onDone={onDone}
          onCreateCustomList={onCreateCustomList}
          onSuggestWordList={onSuggestWordList}
          interfaceLanguage={interfaceLanguage}
          t={t}
          variant="modal"
        />
      </section>
    </Overlay>
  );
}
