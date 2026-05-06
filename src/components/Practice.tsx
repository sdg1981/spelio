import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent, PointerEvent, ReactNode } from 'react';
import { CircleX, Eye, MessageSquareQuote, Settings, Volume2 } from './Icons';
import { Footer } from './Footer';
import { usePracticeSession } from '../hooks/usePracticeSession';
import type { PracticeWord, WordList } from '../data/wordLists';
import type { SessionResult, SpelioSettings, SpelioStorage } from '../lib/practice/storage';

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
  activeIndex,
  layoutClass = '',
  wordComplete = false
}: {
  word: string;
  letters: Array<{ value: string; revealed?: boolean; wrong?: boolean }>;
  wrongIndex: number | null;
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
              const hasValue = Boolean(slot?.value);
              const isMistake = wrongIndex === index || slot?.wrong;

              return (
                <span
                  key={`${index}-${slot?.value || 'empty'}-${slot?.revealed ? 'revealed' : 'typed'}-${isMistake ? 'wrong' : 'ok'}`}
                  className={`letter-slot ${!hasValue ? 'empty' : ''} ${activeIndex === index ? 'active' : ''} ${isMistake ? 'mistake' : ''} ${hasValue && !isMistake ? 'filled' : ''} ${hasValue && !isMistake && slot?.revealed ? 'revealed' : ''} ${hasValue && !isMistake && !slot?.revealed ? 'typed' : ''}`}
                  style={wordComplete ? { '--letter-wave-delay': `${animationIndex * 20}ms` } as CSSProperties : undefined}
                >
                  {slot?.value || '_'}
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


export function Practice({
  lists,
  storage,
  reviewDifficult = false,
  onStorageChange,
  onComplete,
  onBackHome,
  onWordListsDone,
  onResetProgress,
  initialModal = null
}: {
  lists: WordList[];
  storage: SpelioStorage;
  reviewDifficult?: boolean;
  onStorageChange: (next: SpelioStorage) => void;
  onComplete: (result: SessionResult, nextStorage: SpelioStorage) => void;
  onBackHome: () => void;
  onWordListsDone: (selectedIds: string[]) => void;
  onResetProgress: () => void;
  initialModal?: 'settings' | 'wordlist' | null;
}) {
  const [modal, setModal] = useState<'wordlist' | null>(initialModal === 'wordlist' ? initialModal : null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const mobileKeyboardEnabledRef = useRef(false);
  const settingsModalOpenRef = useRef(initialModal === 'settings');
  const localStatusTimerRef = useRef<number | null>(null);
  const [isPeeking, setIsPeeking] = useState(false);
  const [peekUsedForCurrentWord, setPeekUsedForCurrentWord] = useState(false);
  const peekTimerRef = useRef<number | null>(null);
  const peekAutoHideTimerRef = useRef<number | null>(null);
  const peekActivatedRef = useRef(false);
  const isPeekingRef = useRef(false);
  const spaceHoldStartedRef = useRef(false);
  const revealHandledByPointerRef = useRef(false);
  const englishHandledByPointerRef = useRef(false);

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
    activeIndex,
    isComplete,
    stats,
    progressValue,
    progressCount,
    hasWords,
    handleInput,
    revealNext,
    markCurrentWordRevealed,
    playAudio
  } = usePracticeSession({ lists, storage, reviewDifficult, onStorageChange, onComplete });

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
      if (showMemoryStatus) showLocalStatus('Now try from memory');
    }

    if (restoreFocus) restorePracticeInputFocus();
  }, [clearPeekTimers, restorePracticeInputFocus]);

  const activatePeek = useCallback(() => {
    if (!currentWord || isComplete || modal || settingsModalOpenRef.current) return;

    peekActivatedRef.current = true;

    if (peekUsedForCurrentWord) {
      showLocalStatus('Peek used');
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

  const beginPeekHold = useCallback(() => {
    if (!currentWord || isComplete || modal || settingsModalOpenRef.current) return;

    clearPeekTimers();
    peekActivatedRef.current = false;
    peekTimerRef.current = window.setTimeout(activatePeek, 300);
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

  useEffect(() => {
    return () => {
      if (localStatusTimerRef.current) window.clearTimeout(localStatusTimerRef.current);
      clearPeekTimers();
    };
  }, [clearPeekTimers]);

  useEffect(() => {
    isPeekingRef.current = isPeeking;
  }, [isPeeking]);

  useEffect(() => {
    clearPeekTimers();
    const wasPeeking = isPeekingRef.current;
    peekActivatedRef.current = false;
    isPeekingRef.current = false;
    setIsPeeking(false);
    setPeekUsedForCurrentWord(false);
    if (wasPeeking) restorePracticeInputFocus();
  }, [clearPeekTimers, currentWord?.id, restorePracticeInputFocus]);

  useEffect(() => {
    if (modal || isComplete || settingsModalOpenRef.current) {
      finishPeek(false);
      peekActivatedRef.current = false;
    }
  }, [finishPeek, isComplete, modal]);

  useEffect(() => {
    if (status) setLocalStatus(null);
  }, [status]);

  useEffect(() => {
    function isControlTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(target.closest('input, textarea, select, button, [contenteditable="true"]'));
    }

    function onKeyDown(event: KeyboardEvent) {
      if (modal || settingsModalOpenRef.current || isComplete) return;
      if (isControlTarget(event.target)) return;

      if (event.code === 'Space') {
        event.preventDefault();
        if (!event.repeat && !spaceHoldStartedRef.current) {
          spaceHoldStartedRef.current = true;
          beginPeekHold();
        }
        return;
      }

      if (event.code === 'ArrowRight') {
        event.preventDefault();
        revealNext();
        return;
      }

      if (event.key.length === 1 && /[a-zA-ZÀ-žŵŷŴŶ'’‘`´ʻ\-–—‑]/.test(event.key)) {
        handleInput(event.key);
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.code !== 'Space' || isControlTarget(event.target)) return;

      event.preventDefault();
      const didPeek = peekActivatedRef.current;
      endPeekHold();
      spaceHoldStartedRef.current = false;

      if (!didPeek && !modal && !settingsModalOpenRef.current && !isComplete) {
        playAudio();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [beginPeekHold, endPeekHold, handleInput, isComplete, modal, playAudio, revealNext]);

  useEffect(() => {
    if (!currentWord || isComplete || modal || !shouldUseMobileKeyboard()) return;

    const timer = window.setTimeout(() => {
      focusMobileInput();
    }, 80);

    return () => window.clearTimeout(timer);
  }, [currentWord?.id, isComplete, modal]);

  const currentWordComplete = currentWord ? findIncompleteLetterIndex(currentWord.welshAnswer, letters) < 0 : false;

  useEffect(() => {
    if (currentWordComplete) finishPeek(false);
  }, [currentWordComplete, finishPeek]);

  const updateSettings = useCallback((patch: Partial<SpelioSettings>) => {
    const nextSettings = { ...storage.settings, ...patch };
    const hasChanged = Object.keys(patch).some(key => {
      const settingKey = key as keyof SpelioSettings;
      return storage.settings[settingKey] !== nextSettings[settingKey];
    });

    if (!hasChanged) return;
    onStorageChange({ ...storage, settings: nextSettings });
  }, [onStorageChange, storage]);

  const handleSettingsModalOpenChange = useCallback((open: boolean) => {
    settingsModalOpenRef.current = open;
    if (open) {
      finishPeek(false, false);
      blurMobileInput();
      peekActivatedRef.current = false;
    } else {
      restorePracticeInputFocus();
    }
  }, [finishPeek, restorePracticeInputFocus]);

  function applyWordLists(selectedIds: string[]) {
    const fallback = lists[0] ? [lists[0].id] : [];
    const ids = selectedIds.length ? selectedIds : fallback;
    const changed = ids.length !== storage.selectedListIds.length || ids.some((id, index) => id !== storage.selectedListIds[index]);

    if (!changed) {
      setModal(null);
      return;
    }

    onWordListsDone(ids);
  }

  function handleRevealLetter(event?: MouseEvent<HTMLButtonElement>) {
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
    if (shouldUseMobileKeyboard()) {
      event.preventDefault();
      focusMobileInput();
    }

    beginPeekHold();
  }

  function handleRevealPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const didPeek = peekActivatedRef.current;
    endPeekHold();
    revealHandledByPointerRef.current = true;

    if (!didPeek) {
      revealNext();
      event.currentTarget.blur();
      restorePracticeInputFocus();
    }
  }

  function showLocalStatus(message: string) {
    setLocalStatus(message);
    if (localStatusTimerRef.current) window.clearTimeout(localStatusTimerRef.current);
    localStatusTimerRef.current = window.setTimeout(() => setLocalStatus(null), 1500);
  }

  function toggleEnglishPrompt() {
    const nextVisible = !storage.settings.englishVisible;
    updateSettings({ englishVisible: nextVisible });
    showLocalStatus(nextVisible ? 'English on' : 'English off');
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

  function handleWordPillClick() {
    playAudio();
    if (shouldUseMobileKeyboard()) {
      window.setTimeout(focusMobileInput, 40);
    }
  }

  if (!hasWords || !currentWord) {
    return (
      <main className="app-bg practice-app relative overflow-hidden">
        <Progress value={0} count="0 / 0" />
        <button className="practice-mark-button" onClick={onBackHome} aria-label="Back to home">
          <span>S<span aria-hidden="true">_</span></span>
        </button>
        <section className="page-shell practice-shell">
          <div className="status-line">Select a word list to begin</div>
          <button className="done-button mt-10" onClick={() => setModal('wordlist')}>Select word list</button>
          <button className="clear-button mt-8" onClick={onBackHome}>Back to home</button>
          <Footer className="home-footer" variant="home" />
        </section>
        {modal === 'wordlist' && (
          <WordListModal
            lists={lists}
            initialSelectedIds={storage.selectedListIds}
            onClose={() => setModal(null)}
            onDone={applyWordLists}
          />
        )}
      </main>
    );
  }

  const answerLayoutClass = getAnswerLayoutClass(currentWord.welshAnswer);
  const wordComplete = currentWordComplete;
  const displayStatus = status ?? localStatus;
  const displayTone = status ? statusTone : 'neutral';
  const wordInsights = [currentWord.dialectNote, currentWord.usageNote]
    .map(note => note?.trim())
    .filter((note): note is string => Boolean(note));

  return (
    <main className="app-bg practice-app relative overflow-hidden">
      <Progress value={isComplete ? 100 : progressValue} count={isComplete ? `${stats.total} / ${stats.total}` : progressCount} />
      <button className="practice-mark-button" onClick={onBackHome} aria-label="Back to home">
        <span>S<span aria-hidden="true">_</span></span>
      </button>

      <SettingsLauncher
        settings={storage.settings}
        onChange={updateSettings}
        onOpenChange={handleSettingsModalOpenChange}
        onResetProgress={onResetProgress}
        initiallyOpen={initialModal === 'settings'}
      />

      <section className="page-shell practice-shell">
        <button className="word-pill" onClick={handleWordPillClick}>
          <Volume2 className="text-[#d90000]" size={24} />
          {storage.settings.englishVisible && <span>{currentWord.englishPrompt}</span>}
        </button>
        {currentWord.dialect !== 'Both' && (
          <div className="dialect-label">{currentWord.dialect === 'North Wales' ? 'North Wales form' : currentWord.dialect === 'South Wales / Standard' || currentWord.dialect === 'Standard' ? 'South Wales / Standard form' : 'Dialect-specific form'}</div>
        )}
        {wordInsights.length > 0 && (
          <div className="word-insight" aria-label="Word insight">
            {wordInsights.map(note => (
              <span key={note}>{note}</span>
            ))}
          </div>
        )}

        <input
          ref={mobileInputRef}
          value=""
          onChange={(event) => {
            if (!mobileKeyboardEnabledRef.current || !shouldUseMobileKeyboard()) {
              event.target.value = '';
              return;
            }

            const value = event.target.value;
            const char = value[value.length - 1];
            if (char) handleInput(char);
            event.target.value = '';
          }}
          inputMode="text"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Type Welsh answer"
          onBlur={() => {
            mobileKeyboardEnabledRef.current = false;
          }}
          className="mobile-practice-input"
        />

        <div
          onClick={focusMobileInput}
          className="letter-input-tap-zone"
        >
          <LetterSlots word={currentWord.welshAnswer} letters={letters} wrongIndex={wrongIndex} activeIndex={activeIndex} layoutClass={answerLayoutClass} wordComplete={wordComplete} />
          <GhostAnswer answer={currentWord.welshAnswer} layoutClass={answerLayoutClass} visible={isPeeking} />
        </div>

        <AnimatedStatusLine status={displayStatus} tone={displayTone} />

        <div className="utility-bar">
          <button
            onClick={handleEnglishToggle}
            onPointerDown={handleEnglishPointerDown}
            onPointerUp={handleEnglishPointerUp}
            aria-label="Toggle English prompt"
            aria-pressed={storage.settings.englishVisible}
          >
            <MessageSquareQuote size={22} />
            {storage.settings.englishVisible && <span className="english-toggle-label">English</span>}
          </button>

          <button
            className="reveal-button"
            aria-label="Reveal next letter"
            onPointerDown={handleRevealPointerDown}
            onPointerUp={handleRevealPointerUp}
            onPointerCancel={endPeekHold}
            onPointerLeave={endPeekHold}
            onContextMenu={(event) => event.preventDefault()}
            onClick={handleRevealLetter}
          >
            <Eye size={23} />
            <span>REVEAL</span>
          </button>
        </div>

        <Footer className="home-footer" variant="home" />
      </section>

      {modal === 'wordlist' && (
        <WordListModal
          lists={lists}
          initialSelectedIds={storage.selectedListIds}
          onClose={() => setModal(null)}
          onDone={applyWordLists}
        />
      )}
    </main>
  );
}

function findIncompleteLetterIndex(answer: string, letters: Array<{ value: string }>) {
  return answer.split('').findIndex((char, index) => char !== ' ' && !letters[index]?.value);
}

function AnimatedStatusLine({
  status,
  tone
}: {
  status: string | null;
  tone: 'success' | 'error' | 'neutral';
}) {
  const [visibleStatus, setVisibleStatus] = useState(status);
  const [visibleTone, setVisibleTone] = useState(tone);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let timer: number | undefined;

    if (status) {
      setVisibleStatus(status);
      setVisibleTone(tone);
      setLeaving(false);
      return undefined;
    }

    if (visibleStatus) {
      setLeaving(true);
      timer = window.setTimeout(() => {
        setVisibleStatus(null);
        setLeaving(false);
      }, 260);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [status, tone, visibleStatus]);

  return (
    <div className={`status-line status-line-${visibleStatus ? visibleTone : tone}`}>
      {visibleStatus && (
        <span className={`status-message ${leaving ? 'leaving' : 'entering'}`} key={visibleStatus}>
          {visibleStatus === 'Incorrect. Try again.' && <CircleX size={22} />}
          {visibleStatus}
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
    <span className={`grid h-6 w-6 place-items-center rounded-full border-2 ${active ? 'border-[#d90000]' : 'border-[#cad0d7]'}`}>
      {active && <span className="h-3 w-3 rounded-full bg-[#d90000]" />}
    </span>
  );
}

const SettingsLauncher = memo(function SettingsLauncher({
  settings,
  onChange,
  onOpenChange,
  onResetProgress,
  initiallyOpen = false
}: {
  settings: SpelioSettings;
  onChange: (patch: Partial<SpelioSettings>) => void;
  onOpenChange: (open: boolean) => void;
  onResetProgress: () => void;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);

  const setModalOpen = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange(nextOpen);
  }, [onOpenChange]);

  return (
    <>
      <button className="settings-cog" onClick={() => setModalOpen(true)} aria-label="Open settings">
        <Settings size={22} />
      </button>
      {open && (
        <SettingsModal
          settings={settings}
          onChange={onChange}
          onClose={() => setModalOpen(false)}
          onResetProgress={onResetProgress}
        />
      )}
    </>
  );
});

function SettingsModal({
  settings,
  onChange,
  onClose,
  onResetProgress
}: {
  settings: SpelioSettings;
  onChange: (patch: Partial<SpelioSettings>) => void;
  onClose: () => void;
  onResetProgress: () => void;
}) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  function handleResetConfirm() {
    setConfirmingReset(false);
    onClose();
    onResetProgress();
  }

  return (
    <Overlay>
      <section className="modal modal-small settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="settings-modal-header flex items-center justify-between">
          <h2 className="modal-title" id="settings-title">Settings</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close settings">×</button>
        </div>

        <div className="settings-modal-body">
          <div>
            <h3 className="text-[16px] md:text-[15px] font-extrabold">Welsh spelling</h3>
            <p className="mt-2 field-note">Choose how strictly Welsh characters are checked.</p>

            <div className="mt-7 space-y-7">
              <button className="flex gap-5 text-left" onClick={() => onChange({ welshSpelling: 'flexible' })}>
                <Radio active={settings.welshSpelling === 'flexible'} />
                <span>
                  <b className="block text-[18px] md:text-[15px]">Flexible (recommended)</b>
                  <span className="mt-2 block field-note">Accepts unaccented and accented characters.</span>
                </span>
              </button>

              <button className="flex gap-5 text-left" onClick={() => onChange({ welshSpelling: 'strict' })}>
                <Radio active={settings.welshSpelling === 'strict'} />
                <span>
                  <b className="block text-[18px] md:text-[15px]">Strict</b>
                  <span className="mt-2 block field-note">Requires correct accents and diacritics.</span>
                </span>
              </button>
            </div>
          </div>

          <div className="mt-10 border-t border-[#edf0f2] pt-8 space-y-8">
            <div className="flex items-center justify-between gap-8">
              <span>
                <b className="block text-[18px] md:text-[15px]">Audio prompts</b>
                <span className="mt-2 block field-note">Play audio when each word appears.</span>
              </span>
              <Toggle active={settings.audioPrompts} onClick={() => onChange({ audioPrompts: !settings.audioPrompts })} />
            </div>

            <div className="flex items-center justify-between gap-8">
              <span>
                <b className="block text-[18px] md:text-[15px]">Sound effects</b>
                <span className="mt-2 block field-note">Play sounds for correct and incorrect answers.</span>
              </span>
              <Toggle active={settings.soundEffects} onClick={() => onChange({ soundEffects: !settings.soundEffects })} />
            </div>
          </div>

          <div className="mt-10 border-t border-[#edf0f2] pt-7">
            <button className="reset-progress-button" onClick={() => setConfirmingReset(true)} type="button">
              Reset progress
            </button>
          </div>
        </div>

        <div className="settings-modal-footer">
          <button className="w-full rounded-[8px] border border-[#dfe4e8] bg-white py-5 text-[22px] md:text-[16px]" onClick={onClose}>Close</button>
        </div>
      </section>

      {confirmingReset && (
        <div className="confirm-layer" role="presentation">
          <section className="modal modal-small reset-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-progress-title">
            <h2 className="modal-title" id="reset-progress-title">Reset progress?</h2>
            <p className="modal-text mt-5">
              This will clear all your progress, settings, and history on this device.
            </p>
            <div className="mt-9 flex justify-end gap-3">
              <button className="confirm-cancel-button" onClick={() => setConfirmingReset(false)} type="button">
                Cancel
              </button>
              <button className="confirm-reset-button" onClick={handleResetConfirm} type="button">
                Reset
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
  checked,
  onToggle
}: {
  list: WordList;
  checked: boolean;
  onToggle: (listId: string) => void;
}) {
  return (
    <label className="check-row">
      <span className="check-left">
        <input
          type="checkbox"
          className="wordlist-checkbox"
          checked={checked}
          onChange={() => onToggle(list.id)}
        />
        <span className="check-name">{list.name}</span>
      </span>
    </label>
  );
});

export function WordListModal({
  lists,
  initialSelectedIds,
  onClose,
  onDone
}: {
  lists: WordList[];
  initialSelectedIds: string[];
  onClose: () => void;
  onDone: (selectedIds: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => initialSelectedIds);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const filteredLists = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return lists;
    return lists.filter(list => list.name.toLowerCase().includes(normalizedQuery));
  }, [lists, query]);
  const groups = useMemo(() => {
    return filteredLists.reduce<Record<string, WordList[]>>((acc, list) => {
      (acc[list.stage] ??= []).push(list);
      return acc;
    }, {});
  }, [filteredLists]);

  const toggleList = useCallback((listId: string) => {
    setSelectedIds(previous => (
      previous.includes(listId)
        ? previous.filter(id => id !== listId)
        : [...previous, listId]
    ));
  }, []);

  return (
    <Overlay className="wordlist-overlay">
      <section className="modal modal-wide modal-accent wordlist-modal">
        <div className="modal-header flex items-start justify-between gap-4">
          <div>
            <h2 className="modal-title">Word Lists</h2>
            <p className="modal-text mt-3">Words will be mixed from all selected lists.</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="wordlist-body">
          <div className="selected-box">Selected: {selectedIds.length} {selectedIds.length === 1 ? 'list' : 'lists'}</div>
          <input className="search-input" placeholder="Search word lists..." value={query} onChange={event => setQuery(event.target.value)} />

          <div className="list-grid">
            {Object.entries(groups).map(([group, groupLists]) => (
              <div key={group}>
                <h3 className="group-title">{group}</h3>
                {groupLists.map(list => (
                  <WordListRow
                    key={list.id}
                    list={list}
                    checked={selectedSet.has(list.id)}
                    onToggle={toggleList}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="done-row sticky-done">
          <button className="clear-button" onClick={() => setSelectedIds([])}>Clear all</button>
          <button className="done-button" onClick={() => onDone(selectedIds)}>Done</button>
        </div>
      </section>
    </Overlay>
  );
}
