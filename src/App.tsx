import { useEffect, useMemo, useRef, useState } from 'react';
import { Home } from './components/Home';
import { Practice, WordListModal } from './components/Practice';
import { EndScreen } from './components/End';
import { LearningMilestoneModal } from './components/LearningMilestoneModal';
import { ScreenTransition } from './components/ScreenTransition';
import { wordLists } from './data/wordLists';
import type { SessionResult, SpelioStorage } from './lib/practice/storage';
import { applyManualWordListSelection, applyPracticeStartListSelection, clearSpelioStorageData, createDefaultStorage, loadSpelioStorage, saveSpelioStorage } from './lib/practice/storage';
import { getRecommendation } from './lib/practice/recommendations';
import { getRecapWordCount, hasDifficultWords } from './lib/practice/sessionEngine';
import { countLearnedSpellings, formatCumulativeProgress } from './lib/practice/progress';
import { checkForMilestone, type Milestone } from './lib/practice/milestones';

type Screen = 'home' | 'practice' | 'end';

function normalizeSelectedListIds(selectedIds: string[]) {
  const fallback = wordLists[0] ? [wordLists[0].id] : [];
  return selectedIds.length ? selectedIds : fallback;
}

function sameListSelection(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

export default function App() {
  const [storage, setStorage] = useState<SpelioStorage>(() => loadSpelioStorage());
  const [screen, setScreen] = useState<Screen>('home');
  const [reviewMode, setReviewMode] = useState(false);
  const [includeRecapDue, setIncludeRecapDue] = useState(false);
  const [wordListModalOpen, setWordListModalOpen] = useState(false);
  const [lastResult, setLastResult] = useState<SessionResult | null>(storage.lastSessionResult);
  const [practiceSessionKey, setPracticeSessionKey] = useState(0);
  const [practiceStartStorage, setPracticeStartStorage] = useState<SpelioStorage | null>(null);
  const [showFirstSessionKeyboardHint, setShowFirstSessionKeyboardHint] = useState(false);
  const [resetStatusVisible, setResetStatusVisible] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);
  const resetStatusTimerRef = useRef<number | null>(null);
  const difficultWords = useMemo(() => hasDifficultWords(storage, wordLists), [storage.settings.dialectPreference, storage.wordProgress]);
  const recapWordCount = useMemo(() => getRecapWordCount(storage, wordLists), [storage.settings.dialectPreference, storage.wordProgress]);
  const recommendation = useMemo(
    () => getRecommendation(storage, wordLists),
    [
      difficultWords,
      storage.currentPathPosition,
      storage.lastSessionResult,
      storage.listProgress,
      storage.settings.dialectPreference,
      storage.selectedListIds
    ]
  );
  const homeProgressSummary = useMemo(
    () => formatCumulativeProgress(storage, wordLists),
    [storage.learningStats, storage.wordProgress]
  );
  const endProgressSummary = useMemo(
    () => formatCumulativeProgress(storage, wordLists, { prefix: 'Total progress' }),
    [storage.learningStats, storage.wordProgress]
  );

  useEffect(() => {
    saveSpelioStorage(storage);
  }, [storage]);

  useEffect(() => {
    if (screen !== 'end' || !lastResult || activeMilestone) return;

    const totalLearnedSpellings = countLearnedSpellings(storage, wordLists);
    setActiveMilestone(checkForMilestone(totalLearnedSpellings, storage.shownMilestones));
  }, [activeMilestone, lastResult, screen, storage.shownMilestones, storage.wordProgress]);

  useEffect(() => {
    return () => {
      if (resetStatusTimerRef.current) window.clearTimeout(resetStatusTimerRef.current);
    };
  }, []);

  function updateStorage(next: SpelioStorage) {
    setStorage(next);
  }

  function startPractice(options?: { review?: boolean; listId?: string; allowRecapReview?: boolean }) {
    const listId = options?.listId;
    const review = Boolean(options?.review);
    const allowRecapReview = Boolean(options?.allowRecapReview);

    if (review && !difficultWords && !(allowRecapReview && recapWordCount > 0)) {
      setReviewMode(false);
      setIncludeRecapDue(false);
      setScreen('home');
      return;
    }

    const nextStorage = {
      ...(review ? storage : applyPracticeStartListSelection(storage, listId)),
      hasStartedPracticeSession: true
    };

    setShowFirstSessionKeyboardHint(!storage.hasStartedPracticeSession);
    setStorage(nextStorage);
    setPracticeStartStorage(nextStorage);
    setPracticeSessionKey(key => key + 1);
    setReviewMode(review);
    setIncludeRecapDue(review && allowRecapReview);
    setScreen('practice');
  }

  function handleComplete(result: SessionResult, nextStorage: SpelioStorage) {
    setLastResult(result);
    setStorage(nextStorage);
    setScreen('end');
  }

  function saveSelectedWordLists(selectedIds: string[]) {
    const ids = normalizeSelectedListIds(selectedIds);
    const changed = !sameListSelection(ids, storage.selectedListIds);

    if (!changed) {
      setWordListModalOpen(false);
      return;
    }

    setStorage(previous => applyManualWordListSelection(previous, ids));
    setReviewMode(false);
    setIncludeRecapDue(false);
    setWordListModalOpen(false);
    setScreen('home');
  }

  function resetProgress() {
    clearSpelioStorageData();
    const freshStorage = createDefaultStorage();

    setStorage(freshStorage);
    setReviewMode(false);
    setIncludeRecapDue(false);
    setWordListModalOpen(false);
    setLastResult(null);
    setShowFirstSessionKeyboardHint(false);
    setActiveMilestone(null);
    setScreen('home');
    setResetStatusVisible(true);

    if (resetStatusTimerRef.current) window.clearTimeout(resetStatusTimerRef.current);
    resetStatusTimerRef.current = window.setTimeout(() => {
      setResetStatusVisible(false);
      resetStatusTimerRef.current = null;
    }, 1800);
  }

  function dismissMilestone() {
    if (!activeMilestone) return;

    setStorage(previous => ({
      ...previous,
      shownMilestones: Array.from(new Set([...previous.shownMilestones, activeMilestone.threshold]))
    }));
    setActiveMilestone(null);
  }

  const homeMode = !storage.lastSessionDate
    ? 'first'
    : storage.lastSessionResult?.state === 'struggled' && difficultWords
      ? 'struggled'
      : 'returning';

  const activeScreen = screen === 'end' && !lastResult ? 'home' : screen;
  const screenContent = activeScreen === 'practice' ? (
    <Practice
      lists={wordLists}
      storage={storage}
      sessionStorage={practiceStartStorage ?? storage}
      reviewDifficult={reviewMode}
      includeRecapDue={includeRecapDue}
      sessionKey={practiceSessionKey}
      showKeyboardHint={showFirstSessionKeyboardHint}
      onStorageChange={updateStorage}
      onComplete={handleComplete}
      onBackHome={() => setScreen('home')}
      onWordListsDone={saveSelectedWordLists}
      onResetProgress={resetProgress}
    />
  ) : activeScreen === 'end' && lastResult ? (
    <>
      <EndScreen
        result={lastResult}
        recommendation={recommendation}
        progressSummary={endProgressSummary}
        hasDifficultWords={difficultWords}
        onContinue={() => {
          startPractice({ review: recommendation.kind === 'review', listId: recommendation.listId });
        }}
        onReview={() => startPractice({ review: true })}
        onChangeLists={() => setWordListModalOpen(true)}
        onHome={() => setScreen('home')}
      />
      {wordListModalOpen && (
        <WordListModal
          lists={wordLists}
          initialSelectedIds={storage.selectedListIds}
          onClose={() => setWordListModalOpen(false)}
          onDone={saveSelectedWordLists}
        />
      )}
    </>
  ) : (
    <>
      <Home
        mode={homeMode}
        recommendation={recommendation}
        progressSummary={homeProgressSummary}
        hasDifficultWords={difficultWords}
        recapWordCount={recapWordCount}
        onStart={() => startPractice({ review: recommendation.kind === 'review', listId: recommendation.listId })}
        onContinue={() => startPractice({ listId: recommendation.listId })}
        onReview={() => startPractice({ review: true })}
        onRecapReview={() => startPractice({ review: true, allowRecapReview: true })}
        onSelectList={() => setWordListModalOpen(true)}
      />
      {wordListModalOpen && (
        <WordListModal
          lists={wordLists}
          initialSelectedIds={storage.selectedListIds}
          onClose={() => setWordListModalOpen(false)}
          onDone={saveSelectedWordLists}
        />
      )}
    </>
  );

  return (
    <>
      <ScreenTransition screen={activeScreen}>
        {screenContent}
      </ScreenTransition>
      <div className={`app-toast ${resetStatusVisible ? 'visible' : ''}`} role="status" aria-live="polite">
        Progress reset — you’re starting fresh
      </div>
      {activeMilestone && activeScreen === 'end' && (
        <LearningMilestoneModal milestone={activeMilestone} onDismiss={dismissMilestone} />
      )}
    </>
  );
}
