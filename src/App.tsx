import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Home } from './components/Home';
import { HowSpelioWorks } from './components/HowSpelioWorks';
import { AboutPage, FeedbackPage, PrivacyPage } from './components/PublicInfoPages';
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
import type { Recommendation } from './lib/practice/recommendations';
import { createNormalContinuationPracticeStart, createPrimaryRecommendationPracticeStart, createRecapPracticeStart, createReviewPracticeStart, type PracticeStart } from './lib/practice/sessionStart';
import { getDifficultWordCount, getRecapWordCount, hasDifficultWords } from './lib/practice/sessionEngine';
import { formatCumulativeProgress } from './lib/practice/progress';
import { normalizeSingleSelectedListIds, normalizeStorageWordListSelection } from './lib/practice/wordListSelection';
import { createSharedWordListContext, createSharedWordListEffectiveStorage, findActiveWordListBySlug, getSharedWordListSlugFromPath, isPracticeTestShareMode, restoreSharedWordListProgression, type SharedWordListContext } from './lib/wordListSharing';
import { getListDisplayName } from './lib/practice/wordListDisplay';
import { createTranslator, type InterfaceLanguage } from './i18n';

type Screen = 'home' | 'practice' | 'end' | 'how' | 'feedback' | 'privacy' | 'about';

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

function hasMeaningfulLearningHistory(storage: SpelioStorage) {
  const defaults = createDefaultStorage();
  const hasWordProgress = Object.values(storage.wordProgress).some(progress => (
    progress.seen ||
    progress.completedCount > 0 ||
    progress.incorrectAttempts > 0 ||
    progress.revealedCount > 0 ||
    progress.difficult ||
    progress.recapDue === true ||
    Boolean(progress.lastPractisedAt)
  ));
  const hasListProgress = Object.values(storage.listProgress).some(progress => (
    progress.seenWordIds.length > 0 ||
    progress.completed ||
    progress.strongSessionCount > 0 ||
    Boolean(progress.completedAt) ||
    Boolean(progress.lastPractisedAt)
  ));
  const hasSavedPathAwayFromDefault =
    !sameListSelection(storage.selectedListIds, defaults.selectedListIds) ||
    storage.currentPathPosition !== defaults.currentPathPosition;

  return (
    (storage.completedNormalSessionCount ?? 0) > 0 ||
    storage.hasStartedPracticeSession ||
    Boolean(storage.lastSessionDate) ||
    hasWordProgress ||
    hasListProgress ||
    hasSavedPathAwayFromDefault
  );
}

function createSharedContextFromRoute(storage: SpelioStorage, lists: WordList[]) {
  const sharedSlug = getSharedWordListSlugFromPath(window.location.pathname);
  const sharedList = findActiveWordListBySlug(lists, sharedSlug);
  if (!sharedList || !sharedSlug) return null;

  return createSharedWordListContext(
    storage,
    sharedList,
    sharedSlug,
    isPracticeTestShareMode(window.location.search) ? 'practice-test' : 'normal-share',
    hasMeaningfulLearningHistory(storage)
  );
}

function getHomePathForLanguage(language: InterfaceLanguage) {
  return language === 'cy' ? '/cy' : '/';
}

function getScreenForPath(pathname: string): Screen {
  if (pathname === '/how-spelio-works') return 'how';
  if (pathname === '/feedback') return 'feedback';
  if (pathname === '/privacy') return 'privacy';
  if (pathname === '/about') return 'about';
  return 'home';
}

function isStandalonePublicPagePath(pathname: string) {
  return ['/how-spelio-works', '/feedback', '/privacy', '/about'].includes(pathname);
}

function getInitialPublicScreen(): Screen {
  return getScreenForPath(window.location.pathname);
}

