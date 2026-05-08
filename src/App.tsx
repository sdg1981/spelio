import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Home } from './components/Home';
import { Practice, WordListModal } from './components/Practice';
import { EndScreen } from './components/End';
import { ScreenTransition } from './components/ScreenTransition';
import { wordLists } from './data/wordLists';
import type { WordList } from './data/wordLists';
import { loadPublicContent } from './lib/content/publicContentRepository';
import type { SessionResult, SpelioSettings, SpelioStorage } from './lib/practice/storage';
import { applyManualWordListSelection, applyPracticeStartListSelection, clearSpelioStorageData, createDefaultStorage, loadSpelioStorage, saveSpelioStorage } from './lib/practice/storage';
import { getNormalContinuationRecommendation, getRecommendation } from './lib/practice/recommendations';
import { getDifficultWordCount, hasDifficultWords } from './lib/practice/sessionEngine';
import { formatCumulativeProgress } from './lib/practice/progress';
import { createTranslator, type InterfaceLanguage } from './i18n';

type Screen = 'home' | 'practice' | 'end';

const AdminApp = lazy(() => import('./admin/AdminApp').then(module => ({ default: module.AdminApp })));

function normalizeSelectedListIds(selectedIds: string[], lists: WordList[]) {
  const fallback = lists[0] ? [lists[0].id] : [];
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
  const [wordListModalOpen, setWordListModalOpen] = useState(false);
  const [lastResult, setLastResult] = useState<SessionResult | null>(storage.lastSessionResult);
  const [practiceSessionKey, setPracticeSessionKey] = useState(0);
  const [practiceStartStorage, setPracticeStartStorage] = useState<SpelioStorage | null>(null);
  const [showFirstSessionKeyboardHint, setShowFirstSessionKeyboardHint] = useState(false);
  const [resetStatusVisible, setResetStatusVisible] = useState(false);
  const [publicWordLists, setPublicWordLists] = useState<WordList[]>(wordLists);
  const resetStatusTimerRef = useRef<number | null>(null);
  const interfaceLanguage = storage.settings.interfaceLanguage;
  const t = useMemo(() => createTranslator(interfaceLanguage), [interfaceLanguage]);
  const difficultWords = useMemo(() => hasDifficultWords(storage, publicWordLists), [publicWordLists, storage.settings.dialectPreference, storage.wordProgress]);
  const difficultWordCount = useMemo(() => getDifficultWordCount(storage, publicWordLists), [publicWordLists, storage.settings.dialectPreference, storage.wordProgress]);
  const recommendation = useMemo(
    () => getRecommendation(storage, publicWordLists, t, interfaceLanguage),
    [
      difficultWords,
      interfaceLanguage,
      publicWordLists,
      storage.currentPathPosition,
      storage.lastSessionResult,
      storage.listProgress,
      storage.settings.dialectPreference,
      storage.selectedListIds,
      t
    ]
  );
  const normalContinuationRecommendation = useMemo(
    () => getNormalContinuationRecommendation(storage, publicWordLists, t, interfaceLanguage),
    [
      interfaceLanguage,
      publicWordLists,
      storage.currentPathPosition,
      storage.lastSessionResult,
      storage.listProgress,
      storage.settings.dialectPreference,
      storage.selectedListIds,
      storage.wordProgress,
      t
    ]
  );
  const homeProgressSummary = useMemo(
    () => formatCumulativeProgress(storage, publicWordLists, { t }),
    [publicWordLists, storage.learningStats, storage.wordProgress, t]
  );
  const endProgressSummary = useMemo(
    () => formatCumulativeProgress(storage, publicWordLists, { prefix: t('progress.totalProgress'), t }),
    [publicWordLists, storage.learningStats, storage.wordProgress, t]
  );

  useEffect(() => {
    saveSpelioStorage(storage);
  }, [storage]);

  useEffect(() => {
    return () => {
      if (resetStatusTimerRef.current) window.clearTimeout(resetStatusTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadPublicContent().then(content => {
      if (cancelled) return;
      setPublicWordLists(content.lists);
    });

    return () => {
      cancelled = true;
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

  function updateSettings(patch: Partial<SpelioSettings>) {
    setStorage(previous => {
      const nextSettings = { ...previous.settings, ...patch };
      if (!nextSettings.audioPrompts) {
        nextSettings.englishVisible = true;
      }

      const hasChanged = (Object.keys(nextSettings) as Array<keyof SpelioSettings>).some(settingKey => {
        return previous.settings[settingKey] !== nextSettings[settingKey];
      });

      if (!hasChanged) return previous;
      return { ...previous, settings: nextSettings };
    });
  }

  function startPractice(options?: { review?: boolean; listId?: string }) {
    const listId = options?.listId;
    const review = Boolean(options?.review);

    if (review && !difficultWords) {
      setReviewMode(false);
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
    setScreen('practice');
  }

  function handleComplete(result: SessionResult, nextStorage: SpelioStorage) {
    setLastResult(result);
    setStorage(nextStorage);
    setScreen('end');
  }

  function saveSelectedWordLists(selectedIds: string[]) {
    const ids = normalizeSelectedListIds(selectedIds, publicWordLists);
    const changed = !sameListSelection(ids, storage.selectedListIds);

    if (!changed) {
      setWordListModalOpen(false);
      return;
    }

    setStorage(previous => applyManualWordListSelection(previous, ids));
    setReviewMode(false);
    setWordListModalOpen(false);
    setScreen('home');
  }

  function resetProgress() {
    clearSpelioStorageData();
    const freshStorage = applyInterfaceLanguageRoute(createDefaultStorage());

    setStorage(freshStorage);
    setReviewMode(false);
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
      lists={publicWordLists}
      storage={storage}
      sessionStorage={practiceStartStorage ?? storage}
      reviewDifficult={reviewMode}
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
          startPractice({ listId: normalContinuationRecommendation.listId });
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
          lists={publicWordLists}
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
        difficultWordCount={difficultWordCount}
        onStart={() => startPractice({ review: recommendation.kind === 'review', listId: recommendation.listId })}
        onContinue={() => startPractice({ listId: normalContinuationRecommendation.listId })}
        onReview={() => startPractice({ review: true })}
        onRecapReview={() => startPractice({ review: true })}
        onSelectList={() => setWordListModalOpen(true)}
        settings={storage.settings}
        onSettingsChange={updateSettings}
        onResetProgress={resetProgress}
        interfaceLanguage={interfaceLanguage}
        onInterfaceLanguageChange={updateInterfaceLanguage}
        t={t}
      />
      {wordListModalOpen && (
        <WordListModal
          lists={publicWordLists}
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
