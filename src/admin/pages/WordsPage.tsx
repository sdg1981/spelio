import { ExternalLink, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminButton, AdminCard, AdminInput, AdminSpinner } from '../components/primitives';
import { AudioStatusPill } from '../components/audioStatus';
import type { AdminRepository, AdminWordWithListName } from '../repositories';
import type { FormEvent, KeyboardEvent } from 'react';

const PAGE_SIZE = 30;

export function WordsPage({ navigate, repository }: { navigate: (path: string) => void; repository: AdminRepository }) {
  const [words, setWords] = useState<AdminWordWithListName[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage('');

    repository.listWords()
      .then(items => {
        if (!isMounted) return;
        setWords(items);
      })
      .catch(error => {
        if (!isMounted) return;
        console.error(error);
        setErrorMessage(readError(error, 'Could not load words.'));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [repository]);

  const filteredWords = useMemo(() => {
    const search = activeSearch.trim().toLowerCase();
    if (!search) return words;

    return words.filter(word => {
      const searchableText = [
        word.englishPrompt,
        word.welshAnswer,
        word.id,
        word.listName,
        word.listId,
        word.dialect,
        word.audioStatus
      ].join(' ').toLowerCase();

      return searchableText.includes(search);
    });
  }, [activeSearch, words]);

  const visibleWords = filteredWords.slice(0, visibleCount);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveSearch(searchInput.trim());
    setVisibleCount(PAGE_SIZE);
  }

  function updateSearchInput(value: string) {
    setSearchInput(value);
    if (!value.trim() && activeSearch) {
      setActiveSearch('');
      setVisibleCount(PAGE_SIZE);
    }
  }

  function clearSearch() {
    setSearchInput('');
    setActiveSearch('');
    setVisibleCount(PAGE_SIZE);
  }

  function openWord(wordId: string) {
    navigate(`/admin/words/${wordId}`);
  }

  function openWordFromKeyboard(event: KeyboardEvent<HTMLDivElement>, wordId: string) {
    if (event.target !== event.currentTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openWord(wordId);
  }

  return (
    <>
      <AdminPageHeader title="Words" description="A searchable editorial view across all Welsh spelling words." />
      {errorMessage && (
        <div className="mb-5 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}
      <AdminCard className="overflow-hidden">
        <form className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-5" onSubmit={submitSearch}>
          <label className="grid flex-1 gap-2 sm:max-w-md">
            <span className="text-xs font-bold text-slate-700">Search words</span>
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <AdminInput
                aria-label="Search words"
                className="pl-9"
                placeholder="English, Welsh, ID, list, dialect, or audio status"
                value={searchInput}
                onChange={event => updateSearchInput(event.target.value)}
              />
            </span>
          </label>
          <AdminButton type="submit" disabled={isLoading} aria-disabled={isLoading}>
            {isLoading && <AdminSpinner />}
            Search
          </AdminButton>
          {(searchInput || activeSearch) && (
            <AdminButton onClick={clearSearch} disabled={isLoading}>
              Clear
            </AdminButton>
          )}
        </form>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 text-sm text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-700">{visibleWords.length}</span> of <span className="font-bold text-slate-700">{filteredWords.length}</span>
            {activeSearch && <> matching word(s)</>}
          </div>
          {activeSearch && <div className="font-medium">Search: <span className="font-bold text-slate-700">{activeSearch}</span></div>}
        </div>
        <div className="divide-y divide-slate-100">
          {isLoading && (
            <div className="flex items-center gap-2 px-5 py-8 text-sm font-bold text-slate-500" role="status" aria-live="polite">
              <AdminSpinner />
              Loading words...
            </div>
          )}
          {!isLoading && visibleWords.map(word => (
            <div
              key={word.id}
              role="button"
              tabIndex={0}
              className="grid w-full cursor-pointer gap-3 px-5 py-4 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 lg:grid-cols-[1fr_1fr_160px_120px_auto] lg:items-center"
              onClick={() => openWord(word.id)}
              onKeyDown={event => openWordFromKeyboard(event, word.id)}
            >
              <div>
                <div className="font-bold text-slate-950">{word.englishPrompt}</div>
                <div className="mt-1 text-xs font-medium text-slate-500">{word.id}</div>
              </div>
              <div>
                <div className="font-medium text-slate-700">{word.welshAnswer}</div>
                <div className="mt-1 text-xs font-medium text-slate-500">List: {word.listName || word.listId}</div>
              </div>
              <div className="text-sm text-slate-500">{word.dialect}</div>
              <AudioStatusPill status={word.audioStatus} />
              <AdminButton
                className="justify-self-start whitespace-nowrap"
                onClick={event => {
                  event.stopPropagation();
                  navigate(`/admin/word-lists/${word.listId}`);
                }}
              >
                Open list <ExternalLink size={15} />
              </AdminButton>
            </div>
          ))}
          {!isLoading && visibleWords.length === 0 && <div className="px-5 py-8 text-sm font-medium text-slate-500">No words found.</div>}
        </div>
        {!isLoading && visibleWords.length < filteredWords.length && (
          <div className="border-t border-slate-200 p-5 text-center">
            <AdminButton onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>
              Load more
            </AdminButton>
          </div>
        )}
      </AdminCard>
    </>
  );
}

function readError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
