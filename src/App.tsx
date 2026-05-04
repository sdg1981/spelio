import { useEffect, useMemo, useState } from 'react';
import { Home } from './components/Home';
import { Practice, WordListModal } from './components/Practice';
import { EndScreen } from './components/End';
import { ScreenTransition } from './components/ScreenTransition';
import { wordLists } from './data/wordLists';
import type { SessionResult, SpelioStorage } from './lib/practice/storage';
import { loadSpelioStorage, saveSpelioStorage } from './lib/practice/storage';
import { getRecommendation } from './lib/practice/recommendations';
import { hasDifficultWords } from './lib/practice/sessionEngine';

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
  const [wordListModalOpen, setWordListModalOpen] = useState(false);
  const [lastResult, setLastResult] = useState<SessionResult | null>(storage.lastSessionResult);
  const difficultWords = useMemo(() => hasDifficultWords(storage), [storage.wordProgress]);
  const recommendation = useMemo(
    () => getRecommendation(storage, wordLists),
    [
      difficultWords,
      storage.currentPathPosition,
      storage.lastSessionResult,
      storage.listProgress,
      storage.selectedListIds
    ]
  );

  useEffect(() => {
    saveSpelioStorage(storage);
  }, [storage]);

  function updateStorage(next: SpelioStorage) {
    setStorage(next);
  }

  function startPractice(options?: { review?: boolean; listId?: string }) {
    const listId = options?.listId;
    const review = Boolean(options?.review);

    if (review && !difficultWords) {
      setReviewMode(false);
      setScreen('home');
      return;
    }

    setStorage(previous => {
      if (!listId || review) return previous;
      return {
        ...previous,
        selectedListIds: [listId],
        currentPathPosition: listId
      };
    });

    setReviewMode(review);
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

    setStorage(previous => ({
      ...previous,
      selectedListIds: ids,
      currentPathPosition: ids[0] ?? null
    }));
    setReviewMode(false);
    setWordListModalOpen(false);
    setScreen('home');
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
      reviewDifficult={reviewMode}
      onStorageChange={updateStorage}
      onComplete={handleComplete}
      onBackHome={() => setScreen('home')}
      onWordListsDone={saveSelectedWordLists}
    />
  ) : activeScreen === 'end' && lastResult ? (
    <>
      <EndScreen
        result={lastResult}
        recommendation={recommendation}
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
        hasDifficultWords={difficultWords}
        onStart={() => startPractice({ review: recommendation.kind === 'review', listId: recommendation.listId })}
        onContinue={() => startPractice({ listId: recommendation.listId })}
        onReview={() => startPractice({ review: true })}
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
    <ScreenTransition screen={activeScreen}>
      {screenContent}
    </ScreenTransition>
  );
}
