import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { Volume2 } from 'lucide-react';
import { PrimaryButton } from './Buttons';
import { Footer } from './Footer';
import { Logo } from './Logo';
import { PublicPageUtilityHeader } from './PublicInfoPages';
import type { FoundationsPrimer as FoundationsPrimerContent, PrimerSoundItem } from '../content/foundationsPrimer';
import type { WordList } from '../data/wordLists';
import type { InterfaceLanguage, Translate } from '../i18n';
import type { DefaultAudioProvider } from '../lib/audioProvider';
import { playPrimerSound, preloadPrimerSounds, resolvePrimerSoundPracticeAudio, stopPrimerAudio } from '../lib/foundationsPrimerAudio';

export function FoundationsPrimer({
  primer,
  wordList,
  wordLists,
  defaultAudioProvider,
  audioPrompts,
  interfaceLanguage,
  onBack,
  onHome,
  onStartPractice,
  onInterfaceLanguageChange,
  t
}: {
  primer: FoundationsPrimerContent;
  wordList: WordList | null;
  wordLists: WordList[];
  defaultAudioProvider: DefaultAudioProvider;
  audioPrompts: boolean;
  interfaceLanguage: InterfaceLanguage;
  onBack: () => void;
  onHome: () => void;
  onStartPractice: () => void;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
}) {
  const [soundsPrepared, setSoundsPrepared] = useState(false);
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const practiceWords = useMemo(
    () => [
      ...(wordList?.words ?? []),
      ...wordLists.filter(list => list.id !== wordList?.id).flatMap(list => list.words)
    ],
    [wordList, wordLists]
  );
  const soundItems = useMemo(
    () => primer.soundItems.map(item => resolvePrimerSoundPracticeAudio(item, practiceWords, defaultAudioProvider)),
    [defaultAudioProvider, practiceWords, primer.soundItems]
  );

  useEffect(() => {
    let cancelled = false;
    setPlayingSoundId(null);
    setSoundsPrepared(soundItems.length === 0);
    void preloadPrimerSounds(soundItems).finally(() => {
      if (!cancelled) setSoundsPrepared(true);
    });
    return () => {
      cancelled = true;
      stopPrimerAudio();
    };
  }, [soundItems]);

  function playSound(item: PrimerSoundItem) {
    setPlayingSoundId(item.id);
    void playPrimerSound(item, () => {
      setPlayingSoundId(currentId => currentId === item.id ? null : currentId);
    });
  }

  return (
    <main className="how-page public-info-page foundations-primer-page">
      <PublicPageUtilityHeader
        className="foundations-primer-utility-header"
        interfaceLanguage={interfaceLanguage}
        onBack={onBack}
        onInterfaceLanguageChange={onInterfaceLanguageChange}
        t={t}
      />

      <div className="how-page-logo public-info-logo foundations-primer-logo">
        <Logo onClick={onHome} backHomeLabel={t('how.backHomeLabel')} />
      </div>

      <section className="foundations-primer-shell" aria-labelledby="foundations-primer-title">
        <p className="foundations-primer-kicker">{t('primer.kicker')}</p>
        <h1 id="foundations-primer-title">{primer.title}</h1>
        <div className="foundations-primer-body">
          {primer.body.split('\n').map((line, index) => (
            <p key={`${primer.listId}-body-${index}`}>{line.replace(/^\*\s*/, '')}</p>
          ))}
        </div>

        {soundItems.length > 0 && (
          <div className="foundations-primer-sounds" aria-label={t('primer.soundButtonsLabel')}>
            {soundItems.map(item => (
              <PrimerSoundButton
                key={`${primer.listId}:${item.id}`}
                disabled={!soundsPrepared}
                isPlaying={playingSoundId === item.id}
                item={item}
                onPlay={playSound}
                t={t}
              />
            ))}
          </div>
        )}

        {!audioPrompts && (
          <p className="foundations-primer-audio-note" role="note">
            {t('primer.audioOffNote')}
          </p>
        )}

        <PrimaryButton className="foundations-primer-start" onClick={onStartPractice}>
          {t('primer.startPractice')}
        </PrimaryButton>
      </section>

      <Footer
        className="home-footer public-info-footer foundations-primer-footer"
        variant="home"
        interfaceLanguage={interfaceLanguage}
        onInterfaceLanguageChange={onInterfaceLanguageChange}
        t={t}
      />
    </main>
  );
}

function PrimerSoundButton({
  disabled,
  isPlaying,
  item,
  onPlay,
  t
}: {
  disabled: boolean;
  isPlaying: boolean;
  item: PrimerSoundItem;
  onPlay: (item: PrimerSoundItem) => void;
  t: Translate;
}) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    // Pointer/touch clicks should not leave WebKit's button focus styling behind.
    // Keyboard-generated clicks have detail 0 and retain their visible focus.
    if (event.detail > 0) event.currentTarget.blur();
    onPlay(item);
  }

  return (
    <button
      className={`foundations-primer-sound${isPlaying ? ' playing' : ''}`}
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-busy={disabled || isPlaying}
      aria-label={`${t('primer.playSound')} ${item.label}`}
    >
      <Volume2 size={20} strokeWidth={2.2} aria-hidden="true" />
      <span>{item.label}</span>
    </button>
  );
}
