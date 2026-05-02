import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Logo } from './Logo';
import { CircleX, CornerDownRight, FileText, List, Settings, Volume2 } from './Icons';
import { usePracticeSession } from '../hooks/usePracticeSession';
import type { PracticeWord, WordList } from '../data/wordLists';
import type { SessionResult, SpelioSettings, SpelioStorage } from '../lib/practice/storage';

export function Progress({ value = 30, count = '3 / 10' }: { value?: number; count?: string }) {
  return (
    <div className="progress-top">
      <div className="progress-track"><div className="progress-fill" style={{ width: `${value}%` }} /></div>
      <div className="progress-count">{count}</div>
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
  layoutClass = ''
}: {
  word: string;
  letters: Array<{ value: string; revealed?: boolean; wrong?: boolean }>;
  wrongIndex: number | null;
  activeIndex: number;
  layoutClass?: string;
}) {
  let globalIndex = 0;

  return (
    <div className={`letter-grid ${layoutClass}`.trim()}>
      {word.split(' ').map((wordPart, wordIndex) => {
        const startIndex = globalIndex;
        globalIndex += wordPart.length + 1;

        return (
          <span key={`${wordPart}-${wordIndex}-${startIndex}`} className="letter-word">
            {wordPart.split('').map((_, localIndex) => {
              const index = startIndex + localIndex;
              const slot = letters[index];

              return (
                <span
                  key={index}
                  className={`letter-slot ${!slot?.value ? 'empty' : ''} ${activeIndex === index ? 'active' : ''} ${wrongIndex === index || slot?.wrong ? 'mistake' : ''}`}
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


export function Practice({
  lists,
  storage,
  reviewDifficult = false,
  onStorageChange,
  onComplete,
  onBackHome,
  initialModal = null
}: {
  lists: WordList[];
  storage: SpelioStorage;
  reviewDifficult?: boolean;
  onStorageChange: (next: SpelioStorage) => void;
  onComplete: (result: SessionResult, nextStorage: SpelioStorage) => void;
  onBackHome: () => void;
  initialModal?: 'settings' | 'wordlist' | null;
}) {
  const [modal, setModal] = useState<'settings' | 'wordlist' | null>(initialModal);
  const [selectedDraft, setSelectedDraft] = useState<string[]>(storage.selectedListIds);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const mobileKeyboardEnabledRef = useRef(false);

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
    playAudio
  } = usePracticeSession({ lists, storage, reviewDifficult, onStorageChange, onComplete });

  useEffect(() => {
    function isControlTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(target.closest('input, textarea, select, button, [contenteditable="true"]'));
    }

    function onKeyDown(event: KeyboardEvent) {
      if (modal || isComplete) return;
      if (isControlTarget(event.target)) return;

      if (event.code === 'Space') {
        event.preventDefault();
        handleInput(' ');
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

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleInput, isComplete, modal, revealNext]);

  useEffect(() => {
    if (!currentWord || isComplete || modal || !shouldUseMobileKeyboard()) return;

    const timer = window.setTimeout(() => {
      focusMobileInput();
    }, 80);

    return () => window.clearTimeout(timer);
  }, [currentWord?.id, isComplete, modal]);

  function updateSettings(patch: Partial<SpelioSettings>) {
    onStorageChange({ ...storage, settings: { ...storage.settings, ...patch } });
  }

  function applyWordLists() {
    const fallback = lists[0] ? [lists[0].id] : [];
    const ids = selectedDraft.length ? selectedDraft : fallback;
    onStorageChange({ ...storage, selectedListIds: ids, currentPathPosition: ids[0] ?? null });
    setModal(null);
  }

  function handleRevealLetter() {
    revealNext();

    if (shouldUseMobileKeyboard()) {
      window.setTimeout(() => {
        focusMobileInput();
      }, 40);
    }
  }

  if (!hasWords || !currentWord) {
    return (
      <main className="app-bg relative overflow-hidden">
        <Progress value={0} count="0 / 0" />
        <section className="page-shell practice-shell">
          <Logo small onClick={onBackHome} />
          <div className="status-line">Select a word list to begin</div>
          <button className="done-button mt-10" onClick={() => setModal('wordlist')}>Select word list</button>
          <button className="clear-button mt-8" onClick={onBackHome}>Back to home</button>
          <p className="footer-copy">© 2025 Spelio</p>
        </section>
        {modal === 'wordlist' && (
          <WordListModal
            lists={lists}
            selectedIds={selectedDraft}
            onSelectedIdsChange={setSelectedDraft}
            onClose={() => setModal(null)}
            onDone={applyWordLists}
          />
        )}
      </main>
    );
  }

  const answerLayoutClass = getAnswerLayoutClass(currentWord.welshAnswer);

  return (
    <main className="app-bg relative overflow-hidden">
      <Progress value={isComplete ? 100 : progressValue} count={isComplete ? `${stats.total} / ${stats.total}` : progressCount} />

      <button className="settings-cog" onClick={() => setModal('settings')} aria-label="Settings">
        <Settings size={22} />
      </button>

      <section className="page-shell practice-shell">
        <Logo small onClick={onBackHome} />

        <button className="word-pill" onClick={playAudio}>
          <Volume2 className="text-[#d90000]" size={24} />
          {storage.settings.englishVisible && <span>{currentWord.englishPrompt}</span>}
        </button>
        {currentWord.dialect !== 'Both' && (
          <div className="dialect-label">{currentWord.dialect === 'North Wales' ? 'North Wales form' : currentWord.dialect === 'South Wales / Standard' || currentWord.dialect === 'Standard' ? 'South Wales / Standard form' : 'Dialect-specific form'}</div>
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

        <div onClick={focusMobileInput} onTouchStart={focusMobileInput} className="letter-input-tap-zone">
          <LetterSlots word={currentWord.welshAnswer} letters={letters} wrongIndex={wrongIndex} activeIndex={activeIndex} layoutClass={answerLayoutClass} />
        </div>

        <div className={`status-line status-line-${statusTone}`}>
          {status === 'Incorrect. Try again.' && (
            <><CircleX size={22} />Incorrect. Try again.</>
          )}
          {status && status !== 'Incorrect. Try again.' && status}
        </div>

        <div className="utility-bar">
          <button onClick={() => updateSettings({ englishVisible: !storage.settings.englishVisible })}>
            <FileText size={22} />
            <span>English</span>
          </button>

          <button onClick={() => {
            setSelectedDraft(storage.selectedListIds);
            setModal('wordlist');
          }}>
            <List size={22} />
            <span>Word list</span>
          </button>

          <button
            onPointerDown={(event) => {
              if (shouldUseMobileKeyboard()) {
                event.preventDefault();
                focusMobileInput();
              }
            }}
            onClick={handleRevealLetter}
          >
            <CornerDownRight size={23} />
            <span>Reveal letter</span>
          </button>
        </div>

        <p className="footer-copy">© 2025 Spelio</p>
      </section>

      {modal === 'settings' && <SettingsModal settings={storage.settings} onChange={updateSettings} onClose={() => setModal(null)} />}
      {modal === 'wordlist' && (
        <WordListModal
          lists={lists}
          selectedIds={selectedDraft}
          onSelectedIdsChange={setSelectedDraft}
          onClose={() => setModal(null)}
          onDone={applyWordLists}
        />
      )}
    </main>
  );
}

function Overlay({ children }: { children: ReactNode }) {
  return <div className="overlay">{children}</div>;
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

function SettingsModal({
  settings,
  onChange,
  onClose
}: {
  settings: SpelioSettings;
  onChange: (patch: Partial<SpelioSettings>) => void;
  onClose: () => void;
}) {
  return (
    <Overlay>
      <section className="modal modal-small">
        <div className="flex items-center justify-between">
          <h2 className="modal-title">Settings</h2>
          <button className="text-[#8c95a0] text-2xl" onClick={onClose}>×</button>
        </div>

        <div className="mt-10">
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

        <div className="mt-10 border-t border-[#edf0f2] pt-8">
          <h3 className="text-[16px] md:text-[15px] font-extrabold">Dialect preference</h3>
          <p className="mt-2 field-note">Choose which Welsh dialect variants appear in practice.</p>

          <div className="mt-7 space-y-6">
            <button className="flex gap-5 text-left" onClick={() => onChange({ dialectPreference: 'mixed' })}>
              <Radio active={settings.dialectPreference === 'mixed'} />
              <span>
                <b className="block text-[18px] md:text-[15px]">Mixed / Both</b>
                <span className="mt-2 block field-note">Includes all eligible variants.</span>
              </span>
            </button>

            <button className="flex gap-5 text-left" onClick={() => onChange({ dialectPreference: 'north' })}>
              <Radio active={settings.dialectPreference === 'north'} />
              <span>
                <b className="block text-[18px] md:text-[15px]">North Wales</b>
                <span className="mt-2 block field-note">Uses North Wales forms where available.</span>
              </span>
            </button>

            <button className="flex gap-5 text-left" onClick={() => onChange({ dialectPreference: 'south-standard' })}>
              <Radio active={settings.dialectPreference === 'south-standard'} />
              <span>
                <b className="block text-[18px] md:text-[15px]">South Wales / Standard</b>
                <span className="mt-2 block field-note">Uses South Wales or standard forms where available.</span>
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

        <button className="mt-10 w-full rounded-[8px] border border-[#dfe4e8] bg-white py-5 text-[22px] md:text-[16px]" onClick={onClose}>Close</button>
      </section>
    </Overlay>
  );
}

function WordListModal({
  lists,
  selectedIds,
  onSelectedIdsChange,
  onClose,
  onDone
}: {
  lists: WordList[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onClose: () => void;
  onDone: () => void;
}) {
  const [query, setQuery] = useState('');
  const filteredLists = useMemo(() => lists.filter(list => list.name.toLowerCase().includes(query.toLowerCase())), [lists, query]);
  const groups = useMemo(() => {
    return filteredLists.reduce<Record<string, WordList[]>>((acc, list) => {
      acc[list.stage] = acc[list.stage] ? [...acc[list.stage], list] : [list];
      return acc;
    }, {});
  }, [filteredLists]);

  function toggleList(listId: string) {
    onSelectedIdsChange(selectedIds.includes(listId) ? selectedIds.filter(id => id !== listId) : [...selectedIds, listId]);
  }

  const Row = ({ list }: { list: WordList }) => {
    const on = selectedIds.includes(list.id);
    return (
      <label className="check-row">
        <span className="check-left">
          <button type="button" className={`fake-check ${on ? 'on' : ''}`} onClick={() => toggleList(list.id)}>{on ? '✓' : ''}</button>
          <button type="button" className="check-name text-left" onClick={() => toggleList(list.id)}>{list.name}</button>
        </span>
        <span className="dialect">{list.dialect}</span>
      </label>
    );
  };

  return (
    <Overlay>
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
                {groupLists.map(list => <Row key={list.id} list={list} />)}
              </div>
            ))}
          </div>
        </div>

        <div className="done-row sticky-done">
          <button className="clear-button" onClick={() => onSelectedIdsChange([])}>Clear all</button>
          <button className="done-button" onClick={onDone}>Done</button>
        </div>
      </section>
    </Overlay>
  );
}