export default function App() {
  if (window.location.pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <AdminApp />
      </Suspense>
    );
  }

  const [initialAppState] = useState(() => {
    const initialStorage = applyInterfaceLanguageRoute(loadSpelioStorage());
    return {
      storage: initialStorage,
      sharedContext: createSharedContextFromRoute(initialStorage, wordLists)
    };
  });
  const [storage, setStorage] = useState<SpelioStorage>(initialAppState.storage);
  const [screen, setScreen] = useState<Screen>(() => getInitialPublicScreen());
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
  const [sharedContext, setSharedContext] = useState<SharedWordListContext | null>(initialAppState.sharedContext);
  const [activeSharedContext, setActiveSharedContext] = useState<SharedWordListContext | null>(null);
  const [completedSharedContext, setCompletedSharedContext] = useState<SharedWordListContext | null>(null);
  const [practiceTestMode, setPracticeTestMode] = useState(false);
  const resetStatusTimerRef = useRef<number | null>(null);
  const interfaceLanguage = storage.settings.interfaceLanguage;
  const t = useMemo(() => createTranslator(interfaceLanguage), [interfaceLanguage]);
  const sharedList = useMemo(
    () => sharedContext ? publicWordLists.find(list => list.id === sharedContext.listId && list.isActive) ?? null : null,
    [publicWordLists, sharedContext]
  );
  const visibleStorage = useMemo(
    () => sharedContext && sharedList ? createSharedWordListEffectiveStorage(storage, sharedContext) : storage,
    [sharedContext, sharedList, storage]
  );
  const difficultWords = useMemo(() => hasDifficultWords(storage, publicWordLists), [publicWordLists, storage.settings.dialectPreference, storage.wordProgress]);
  const difficultWordCount = useMemo(() => getDifficultWordCount(storage, publicWordLists), [publicWordLists, storage.settings.dialectPreference, storage.wordProgress]);
  const recapWordCount = useMemo(() => getRecapWordCount(storage, publicWordLists), [publicWordLists, storage.settings.dialectPreference, storage.wordProgress]);
  const recommendation = useMemo<Recommendation>(
    () => sharedList
      ? {
          kind: 'list',
          listId: sharedList.id,
          title: t('home.continueLearning'),
          subtitle: getListDisplayName(sharedList, interfaceLanguage)
        }
      : getRecommendation(storage, publicWordLists, t, interfaceLanguage),
    [
      difficultWords,
      interfaceLanguage,
      publicWordLists,
      sharedList,
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
    function handlePopState() {
      setScreen(getInitialPublicScreen());
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadPublicContent().then(content => {
      if (cancelled) return;
      setPublicWordLists(content.lists);
      setStorage(previous => {
        const normalized = normalizeStorageWordListSelection(previous, content.lists);
        setSharedContext(createSharedContextFromRoute(normalized, content.lists));
        return normalized;
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function updateStorage(next: SpelioStorage) {
    setStorage(activeSharedContext ? restoreSharedWordListProgression(next, activeSharedContext) : next);
  }

  function updateInterfaceLanguage(language: InterfaceLanguage) {
    const shouldPreservePublicPage =
      typeof window !== 'undefined' &&
      isStandalonePublicPagePath(window.location.pathname);

    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin') && !shouldPreservePublicPage) {
      window.history.replaceState(null, '', getHomePathForLanguage(language));
    }

    setSharedContext(null);
    setCompletedSharedContext(null);
    setActiveSharedContext(null);
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

  function createSharedListPracticeStart(context: SharedWordListContext, list: WordList): PracticeStart {
    const sharedPracticeStorage = {
      ...createSharedWordListEffectiveStorage(storage, context),
      hasStartedPracticeSession: true
    };

    return {
      mode: 'normal',
      review: false,
      recap: false,
      storage: sharedPracticeStorage,
      recommendation: {
        kind: 'list',
        listId: list.id,
        title: t('home.continueLearning'),
        subtitle: getListDisplayName(list, interfaceLanguage)
      }
    };
  }

  function beginPractice(start: PracticeStart, detachedContext: SharedWordListContext | null = sharedContext) {
    if (start.review && !difficultWords) {
      setReviewMode(false);
      setScreen('home');
      return;
    }

    const isDetachedSharedStart =
      Boolean(detachedContext) &&
      start.mode === 'normal' &&
      start.storage.selectedListIds.length === 1 &&
      start.storage.selectedListIds[0] === detachedContext?.listId;

    setShowFirstSessionKeyboardHint(!start.review && !start.recap && (storage.completedNormalSessionCount ?? 0) >= 5);
    if (isDetachedSharedStart && detachedContext) {
      setActiveSharedContext(detachedContext);
      setPracticeTestMode(detachedContext.mode === 'practice-test');
    } else {
      setActiveSharedContext(null);
      setCompletedSharedContext(null);
      setPracticeTestMode(false);
      setStorage(start.storage);
    }
    setPracticeStartStorage(start.storage);
    setPracticeSessionKey(key => key + 1);
    setReviewMode(start.review);
    setRecapMode(start.recap);
    setScreen('practice');
  }

  function startPrimaryRecommendationPractice() {
    if (sharedContext && sharedList) {
      beginPractice(createSharedListPracticeStart(sharedContext, sharedList), sharedContext);
      return;
    }

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
    if (activeSharedContext) {
      setStorage(restoreSharedWordListProgression(nextStorage, activeSharedContext));
      setCompletedSharedContext(activeSharedContext);
      setActiveSharedContext(null);
      setSharedContext(null);
      setPracticeTestMode(false);
    } else {
      setStorage(nextStorage);
      setCompletedSharedContext(null);
    }
    setScreen('end');
  }

  function returnToLearning() {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
      window.history.replaceState(null, '', getHomePathForLanguage(interfaceLanguage));
    }

    setSharedContext(null);
    setCompletedSharedContext(null);
    setActiveSharedContext(null);
    setPracticeStartStorage(null);
    setPracticeTestMode(false);
    setReviewMode(false);
    setRecapMode(false);
    setScreen('home');
  }

  function openHowSpelioWorks() {
    if (typeof window !== 'undefined' && window.location.pathname !== '/how-spelio-works') {
      window.history.pushState({ spelioPublicPage: true }, '', '/how-spelio-works');
    }

    setScreen('how');
  }

  function openPublicPage(nextScreen: Extract<Screen, 'feedback' | 'privacy' | 'about'>, path: string) {
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({ spelioPublicPage: true }, '', path);
    }

    setScreen(nextScreen);
  }

  function hasUsefulPreviousPublicHistory() {
    if (typeof window === 'undefined') return false;
    if (window.history.state?.spelioPublicPage) return true;

    try {
      if (!document.referrer) return false;
      const referrer = new URL(document.referrer);
      return referrer.origin === window.location.origin && referrer.pathname !== window.location.pathname;
    } catch {
      return false;
    }
  }

  function returnFromStandalonePublicPage() {
    if (hasUsefulPreviousPublicHistory()) {
      window.history.back();
      return;
    }

    returnToLearning();
  }

  function practiseSharedListAgain() {
    if (!completedSharedContext) return;
    const list = publicWordLists.find(item => item.id === completedSharedContext.listId && item.isActive);
    if (!list) return;
    beginPractice(createSharedListPracticeStart(completedSharedContext, list), completedSharedContext);
  }

  function saveSelectedWordLists(selectedIds: string[]) {
    const ids = normalizeSelectedListIds(selectedIds, publicWordLists);
    const changed = !sameListSelection(ids, storage.selectedListIds);

    if (!changed) {
      setSharedContext(null);
      setCompletedSharedContext(null);
      setActiveSharedContext(null);
      setPracticeTestMode(false);
      setWordListModalOpen(false);
      return;
    }

    setStorage(previous => applyManualWordListSelection(previous, ids));
    setSharedContext(null);
    setCompletedSharedContext(null);
    setActiveSharedContext(null);
    setReviewMode(false);
    setRecapMode(false);
    setPracticeTestMode(false);
    setPracticeStartStorage(null);
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
    setSharedContext(null);
    setCompletedSharedContext(null);
    setActiveSharedContext(null);
    setReviewMode(false);
    setRecapMode(false);
    setPracticeTestMode(false);
    setPracticeStartStorage(null);
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

  const completedSharedList = completedSharedContext
    ? publicWordLists.find(list => list.id === completedSharedContext.listId)
    : null;
  const completedSharedListName = completedSharedList
    ? getListDisplayName(completedSharedList, interfaceLanguage)
    : completedSharedContext
      ? t('wordLists.sharedWordList')
      : null;

  const homeMode = sharedList
    ? 'returning'
    : !storage.lastSessionDate
    ? 'first'
    : storage.lastSessionResult?.state === 'struggled' && difficultWords
      ? 'struggled'
      : 'returning';

  const activeScreen = screen === 'end' && !lastResult ? 'home' : screen;
  const screenContent = activeScreen === 'how' ? (
    <HowSpelioWorks
      onHome={returnToLearning}
      interfaceLanguage={interfaceLanguage}
      onInterfaceLanguageChange={updateInterfaceLanguage}
      t={t}
    />
  ) : activeScreen === 'feedback' ? (
    <FeedbackPage
      onBack={returnFromStandalonePublicPage}
      onHome={returnToLearning}
      interfaceLanguage={interfaceLanguage}
      onInterfaceLanguageChange={updateInterfaceLanguage}
      t={t}
    />
  ) : activeScreen === 'privacy' ? (
    <PrivacyPage
      onBack={returnFromStandalonePublicPage}
      onHome={returnToLearning}
      interfaceLanguage={interfaceLanguage}
      onInterfaceLanguageChange={updateInterfaceLanguage}
      t={t}
    />
  ) : activeScreen === 'about' ? (
    <AboutPage
      onBack={returnFromStandalonePublicPage}
      onHome={returnToLearning}
      interfaceLanguage={interfaceLanguage}
      onInterfaceLanguageChange={updateInterfaceLanguage}
      t={t}
    />
  ) : activeScreen === 'practice' ? (
    <Practice
      lists={publicWordLists}
      storage={storage}
      sessionStorage={practiceStartStorage ?? storage}
      reviewDifficult={reviewMode}
      includeRecapDue={recapMode}
      sessionKey={practiceSessionKey}
      showKeyboardHint={showFirstSessionKeyboardHint}
      practiceTestMode={practiceTestMode}
      onStorageChange={updateStorage}
      onComplete={handleComplete}
      onBackHome={activeSharedContext ? returnToLearning : () => setScreen('home')}
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
        onHome={completedSharedContext ? returnToLearning : () => setScreen('home')}
        sharedSession={completedSharedListName && completedSharedContext ? {
          listName: completedSharedListName,
          hasPriorLearningHistory: completedSharedContext.previousHadMeaningfulLearningHistory
        } : null}
        onReturnToLearning={returnToLearning}
        onPractiseSharedListAgain={completedSharedContext ? practiseSharedListAgain : undefined}
        interfaceLanguage={interfaceLanguage}
        onInterfaceLanguageChange={updateInterfaceLanguage}
        t={t}
      />
      {wordListModalOpen && (
        <WordListModal
          lists={publicWordLists}
          initialSelectedIds={visibleStorage.selectedListIds}
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
        sharedEntryMode={sharedContext?.mode ?? null}
        progressSummary={homeProgressSummary}
        hasDifficultWords={difficultWords}
        difficultWordCount={difficultWordCount}
        recapWordCount={recapWordCount}
        onStart={startPrimaryRecommendationPractice}
        onContinue={startNormalContinuationPractice}
        onReview={startReviewPractice}
        onRecapReview={startRecapPractice}
        onSelectList={() => setWordListModalOpen(true)}
        onHowSpelioWorks={openHowSpelioWorks}
        onFeedback={() => openPublicPage('feedback', '/feedback')}
        onPrivacy={() => openPublicPage('privacy', '/privacy')}
        onAbout={() => openPublicPage('about', '/about')}
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
          initialSelectedIds={visibleStorage.selectedListIds}
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
