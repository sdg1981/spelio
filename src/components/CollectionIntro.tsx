import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Pause, Play } from 'lucide-react';
import { PrimaryButton } from './Buttons';
import { Footer } from './Footer';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import type { CollectionIntro as CollectionIntroContent } from '../content/collectionIntro';
import { markCollectionIntroSeen } from '../content/collectionIntro';
import type { InterfaceLanguage, Translate } from '../i18n';
import { getPlayableAudioUrl } from '../lib/audioPlayback';

export function CollectionIntro({
  intro,
  shouldAutoplay,
  interfaceLanguage,
  onBack,
  onHome,
  onStart,
  onInterfaceLanguageChange,
  t
}: {
  intro: CollectionIntroContent;
  shouldAutoplay: boolean;
  interfaceLanguage: InterfaceLanguage;
  onBack: () => void;
  onHome: () => void;
  onStart: () => void;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playbackState, setPlaybackState] = useState<'idle' | 'playing' | 'blocked' | 'failed'>('idle');
  const audioUrl = getPlayableAudioUrl(intro.audioUrl);

  useEffect(() => {
    markCollectionIntroSeen(intro);
  }, [intro.seenKey]);

  useEffect(() => {
    if (!audioUrl) return undefined;
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    audioRef.current = audio;
    audio.onended = () => setPlaybackState('idle');
    audio.onerror = () => setPlaybackState('failed');

    try {
      audio.load();
    } catch {
      // Playback on the explicit button click will retry.
    }

    if (shouldAutoplay) {
      setPlaybackState('playing');
      audio.play()
        .then(() => setPlaybackState('playing'))
        .catch(() => setPlaybackState('blocked'));
    }

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl, shouldAutoplay, intro.seenKey]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playbackState === 'playing') {
      audio.pause();
      setPlaybackState('idle');
      return;
    }

    setPlaybackState('playing');
    try {
      await audio.play();
      setPlaybackState('playing');
    } catch {
      setPlaybackState('failed');
    }
  }

  return (
    <main className="how-page public-info-page foundations-primer-page collection-intro-page">
      <button className="how-back-button foundations-primer-back" type="button" onClick={onBack} aria-label={t('publicPages.backLabel')}>
        <ArrowLeft size={24} strokeWidth={2.1} aria-hidden="true" />
      </button>
      <div className="homepage-utility foundations-primer-language">
        <LanguageSwitcher
          interfaceLanguage={interfaceLanguage}
          onInterfaceLanguageChange={onInterfaceLanguageChange}
          t={t}
          variant="homepageTop"
        />
      </div>

      <div className="how-page-logo public-info-logo foundations-primer-logo">
        <Logo onClick={onHome} backHomeLabel={t('how.backHomeLabel')} />
      </div>

      <section className="foundations-primer-shell collection-intro-shell" aria-labelledby="collection-intro-title">
        <p className="foundations-primer-kicker">{t('collectionIntro.kicker')}</p>
        <h1 id="collection-intro-title">{intro.title}</h1>
        <div className="foundations-primer-body collection-intro-body">
          {intro.body.split('\n').filter(line => line.trim()).map((line, index) => (
            <p key={`${intro.collectionId}-intro-${index}`}>{line.trim()}</p>
          ))}
        </div>

        {audioUrl && (
          <button
            className={`foundations-primer-sound collection-intro-audio ${playbackState === 'playing' ? 'playing' : ''} ${playbackState === 'failed' ? 'failed' : ''}`.trim()}
            type="button"
            onClick={togglePlayback}
            aria-label={playbackState === 'playing' ? t('collectionIntro.pauseAudio') : t('collectionIntro.playAudio')}
          >
            {playbackState === 'playing' ? <Pause size={20} strokeWidth={2.2} aria-hidden="true" /> : <Play size={20} strokeWidth={2.2} aria-hidden="true" />}
            <span>{playbackState === 'playing' ? t('collectionIntro.pause') : t('collectionIntro.play')}</span>
          </button>
        )}

        {audioUrl && playbackState === 'blocked' && (
          <p className="foundations-primer-audio-note" role="note">{t('collectionIntro.autoplayBlocked')}</p>
        )}

        <PrimaryButton className="foundations-primer-start" onClick={onStart}>
          {t('collectionIntro.start')}
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
