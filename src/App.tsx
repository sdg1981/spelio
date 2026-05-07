import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Home } from './components/Home';
import { Practice, WordListModal } from './components/Practice';
import { EndScreen } from './components/End';
import { ScreenTransition } from './components/ScreenTransition';
import { wordLists } from './data/wordLists';
import type { SessionResult, SpelioStorage } from './lib/practice/storage';
import { applyManualWordListSelection, applyPracticeStartListSelection, clearSpelioStorageData, createDefaultStorage, loadSpelioStorage, saveSpelioStorage } from './lib/practice/storage';
import { getRecommendation } from './lib/practice/recommendations';
import { getRecapWordCount, hasDifficultWords } from './lib/practice/sessionEngine';
import { formatCumulativeProgress } from './lib/practice/progress';
import { createTranslator, type InterfaceLanguage } from './i18n';

type Screen = 'home' | 'practice' | 'end';

const AdminApp = lazy(() => import('./admin/AdminApp').then(module => ({ default: module.AdminApp })));

function normalizeSelectedListIds(selectedIds: string[]) {
  const fallback = wordLists[0] ? [wordLists[0].id] : [];
  return selectedIds.length ? selectedIds : fallback;
}

function sameListSelection(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function isWelshInterfaceRoute() {
  return window.location.pathname === '/cy' || window.location.pathname.startsWith('/cy/');
}

function applyInterfaceLanguageRoute(storage: SpelioStorage): SpelioStorage {
  if (!isWelshInterfaceRoute() || storage.settings.interfaceLanguage === 'cy') return storage;

  return {
    ...storage,
    settings: {
      ...storage.settings,
      interfaceLanguage: 'cy'
    }
  };
}

export default function App() {
  if (window.location.pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <AdminApp />
      </Suspense>
    );
  }

  const [storage, setStorage] = useState<SpelioStorage>(() => applyInterfaceLanguageRoute(loadSpelioStorage()));
  const [screen, setScreen] = useState<Screen>('home');
  const [reviewMode, setReviewMode] = useState(false);
  const [includeRecapDue, setIncludeRecapDue] = useState(false);
  const [wordListModalOpen, setWordListModalOpen] = useState(false);
  const [lastResult, setLastResult] = useState<SessionResult | null>(storage.lastSessionResult);
  const [practiceSessionKey, setPracticeSessionKey] = useState(0);
  const [practiceStartStorage, setPracticeStartStorage] = useState<SpelioStorage | null>(null);
  const [showFirstSessionKeyboardHint, setShowFirstSessionKeyboardHint] = useState(false);
  const [resetStatusVisible, setResetStatusVisible] = useState(false);
  const resetStatusTimerRef = useRef<number | null>(null);
  const interfaceLanguage = storage.settings.interfaceLanguage;
  const t = useMemo(() => createTranslator(interfaceLanguage), [interfaceLanguage]);
  const difficultWords = useMemo(() => hasDifficultWords(storage, wordLists), [storage.settings.dialectPreference, storage.wordProgress]);
  const recapWordCount = useMemo(() => getRecapWordCount(storage, wordLists), [storage.settings.dialectPreference, storage.wordProgress]);
  const recommendation = useMemo(
    () => getRecommendation(storage, wordLists, t, interfaceLanguage),
    [
      difficultWords,
      interfaceLanguage,
      storage.currentPathPosition,
      storage.lastSessionResult,
      storage.listProgress,
      storage.settings.dialectPreference,
      storage.selectedListIds,
      t
    ]
  );
  const homeProgressSummary = useMemo(
    () => formatCumulativeProgress(storage, wordLists, { t }),
    [storage.learningStats, storage.wordProgress, t]
  );
  const endProgressSummary = useMemo(
    () => formatCumulativeProgress(storage, wordLists, { prefix: t('progress.totalProgress'), t }),
    [storage.learningStats, storage.wordProgress, t]
  );

  useEffect(() => {
    saveSpelioStorage(storage);
  }, [storage]);

  useEffect(() => {
    return () => {
      if (resetStatusTimerRef.current) window.clearTimeout(resetStatusTimerRef.current);
    };
  }, []);

  function updateStorage(next: SpelioStorage) {
    setStorage(next);
  }

  function updateInterfaceLanguage(language: InterfaceLanguage) {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
      window.history.replaceState(null, '', language === 'cy' ? '/cy' : '/');
    }

    setStorage(previous => ({
      ...previous,
      settings: {
        ...previous.settings,
        interfaceLanguage: language
      }
    }));
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
    const freshStorage = applyInterfaceLanguageRoute(createDefaultStorage());

    setStorage(freshStorage);
    setReviewMode(false);
    setIncludeRecapDue(false);
    setWordListModalOpen(false);
    setLastResult(null);
    setShowFirstSessionKeyboardHint(false);
    setScreen('home');
    setResetStatusVisible(true);

    if (resetStatusTimerRef.current) window.clearTimeout(resetStatusTimerRef.current);
    resetStatusTimerRef.current = window.setTimeout(() => {
      setResetStatusVisible(false);
      resetStatusTimerRef.current = null;
    }, 1800);
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
      interfaceLanguage={interfaceLanguage}
      onInterfaceLanguageChange={updateInterfaceLanguage}
      t={t}
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
        interfaceLanguage={interfaceLanguage}
        onInterfaceLanguageChange={updateInterfaceLanguage}
        t={t}
      />
      {wordListModalOpen && (
        <WordListModal
          lists={wordLists}
          initialSelectedIds={storage.selectedListIds}
          completedListIds={Object.keys(storage.listProgress).filter(listId => storage.listProgress[listId]?.completed)}
          onClose={() => setWordListModalOpen(false)}
          onDone={saveSelectedWordLists}
          interfaceLanguage={interfaceLanguage}
          t={t}
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
        interfaceLanguage={interfaceLanguage}
        onInterfaceLanguageChange={updateInterfaceLanguage}
        t={t}
      />
      {wordListModalOpen && (
        <WordListModal
          lists={wordLists}
          initialSelectedIds={storage.selectedListIds}
          completedListIds={Object.keys(storage.listProgress).filter(listId => storage.listProgress[listId]?.completed)}
          onClose={() => setWordListModalOpen(false)}
          onDone={saveSelectedWordLists}
          interfaceLanguage={interfaceLanguage}
          t={t}
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
        {t('progress.resetFresh')}
      </div>
    </>
  );
}
