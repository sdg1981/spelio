import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Home } from './components/Home';
import { CustomListCreatePage, CustomListEntryPage, CustomListSharePage } from './components/CustomLists';
import { HowSpelioWorks } from './components/HowSpelioWorks';
import { AboutPage, FeedbackPage, PrivacyPage } from './components/PublicInfoPages';
import { WelshSpellingBasicsOverview, WelshSpellingBasicsTopicPage } from './components/WelshSpellingBasics';
import { FoundationsPrimer } from './components/FoundationsPrimer';
import { Practice } from './components/Practice';
import { WordListsPage } from './components/WordListsPage';
import { EndScreen } from './components/End';
import { FeedbackModal, getFeedbackLearningMethodOptions, getFeedbackSignalOptions } from './components/Footer';
import { PublicMetadata } from './components/PublicMetadata';
import { ScreenTransition } from './components/ScreenTransition';
import { wordLists } from './data/wordLists';
import type { WordList } from './data/wordLists';
import { findSupportWordList } from './data/supportWordLists';
import { loadPublicContent } from './lib/content/publicContentRepository';
import type { SessionResult, SpelioSettings, SpelioStorage } from './lib/practice/storage';
import { applyManualWordListSelection, clearSpelioStorageData, createDefaultStorage, getFullyCompletedListIds, getInProgressListIds, loadSpelioStorage, saveSpelioStorage } from './lib/practice/storage';
import { getRecommendation } from './lib/practice/recommendations';
import type { Recommendation } from './lib/practice/recommendations';
import { createDetachedSupportPracticeStart, createDetachedSupportReviewPracticeStart, createNormalContinuationPracticeStart, createPrimaryRecommendationPracticeStart, createRecapPracticeStart, createReviewPracticeStart, type PracticeStart } from './lib/practice/sessionStart';
import { getDifficultWordCount, getDifficultWordCountInList, getRecapWordCount, hasDifficultWords } from './lib/practice/sessionEngine';
import { formatCumulativeProgress } from './lib/practice/progress';
import { normalizeSingleSelectedListIds, normalizeStorageWordListSelection } from './lib/practice/wordListSelection';
import { createSharedWordListContext, createSharedWordListEffectiveStorage, findActiveWordListBySlug, getSharedWordListSlugFromPath, isPracticeTestShareMode, restoreSharedWordListProgression, type SharedWordListContext } from './lib/wordListSharing';
import { getEndScreenProgressSummary } from './lib/practice/endScreenState';
import { getCustomPublicIdFromPath, getCustomSharePublicIdFromPath } from './lib/customListRoutes';
import { getListDisplayName } from './lib/practice/wordListDisplay';
import { resetPublicPageScrollToTop } from './lib/scrollRestoration';
import { createTranslator, type InterfaceLanguage } from './i18n';
import { getSpellingBasicsTopic, getSpellingBasicsTopicSlugFromPath, type SpellingBasicsTopicSlug } from './content/spellingBasics';
import { getFoundationsPrimer } from './content/foundationsPrimer';
import { DEFAULT_AUDIO_PROVIDER, type DefaultAudioProvider } from './lib/audioProvider';
import { createDefaultInterfaceAudioClips, createInterfaceAudioRegistry, type InterfaceAudioClipRegistry } from './lib/interfaceAudio';

type Screen = 'home' | 'primer' | 'practice' | 'end' | 'how' | 'feedback' | 'privacy' | 'about' | 'word-lists' | 'custom-new' | 'custom-share' | 'custom-entry' | 'spelling-basics' | 'spelling-basics-topic';

type PendingPrimerLaunch = {
  start: PracticeStart;
  detachedContext: SharedWordListContext | null;
  returnScreen: Screen;
};

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
  if (pathname === '/word-lists') return 'word-lists';
  if (pathname === '/spelling-basics') return 'spelling-basics';
  if (getSpellingBasicsTopicSlugFromPath(pathname)) return 'spelling-basics-topic';
  if (pathname === '/custom-list/new') return 'custom-new';
  if (getCustomSharePublicIdFromPath(pathname)) return 'custom-share';
  if (getCustomPublicIdFromPath(pathname)) return 'custom-entry';
  return 'home';
}

