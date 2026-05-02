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
  const recommendation = useMemo(() => getRecommendation(storage, wordLists), [storage]);

  useEffect(() => {
    saveSpelioStorage(storage);
  }, [storage]);

  function updateStorage(next: SpelioStorage) {
    setStorage(next);
  }

  function startPractice(options?: { review?: boolean; listId?: string }) {
    const listId = options?.listId;
    const review = Boolean(options?.review);

    if (review && !hasDifficultWords(storage)) {
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
    : storage.lastSessionResult?.state === 'struggled' && hasDifficultWords(storage)
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
          recommendation={getRecommendation(storage, wordLists)}
          hasDifficultWords={hasDifficultWords(storage)}
          onContinue={() => {
            const next = getRecommendation(storage, wordLists);
            startPractice({ review: next.kind === 'review', listId: next.listId });
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
        hasDifficultWords={hasDifficultWords(storage)}
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
