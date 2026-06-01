import { useEffect, useState } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { PrimaryButton } from './Buttons';
import { Footer } from './Footer';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import type { FoundationsPrimer as FoundationsPrimerContent, PrimerSoundItem } from '../content/foundationsPrimer';
import type { InterfaceLanguage, Translate } from '../i18n';
import { playPrimerSound, preloadPrimerSounds } from '../lib/foundationsPrimerAudio';

export function FoundationsPrimer({
  primer,
  audioPrompts,
  interfaceLanguage,
  onBack,
  onHome,
  onStartPractice,
  onInterfaceLanguageChange,
  t
}: {
  primer: FoundationsPrimerContent;
  audioPrompts: boolean;
  interfaceLanguage: InterfaceLanguage;
  onBack: () => void;
  onHome: () => void;
  onStartPractice: () => void;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
}) {
  useEffect(() => {
    preloadPrimerSounds(primer.soundItems);
  }, [primer.soundItems]);

  return (
    <main className="how-page public-info-page foundations-primer-page">
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

      <section className="foundations-primer-shell" aria-labelledby="foundations-primer-title">
        <p className="foundations-primer-kicker">{t('primer.kicker')}</p>
        <h1 id="foundations-primer-title">{primer.title}</h1>
        <div className="foundations-primer-body">
          {primer.body.split('\n').map((line, index) => (
            <p key={`${primer.listId}-body-${index}`}>{line.replace(/^\*\s*/, '')}</p>
          ))}
        </div>

        {primer.soundItems.length > 0 && (
          <div className="foundations-primer-sounds" aria-label={t('primer.soundButtonsLabel')}>
            {primer.soundItems.map(item => (
              <PrimerSoundButton key={item.id} item={item} t={t} />
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

function PrimerSoundButton({ item, t }: { item: PrimerSoundItem; t: Translate }) {
  const [state, setState] = useState<'idle' | 'playing' | 'failed'>('idle');

  async function playSound() {
    setState('playing');
    try {
      const played = await playPrimerSound(item);
      setState(played ? 'idle' : 'failed');
    } catch {
      setState('failed');
    }
  }

  return (
    <button
      className={`foundations-primer-sound ${state === 'playing' ? 'playing' : ''} ${state === 'failed' ? 'failed' : ''}`.trim()}
      type="button"
      onClick={playSound}
      aria-busy={state === 'playing'}
      aria-label={`${t('primer.playSound')} ${item.label}`}
    >
      <Volume2 size={20} strokeWidth={2.2} aria-hidden="true" />
      <span>{item.label}</span>
    </button>
  );
}