function isStandalonePublicPagePath(pathname: string) {
  return ['/how-spelio-works', '/feedback', '/privacy', '/about', '/word-lists', '/spelling-basics', '/custom-list/new'].includes(pathname) ||
    Boolean(getSpellingBasicsTopicSlugFromPath(pathname)) ||
    Boolean(getCustomSharePublicIdFromPath(pathname) || getCustomPublicIdFromPath(pathname));
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
  const [wordListReturnScreen, setWordListReturnScreen] = useState<Screen | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [lastResult, setLastResult] = useState<SessionResult | null>(storage.lastSessionResult);
  const [practiceSessionKey, setPracticeSessionKey] = useState(0);
  const [practiceStartStorage, setPracticeStartStorage] = useState<SpelioStorage | null>(null);
  const [resetStatusVisible, setResetStatusVisible] = useState(false);
  const [publicWordLists, setPublicWordLists] = useState<WordList[]>(wordLists);
  const [publicContentLoaded, setPublicContentLoaded] = useState(false);
  const [defaultAudioProvider, setDefaultAudioProvider] = useState<DefaultAudioProvider>(DEFAULT_AUDIO_PROVIDER);
  const [interfaceAudioClips, setInterfaceAudioClips] = useState<InterfaceAudioClipRegistry>(() => createInterfaceAudioRegistry(createDefaultInterfaceAudioClips()));
  const [activeCustomList, setActiveCustomList] = useState<WordList | null>(null);
  const [sharedContext, setSharedContext] = useState<SharedWordListContext | null>(initialAppState.sharedContext);
  const [activeSharedContext, setActiveSharedContext] = useState<SharedWordListContext | null>(null);
  const [completedSharedContext, setCompletedSharedContext] = useState<SharedWordListContext | null>(null);
  const [practiceTestMode, setPracticeTestMode] = useState(false);
  const [activeSupportPractice, setActiveSupportPractice] = useState<{ listId: string; returnTo: string } | null>(null);
  const [completedSupportPractice, setCompletedSupportPractice] = useState<{ listId: string; returnTo: string } | null>(null);
  const [pendingPrimerLaunch, setPendingPrimerLaunch] = useState<PendingPrimerLaunch | null>(null);
  const resetStatusTimerRef = useRef<number | null>(null);
  const interfaceLanguage = storage.settings.interfaceLanguage;
  const t = useMemo(() => createTranslator(interfaceLanguage), [interfaceLanguage]);
  const practiceLists = useMemo(
    () => activeCustomList ? [...publicWordLists, activeCustomList] : publicWordLists,
    [activeCustomList, publicWordLists]
  );
  const customSharePublicId = getCustomSharePublicIdFromPath(window.location.pathname);
  const customEntryPublicId = getCustomPublicIdFromPath(window.location.pathname);
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
  const completedSupportList = useMemo(
    () => completedSupportPractice ? findSupportWordList(practiceLists, completedSupportPractice.listId) ?? null : null,
    [completedSupportPractice, practiceLists]
  );
  const completedSupportDifficultWordCount = useMemo(
    () => completedSupportList && practiceStartStorage
      ? getDifficultWordCountInList(practiceStartStorage, completedSupportList)
      : 0,
    [completedSupportList, practiceStartStorage]
  );
  const completedListIds = useMemo(
    () => getFullyCompletedListIds(storage, publicWordLists),
    [publicWordLists, storage.listProgress, storage.settings.dialectPreference, storage.wordProgress]
  );
  const inProgressListIds = useMemo(
    () => getInProgressListIds(storage, publicWordLists),
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
    if (window.location.pathname === '/spelling-basics/wy') {
      window.history.replaceState({ spelioPublicPage: true }, '', '/spelling-basics/w');
      setScreen('spelling-basics-topic');
    }
  }, []);

  useEffect(() => {
    function handlePopState() {
      setWordListReturnScreen(null);
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
      setDefaultAudioProvider(content.defaultAudioProvider);
      setInterfaceAudioClips(content.interfaceAudioClips);
      setPublicContentLoaded(true);
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
    setCompletedSupportPractice(null);
    setActiveSupportPractice(null);
    setActiveCustomList(null);
    setWordListReturnScreen(null);
    setPendingPrimerLaunch(null);
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

  function getPracticeStartPrimerListId(start: PracticeStart) {
    if (start.mode !== 'normal' || start.review || start.recap || start.storage.selectedListIds.length !== 1) return null;
    return start.storage.selectedListIds[0] ?? null;
  }

  function beginPractice(
    start: PracticeStart,
    detachedContext: SharedWordListContext | null = sharedContext,
    options: { skipPrimer?: boolean; returnScreen?: Screen } = {}
  ) {
    if (start.review && !difficultWords) {
      setReviewMode(false);
      setScreen('home');
      return;
    }

    const primerListId = getPracticeStartPrimerListId(start);
    const primer = primerListId ? getFoundationsPrimer(primerListId, interfaceLanguage) : null;
    if (!options.skipPrimer && primer) {
      setPendingPrimerLaunch({
        start,
        detachedContext,
        returnScreen: options.returnScreen ?? screen
      });
      setScreen('primer');
      resetPublicPageScrollToTop();
      return;
    }

    setPendingPrimerLaunch(null);
    const isDetachedSharedStart =
      Boolean(detachedContext) &&
      start.mode === 'normal' &&
      start.storage.selectedListIds.length === 1 &&
      start.storage.selectedListIds[0] === detachedContext?.listId;

    if (isDetachedSharedStart && detachedContext) {
      setActiveSharedContext(detachedContext);
      setActiveSupportPractice(null);
      setCompletedSupportPractice(null);
      setPracticeTestMode(detachedContext.mode === 'practice-test');
    } else {
      setActiveSharedContext(null);
      setCompletedSharedContext(null);
      setActiveCustomList(null);
      setActiveSupportPractice(null);
      setCompletedSupportPractice(null);
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
      beginPractice(createSharedListPracticeStart(sharedContext, sharedList), sharedContext, { returnScreen: screen });
      return;
    }

    beginPractice(createPrimaryRecommendationPracticeStart(storage, publicWordLists, t, interfaceLanguage), sharedContext, { returnScreen: screen });
  }

  function startNormalContinuationPractice() {
    beginPractice(createNormalContinuationPracticeStart(storage, publicWordLists, t, interfaceLanguage), sharedContext, { returnScreen: screen });
  }

  function startReviewPractice() {
    beginPractice(createReviewPracticeStart(storage));
  }

  function startCompletedSupportReviewPractice() {
    if (!completedSupportPractice || !completedSupportList || !practiceStartStorage) return;
    const start = createDetachedSupportReviewPracticeStart(practiceStartStorage, completedSupportList);
    if (typeof window !== 'undefined') {
      const url = `/practice?supportListId=${encodeURIComponent(completedSupportList.id)}&returnTo=${encodeURIComponent(completedSupportPractice.returnTo)}`;
      window.history.pushState({ spelioPublicPage: true, spelioSupportPractice: true, returnTo: completedSupportPractice.returnTo }, '', url);
      resetPublicPageScrollToTop();
    }

    setActiveSupportPractice(completedSupportPractice);
    setCompletedSupportPractice(null);
    setActiveSharedContext(null);
    setCompletedSharedContext(null);
    setActiveCustomList(null);
    setPracticeTestMode(false);
    setPracticeStartStorage(start.storage);
    setPracticeSessionKey(key => key + 1);
    setReviewMode(true);
    setRecapMode(false);
    setScreen('practice');
  }

  function startRecapPractice() {
    beginPractice(createRecapPracticeStart(storage));
  }

  function startCustomListPractice(list: WordList, publicId: string, isPracticeTest: boolean) {
    const context = createSharedWordListContext(
      storage,
      list,
      publicId,
      isPracticeTest ? 'practice-test' : 'normal-share',
      hasMeaningfulLearningHistory(storage)
    );
    setActiveCustomList(list);
    beginPractice(createSharedListPracticeStart(context, list), context, { returnScreen: screen });
  }

  function startPracticeFromPrimer() {
    if (!pendingPrimerLaunch) return;
    beginPractice(pendingPrimerLaunch.start, pendingPrimerLaunch.detachedContext, {
      skipPrimer: true,
      returnScreen: pendingPrimerLaunch.returnScreen
    });
  }

  function returnFromPrimer() {
    const target = pendingPrimerLaunch?.returnScreen;
    setPendingPrimerLaunch(null);
    setScreen(target === 'end' && lastResult ? 'end' : 'home');
    resetPublicPageScrollToTop();
  }

  function startSupportPractice(practiceListId: string, topicSlug: SpellingBasicsTopicSlug) {
    const list = findSupportWordList(practiceLists, practiceListId);
    if (!list) return;

    const returnTo = `/spelling-basics/${topicSlug}`;
    const start = createDetachedSupportPracticeStart(storage, list, t, interfaceLanguage);
    if (typeof window !== 'undefined') {
      const url = `/practice?supportListId=${encodeURIComponent(list.id)}&returnTo=${encodeURIComponent(returnTo)}`;
      window.history.pushState({ spelioPublicPage: true, spelioSupportPractice: true, returnTo }, '', url);
      resetPublicPageScrollToTop();
    }

    setActiveSupportPractice({ listId: list.id, returnTo });
    setCompletedSupportPractice(null);
    setActiveSharedContext(null);
    setCompletedSharedContext(null);
    setActiveCustomList(null);
    setPracticeTestMode(false);
    setPracticeStartStorage(start.storage);
    setPracticeSessionKey(key => key + 1);
    setReviewMode(false);
    setRecapMode(false);
    setScreen('practice');
  }

  function updatePracticeSessionStorage(next: SpelioStorage) {
    if (activeSupportPractice) {
      if (!next.selectedListIds.includes(activeSupportPractice.listId)) {
        setStorage(next);
        setPracticeStartStorage(previous => previous ? { ...previous, settings: next.settings } : previous);
        return;
      }
      setPracticeStartStorage(next);
      return;
    }

    updateStorage(next);
  }

  function handleComplete(result: SessionResult, nextStorage: SpelioStorage) {
    setLastResult(result);
    if (activeSupportPractice) {
      setCompletedSupportPractice(activeSupportPractice);
      setActiveSupportPractice(null);
      setPracticeStartStorage(nextStorage);
      setPracticeTestMode(false);
    } else if (activeSharedContext) {
      setStorage(restoreSharedWordListProgression(nextStorage, activeSharedContext));
      setCompletedSharedContext(activeSharedContext);
      setActiveSharedContext(null);
      setSharedContext(null);
      setPracticeTestMode(false);
    } else {
      setStorage(nextStorage);
      setCompletedSharedContext(null);
      setCompletedSupportPractice(null);
    }
    setScreen('end');
  }

  function returnToCompletedSupportPracticeOrigin() {
    const returnTo = completedSupportPractice?.returnTo ?? '/spelling-basics';
    if (typeof window !== 'undefined') {
      window.history.replaceState({ spelioPublicPage: true }, '', returnTo);
      resetPublicPageScrollToTop();
    }

    setCompletedSupportPractice(null);
    setActiveSupportPractice(null);
    setPracticeStartStorage(null);
    setReviewMode(false);
    setRecapMode(false);
    setPracticeTestMode(false);
    setScreen(returnTo === '/spelling-basics' ? 'spelling-basics' : 'spelling-basics-topic');
  }

  function returnToLearning() {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
      window.history.replaceState(null, '', getHomePathForLanguage(interfaceLanguage));
      resetPublicPageScrollToTop();
    }

    setSharedContext(null);
    setCompletedSharedContext(null);
    setActiveSharedContext(null);
    setCompletedSupportPractice(null);
    setActiveSupportPractice(null);
    setActiveCustomList(null);
    setPracticeStartStorage(null);
    setWordListReturnScreen(null);
    setPendingPrimerLaunch(null);
    setPracticeTestMode(false);
    setReviewMode(false);
    setRecapMode(false);
    setScreen('home');
  }

  function openHowSpelioWorks() {
    if (typeof window !== 'undefined' && window.location.pathname !== '/how-spelio-works') {
      window.history.pushState({ spelioPublicPage: true }, '', '/how-spelio-works');
      resetPublicPageScrollToTop();
    }

    setScreen('how');
  }

  function openWelshSpellingBasics() {
    if (typeof window !== 'undefined' && window.location.pathname !== '/spelling-basics') {
      window.history.pushState({ spelioPublicPage: true }, '', '/spelling-basics');
      resetPublicPageScrollToTop();
    }

    setScreen('spelling-basics');
  }

  function openPublicPage(nextScreen: Extract<Screen, 'feedback' | 'privacy' | 'about'>, path: string) {
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({ spelioPublicPage: true }, '', path);
      resetPublicPageScrollToTop();
    }

    setScreen(nextScreen);
  }

  function openSpellingBasicsTopic(slug: SpellingBasicsTopicSlug) {
    const path = `/spelling-basics/${slug}`;
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({ spelioPublicPage: true }, '', path);
      resetPublicPageScrollToTop();
    }

    setScreen('spelling-basics-topic');
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

  function getStandaloneReturnPathFromState() {
    if (typeof window === 'undefined') return null;
    const returnTo = window.history.state?.spelioReturnTo;
    return returnTo === '/word-lists' ? returnTo : null;
  }

  function returnFromStandalonePublicPage() {
    const returnPath = getStandaloneReturnPathFromState();
    if (returnPath === '/word-lists') {
      setWordListReturnScreen('home');
      window.history.replaceState({ spelioPublicPage: true, wordListsReturnScreen: 'home' }, '', '/word-lists');
      resetPublicPageScrollToTop();
      setScreen('word-lists');
      return;
    }

    if (hasUsefulPreviousPublicHistory()) {
      window.history.back();
      return;
    }

    returnToLearning();
  }

  function openWordListsPage(returnScreen: Screen) {
    setWordListReturnScreen(returnScreen);
    if (typeof window !== 'undefined' && window.location.pathname !== '/word-lists') {
      window.history.pushState({ spelioPublicPage: true, wordListsReturnScreen: returnScreen }, '', '/word-lists');
      resetPublicPageScrollToTop();
    }
    setScreen('word-lists');
  }

  function returnFromWordListsPage() {
    const targetScreen = wordListReturnScreen === 'end' && lastResult ? 'end' : 'home';
    setWordListReturnScreen(null);

    if (typeof window !== 'undefined' && window.location.pathname === '/word-lists') {
      window.history.replaceState(null, '', getHomePathForLanguage(interfaceLanguage));
      resetPublicPageScrollToTop();
    }

    setScreen(targetScreen);
  }

  function practiseSharedListAgain() {
    if (!completedSharedContext) return;
    const list = practiceLists.find(item => item.id === completedSharedContext.listId && item.isActive);
    if (!list) return;
    beginPractice(createSharedListPracticeStart(completedSharedContext, list), completedSharedContext);
  }

  function saveSelectedWordLists(selectedIds: string[]) {
    const ids = normalizeSelectedListIds(selectedIds, publicWordLists);
    const changed = !sameListSelection(ids, storage.selectedListIds);
    const isWordListsPage = screen === 'word-lists';

    if (!changed) {
      setSharedContext(null);
      setCompletedSharedContext(null);
      setActiveSharedContext(null);
      setCompletedSupportPractice(null);
      setActiveSupportPractice(null);
      setActiveCustomList(null);
      setPracticeTestMode(false);
      setPendingPrimerLaunch(null);
      if (isWordListsPage) returnFromWordListsPage();
      return;
    }

    setStorage(previous => applyManualWordListSelection(previous, ids));
    setSharedContext(null);
    setCompletedSharedContext(null);
    setActiveSharedContext(null);
    setCompletedSupportPractice(null);
    setActiveSupportPractice(null);
    setActiveCustomList(null);
    setReviewMode(false);
    setRecapMode(false);
    setPracticeTestMode(false);
    setPracticeStartStorage(null);
    setWordListReturnScreen(null);
    setPendingPrimerLaunch(null);
    if (isWordListsPage && typeof window !== 'undefined') {
      window.history.replaceState(null, '', getHomePathForLanguage(interfaceLanguage));
      resetPublicPageScrollToTop();
    }
    setScreen('home');
  }

  function openCustomListCreate() {
    setWordListReturnScreen(null);
    window.history.pushState({ spelioPublicPage: true }, '', '/custom-list/new');
    resetPublicPageScrollToTop();
    setScreen('custom-new');
  }

  function resetProgress() {
    clearSpelioStorageData();
    const freshStorage = applyInterfaceLanguageRoute(createDefaultStorage());

    setStorage(freshStorage);
    setSharedContext(null);
    setCompletedSharedContext(null);
    setActiveSharedContext(null);
    setCompletedSupportPractice(null);
    setActiveSupportPractice(null);
    setActiveCustomList(null);
    setReviewMode(false);
    setRecapMode(false);
    setPracticeTestMode(false);
    setPracticeStartStorage(null);
    setWordListReturnScreen(null);
    setPendingPrimerLaunch(null);
    setLastResult(null);
    setScreen('home');
    setResetStatusVisible(true);

    if (resetStatusTimerRef.current) window.clearTimeout(resetStatusTimerRef.current);
    resetStatusTimerRef.current = window.setTimeout(() => {
      setResetStatusVisible(false);
      resetStatusTimerRef.current = null;
    }, 1800);
  }

  const completedSharedList = completedSharedContext
    ? practiceLists.find(list => list.id === completedSharedContext.listId)
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
  const spellingBasicsTopic = getSpellingBasicsTopic(getSpellingBasicsTopicSlugFromPath(window.location.pathname));
  const activePrimerListId = pendingPrimerLaunch ? getPracticeStartPrimerListId(pendingPrimerLaunch.start) : null;
  const activePrimer = activePrimerListId ? getFoundationsPrimer(activePrimerListId, interfaceLanguage) : null;
  const screenContent = activeScreen === 'how' ? (
    <HowSpelioWorks
      onHome={returnToLearning}
      onWelshSpellingBasics={openWelshSpellingBasics}
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
  ) : activeScreen === 'spelling-basics' ? (
    <WelshSpellingBasicsOverview
      onBack={returnFromStandalonePublicPage}
      onHome={returnToLearning}
      onOpenTopic={openSpellingBasicsTopic}
      interfaceLanguage={interfaceLanguage}
      onInterfaceLanguageChange={updateInterfaceLanguage}
      t={t}
    />
  ) : activeScreen === 'spelling-basics-topic' && spellingBasicsTopic ? (
    <WelshSpellingBasicsTopicPage
      onBack={returnFromStandalonePublicPage}
      onHome={returnToLearning}
      isPracticeListAvailable={practiceListId => Boolean(findSupportWordList(practiceLists, practiceListId))}
      onStartPractice={startSupportPractice}
      wordLists={practiceLists}
      topic={spellingBasicsTopic}
      interfaceLanguage={interfaceLanguage}
      onInterfaceLanguageChange={updateInterfaceLanguage}
      t={t}
    />
  ) : activeScreen === 'primer' && activePrimer ? (
    <FoundationsPrimer
      primer={activePrimer}
      audioPrompts={storage.settings.audioPrompts}
      onBack={returnFromPrimer}
      onHome={returnToLearning}
      onStartPractice={startPracticeFromPrimer}
      interfaceLanguage={interfaceLanguage}
      onInterfaceLanguageChange={updateInterfaceLanguage}
      t={t}
    />
  ) : activeScreen === 'practice' ? (
    <Practice
      lists={practiceLists}
      storage={storage}
      sessionStorage={practiceStartStorage ?? storage}
      reviewDifficult={reviewMode}
      includeRecapDue={recapMode}
      sessionKey={practiceSessionKey}
      practiceTestMode={practiceTestMode}
      defaultAudioProvider={defaultAudioProvider}
      interfaceAudioClips={interfaceAudioClips}
      interfaceAudioReady={publicContentLoaded}
      disableQuickRecap={Boolean(activeSharedContext) || Boolean(activeSupportPractice) || practiceTestMode}
      detached={Boolean(activeSupportPractice)}
      onStorageChange={updatePracticeSessionStorage}
      onComplete={handleComplete}
      onBackHome={activeSupportPractice ? () => openSpellingBasicsTopic(getSpellingBasicsTopicSlugFromPath(activeSupportPractice.returnTo) ?? 'phonetic') : activeSharedContext ? returnToLearning : () => setScreen('home')}
      onWordListsDone={saveSelectedWordLists}
      onResetProgress={resetProgress}
      interfaceLanguage={interfaceLanguage}
      onInterfaceLanguageChange={updateInterfaceLanguage}
      t={t}
    />
  ) : activeScreen === 'end' && lastResult ? (
    <EndScreen
      result={lastResult}
      recommendation={recommendation}
      progressSummary={getEndScreenProgressSummary(endProgressSummary, completedSupportPractice)}
      hasDifficultWords={difficultWords}
      onContinue={startNormalContinuationPractice}
      onReview={startReviewPractice}
      onChangeLists={() => openWordListsPage('end')}
      onHome={completedSharedContext ? returnToLearning : completedSupportPractice ? returnToCompletedSupportPracticeOrigin : () => setScreen('home')}
      contextualReturn={completedSupportPractice ? {
        label: t('end.backToSpellingBasics'),
        onClick: returnToCompletedSupportPracticeOrigin
      } : null}
      contextualHasDifficultWords={completedSupportDifficultWordCount > 0}
      onContextualReview={completedSupportPractice ? startCompletedSupportReviewPractice : undefined}
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
  ) : activeScreen === 'word-lists' ? (
    <WordListsPage
      lists={publicWordLists}
      initialSelectedIds={visibleStorage.selectedListIds}
      completedListIds={completedListIds}
      inProgressListIds={inProgressListIds}
      onBack={returnFromWordListsPage}
      onHome={returnToLearning}
      onDone={saveSelectedWordLists}
      onCreateCustomList={openCustomListCreate}
      interfaceLanguage={interfaceLanguage}
      onInterfaceLanguageChange={updateInterfaceLanguage}
      t={t}
    />
  ) : activeScreen === 'custom-new' ? (
    <CustomListCreatePage
      onBack={returnFromStandalonePublicPage}
      onHome={returnToLearning}
      interfaceLanguage={interfaceLanguage}
      onInterfaceLanguageChange={updateInterfaceLanguage}
      t={t}
    />
  ) : activeScreen === 'custom-share' && customSharePublicId ? (
    <CustomListSharePage
      publicId={customSharePublicId}
      onBack={returnFromStandalonePublicPage}
      onHome={returnToLearning}
      interfaceLanguage={interfaceLanguage}
      onInterfaceLanguageChange={updateInterfaceLanguage}
      t={t}
    />
  ) : activeScreen === 'custom-entry' && customEntryPublicId ? (
    <CustomListEntryPage
      publicId={customEntryPublicId}
      practiceTestMode={isPracticeTestShareMode(window.location.search)}
      onBack={returnFromStandalonePublicPage}
      onHome={returnToLearning}
      onStartPractice={startCustomListPractice}
      interfaceLanguage={interfaceLanguage}
      onInterfaceLanguageChange={updateInterfaceLanguage}
      t={t}
    />
  ) : (
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
      onSelectList={() => openWordListsPage('home')}
      onHowSpelioWorks={openHowSpelioWorks}
      onWelshSpellingBasics={openWelshSpellingBasics}
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
  );

  const showSharedPublicBackground = activeScreen !== 'home';
  const useActionPublicBackground = activeScreen === 'home' || activeScreen === 'end';
  const useReadingPublicBackground = activeScreen === 'spelling-basics' || activeScreen === 'spelling-basics-topic' || activeScreen === 'primer';
  const usePracticePublicBackground = activeScreen === 'practice';
  const useUtilityPublicBackground = ['how', 'feedback', 'privacy', 'about', 'word-lists', 'custom-new', 'custom-share', 'custom-entry', 'primer'].includes(activeScreen);
  const useNeutralPublicBackground = showSharedPublicBackground && !useActionPublicBackground;
  const useEndPublicBackground = activeScreen === 'end';
  const publicAppClassName = [
    'public-app',
    useActionPublicBackground ? 'public-app-action-background' : '',
    useEndPublicBackground ? 'public-app-end-background' : '',
    useNeutralPublicBackground ? 'public-app-neutral-background' : '',
    showSharedPublicBackground ? 'public-app-with-shared-background' : '',
    useReadingPublicBackground ? 'public-app-reading-background' : '',
    usePracticePublicBackground ? 'public-app-practice-background' : '',
    useUtilityPublicBackground ? 'public-app-utility-background' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={publicAppClassName} data-theme={storage.settings.theme}>
      <PublicMetadata
        origin={window.location.origin}
        pathname={window.location.pathname}
        search={window.location.search}
        interfaceLanguage={interfaceLanguage}
        screen={activeScreen}
        wordLists={publicWordLists}
      />
      {showSharedPublicBackground && <PublicBackgroundTreatment />}
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

function PublicBackgroundTreatment() {
  return (
    <div className="home-background-scene" aria-hidden="true">
      <div className="home-background-texture" />
      <div className="home-background-glow" />
      <div className="home-mobile-letter-background" />
      <div className="home-letter-stage">
        <img
          className="home-letter-image home-letter-image-left"
          src="/bg-3d-letters-left.webp"
          alt=""
          aria-hidden="true"
          draggable={false}
        />
        <img
          className="home-letter-image home-letter-image-right"
          src="/bg-3d-letters-right.webp"
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </div>
    </div>
  );
}
