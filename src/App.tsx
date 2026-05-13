import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Home } from './components/Home';
import { Practice, WordListModal } from './components/Practice';
import { EndScreen } from './components/End';
import { FeedbackModal, getFeedbackLearningMethodOptions, getFeedbackSignalOptions } from './components/Footer';
import { ScreenTransition } from './components/ScreenTransition';
import { wordLists } from './data/wordLists';
import type { WordList } from './data/wordLists';
import { loadPublicContent } from './lib/content/publicContentRepository';
import type { SessionResult, SpelioSettings, SpelioStorage } from './lib/practice/storage';
import { applyManualWordListSelection, clearSpelioStorageData, createDefaultStorage, getFullyCompletedListIds, loadSpelioStorage, saveSpelioStorage } from './lib/practice/storage';
import { getRecommendation } from './lib/practice/recommendations';
import { createNormalContinuationPracticeStart, createPrimaryRecommendationPracticeStart, createRecapPracticeStart, createReviewPracticeStart, type PracticeStart } from './lib/practice/sessionStart';
import { getDifficultWordCount, getRecapWordCount, hasDifficultWords } from './lib/practice/sessionEngine';
import { formatCumulativeProgress } from './lib/practice/progress';
import { normalizeSingleSelectedListIds, normalizeStorageWordListSelection } from './lib/practice/wordListSelection';
import { createTranslator, type InterfaceLanguage } from './i18n';

type Screen = 'home' | 'practice' | 'end';

const AdminApp = lazy(() => import('./admin/AdminApp').then(module => ({ default: module.AdminApp })));

function normalizeSelectedListIds(selectedIds: string[], lists: WordList[]) {
  return normalizeSingleSelectedListIds(selectedIds, lists);
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
  const [recapMode, setRecapMode] = useState(false);
  const [wordListModalOpen, setWordListModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
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
  const recapWordCount = useMemo(() => getRecapWordCount(storage, publicWordLists), [publicWordLists, storage.settings.dialectPreference, storage.wordProgress]);
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
  const homeProgressSummary = useMemo(
    () => formatCumulativeProgress(storage, publicWordLists, { t }),
    [publicWordLists, storage.learningStats, storage.wordProgress, t]
  );
  const endProgressSummary = useMemo(
    () => formatCumulativeProgress(storage, publicWordLists, { prefix: t('progress.totalProgress'), t }),
    [publicWordLists, storage.learningStats, storage.wordProgress, t]
  );
  const completedListIds = useMemo(
    () => getFullyCompletedListIds(storage, publicWordLists),
    [publicWordLists, storage.listProgress, storage.settings.dialectPreference, storage.wordProgress]
  );
  const feedbackSignalOptions = useMemo(() => getFeedbackSignalOptions(t), [t]);
  const learningMethodOptions = useMemo(() => getFeedbackLearningMethodOptions(t), [t]);

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
      setStorage(previous => normalizeStorageWordListSelection(previous, content.lists));
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

  function beginPractice(start: PracticeStart) {
    if (start.review && !difficultWords) {
      setReviewMode(false);
      setScreen('home');
      return;
    }

    setShowFirstSessionKeyboardHint(!start.review && !start.recap && (storage.completedNormalSessionCount ?? 0) >= 5);
    setStorage(start.storage);
    setPracticeStartStorage(start.storage);
    setPracticeSessionKey(key => key + 1);
    setReviewMode(start.review);
    setRecapMode(start.recap);
    setScreen('practice');
  }

  function startPrimaryRecommendationPractice() {
    beginPractice(createPrimaryRecommendationPracticeStart(storage, publicWordLists, t, interfaceLanguage));
  }

  function startNormalContinuationPractice() {
    beginPractice(createNormalContinuationPracticeStart(storage, publicWordLists, t, interfaceLanguage));
  }

  function startReviewPractice() {
    beginPractice(createReviewPracticeStart(storage));
  }

  function startRecapPractice() {
    beginPractice(createRecapPracticeStart(storage));
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
    setRecapMode(false);
    setWordListModalOpen(false);
    setScreen('home');
  }

  function openFeedbackFromWordLists() {
    setWordListModalOpen(false);
    setFeedbackModalOpen(true);
  }

  function resetProgress() {
    clearSpelioStorageData();
    const freshStorage = applyInterfaceLanguageRoute(createDefaultStorage());

    setStorage(freshStorage);
    setReviewMode(false);
    setRecapMode(false);
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
      includeRecapDue={recapMode}
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
        onContinue={startNormalContinuationPractice}
        onReview={startReviewPractice}
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
          completedListIds={completedListIds}
          onClose={() => setWordListModalOpen(false)}
          onDone={saveSelectedWordLists}
          onSuggestWordList={openFeedbackFromWordLists}
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
        recapWordCount={recapWordCount}
        onStart={startPrimaryRecommendationPractice}
        onContinue={startNormalContinuationPractice}
        onReview={startReviewPractice}
        onRecapReview={startRecapPractice}
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
          completedListIds={completedListIds}
          onClose={() => setWordListModalOpen(false)}
          onDone={saveSelectedWordLists}
          onSuggestWordList={openFeedbackFromWordLists}
          interfaceLanguage={interfaceLanguage}
          t={t}
        />
      )}
    </>
  );

  return (
    <div className="public-app" data-theme={storage.settings.theme}>
      <ScreenTransition screen={activeScreen}>
        {screenContent}
      </ScreenTransition>
      <div className={`app-toast ${resetStatusVisible ? 'visible' : ''}`} role="status" aria-live="polite">
        {t('progress.resetFresh')}
      </div>
      {feedbackModalOpen && (
        <FeedbackModal
          onClose={() => setFeedbackModalOpen(false)}
          t={t}
          feedbackSignalOptions={feedbackSignalOptions}
          learningMethodOptions={learningMethodOptions}
        />
      )}
    </div>
  );
}
