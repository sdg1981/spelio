import { useEffect, useMemo, useState } from 'react';
import { Home } from './components/Home';
import { Practice, WordListModal } from './components/Practice';
import { EndScreen } from './components/End';
import { wordLists } from './data/wordLists';
import type { SessionResult, SpelioStorage } from './lib/practice/storage';
import { loadSpelioStorage, saveSpelioStorage } from './lib/practice/storage';
import { getRecommendation } from './lib/practice/recommendations';
import { hasDifficultWords } from './lib/practice/sessionEngine';

type Screen = 'home' | 'practice' | 'end';

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
    const fallback = wordLists[0] ? [wordLists[0].id] : [];
    const ids = selectedIds.length ? selectedIds : fallback;

    setStorage(previous => ({
      ...previous,
      selectedListIds: ids,
      currentPathPosition: ids[0] ?? null
    }));
    setWordListModalOpen(false);
  }

  const homeMode = !storage.lastSessionDate
    ? 'first'
    : storage.lastSessionResult?.state === 'struggled' && difficultWords
      ? 'struggled'
      : 'returning';

  if (screen === 'practice') {
    return (
      <Practice
        lists={wordLists}
        storage={storage}
        reviewDifficult={reviewMode}
        onStorageChange={updateStorage}
        onComplete={handleComplete}
        onBackHome={() => setScreen('home')}
      />
    );
  }

  if (screen === 'end' && lastResult) {
    return (
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
    );
  }

  return (
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
}
