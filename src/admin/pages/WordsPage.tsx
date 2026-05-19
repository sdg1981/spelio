import { ExternalLink, Flag, Play, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminButton, AdminCard, AdminInput, AdminSpinner } from '../components/primitives';
import { AudioStatusPill } from '../components/audioStatus';
import type { AdminRepository, AdminWordWithListName } from '../repositories';
import type { DefaultAudioProvider } from '../types';
import { DEFAULT_AUDIO_PROVIDER, getResolvedPracticeAudioUrl } from '../../lib/audioProvider';
import { hasPlayableAudioUrl, logAudioPlaybackClick, playAudioUrl } from '../../lib/audioPlayback';
import type { FormEvent, KeyboardEvent } from 'react';

const PAGE_SIZE = 30;

export function WordsPage({ navigate, repository }: { navigate: (path: string) => void; repository: AdminRepository }) {
  const [words, setWords] = useState<AdminWordWithListName[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultAudioProvider, setDefaultAudioProvider] = useState<DefaultAudioProvider>(DEFAULT_AUDIO_PROVIDER);
  const [flaggingWordIds, setFlaggingWordIds] = useState<Set<string>>(() => new Set());
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage('');

    Promise.all([
      repository.listWords(),
      repository.getAudioSettings().catch(() => ({ defaultAudioProvider: DEFAULT_AUDIO_PROVIDER }))
    ])
      .then(([items, audioSettings]) => {
        if (!isMounted) return;
        setWords(items);
        setDefaultAudioProvider(audioSettings.defaultAudioProvider);
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

  async function flagNeedsAudioCheck(word: AdminWordWithListName) {
    setFlaggingWordIds(current => new Set(current).add(word.id));
    setErrorMessage('');
    setStatusMessage('');
    try {
      const saved = await repository.saveWord({ ...word, audioReviewStatus: 'needs_review' });
      setWords(current => current.map(item => item.id === saved.id ? { ...saved, listName: word.listName } : item));
      setStatusMessage(`Marked "${word.welshAnswer}" for audio review.`);
    } catch (error) {
      setErrorMessage(readError(error, 'Could not flag audio for review.'));
    } finally {
      setFlaggingWordIds(current => {
        const next = new Set(current);
        next.delete(word.id);
        return next;
      });
    }
  }

  return (
    <>
      <AdminPageHeader title="Words" description="A searchable editorial view across all Welsh spelling words." />
      {(statusMessage || errorMessage) && (
        <div className={`mb-5 rounded-md border px-4 py-3 text-sm font-bold ${errorMessage ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
          {errorMessage || statusMessage}
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
          {!isLoading && visibleWords.map(word => {
            const resolvedAudioUrl = getResolvedPracticeAudioUrl(word, defaultAudioProvider);
            const canPreviewAudio = hasPlayableAudioUrl(resolvedAudioUrl);
            const flagging = flaggingWordIds.has(word.id);

            return (
              <div
                key={word.id}
                role="button"
                tabIndex={0}
                className="grid w-full cursor-pointer gap-3 px-5 py-4 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 lg:grid-cols-[1fr_1fr_150px_120px_auto] lg:items-center"
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
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <AdminButton
                    className="min-h-9 whitespace-nowrap px-3"
                    onClick={event => {
                      event.stopPropagation();
                      logAudioPlaybackClick('admin-words-resolved-preview', resolvedAudioUrl);
                      void playAudioUrl(resolvedAudioUrl);
                    }}
                    disabled={!canPreviewAudio}
                    aria-disabled={!canPreviewAudio}
                    title={`Preview ${defaultAudioProvider === 'elevenlabs' && word.elevenLabsAudioStatus === 'generated' ? 'ElevenLabs' : 'Azure'} audio`}
                  >
                    <Play size={15} /> Audio
                  </AdminButton>
                  <AdminButton
                    className="min-h-9 whitespace-nowrap px-3"
                    onClick={event => {
                      event.stopPropagation();
                      void flagNeedsAudioCheck(word);
                    }}
                    disabled={flagging || word.audioReviewStatus === 'needs_review'}
                    aria-disabled={flagging || word.audioReviewStatus === 'needs_review'}
                    title="Needs audio check"
                  >
                    <Flag size={15} /> {word.audioReviewStatus === 'needs_review' ? 'Flagged' : 'Check'}
                  </AdminButton>
                  <AdminButton
                    className="min-h-9 justify-self-start whitespace-nowrap px-3"
                    onClick={event => {
                      event.stopPropagation();
                      navigate(`/admin/word-lists/${word.listId}`);
                    }}
                  >
                    Open list <ExternalLink size={15} />
                  </AdminButton>
                </div>
              </div>
            );
          })}
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
