import type { ComponentType } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Ear,
  Eye,
  Globe2,
  Headphones,
  History,
  Languages,
  Lightbulb,
  LibraryBig,
  ListPlus,
  MessageCircle,
  MessageSquareQuote,
  QrCode,
  Route,
  Sparkles,
  Sprout,
  Star,
  SunMoon,
  Timer,
  Volume2,
  Zap
} from 'lucide-react';
import { Footer } from './Footer';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import type { InterfaceLanguage, Translate, TranslationKey } from '../i18n';

type IconComponent = ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>;

type Feature = {
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  icon: IconComponent;
};

const features: Feature[] = [
  {
    titleKey: 'how.features.shortFocused.title',
    bodyKey: 'how.features.shortFocused.body',
    icon: Timer
  },
  {
    titleKey: 'how.features.hearWelsh.title',
    bodyKey: 'how.features.hearWelsh.body',
    icon: Headphones
  },
  {
    titleKey: 'how.features.smartProgression.title',
    bodyKey: 'how.features.smartProgression.body',
    icon: Route
  },
  {
    titleKey: 'how.features.reviewDifficult.title',
    bodyKey: 'how.features.reviewDifficult.body',
    icon: History
  },
  {
    titleKey: 'how.features.gentleRecaps.title',
    bodyKey: 'how.features.gentleRecaps.body',
    icon: Sprout
  },
  {
    titleKey: 'how.features.mixedDialect.title',
    bodyKey: 'how.features.mixedDialect.body',
    icon: Globe2
  },
  {
    titleKey: 'how.features.customListSharing.title',
    bodyKey: 'how.features.customListSharing.body',
    icon: ListPlus
  },
  {
    titleKey: 'how.features.recallPause.title',
    bodyKey: 'how.features.recallPause.body',
    icon: Ear
  },
  {
    titleKey: 'how.features.spellingHints.title',
    bodyKey: 'how.features.spellingHints.body',
    icon: Lightbulb
  },
  {
    titleKey: 'how.features.spellingModes.title',
    bodyKey: 'how.features.spellingModes.body',
    icon: BadgeCheck
  },
  {
    titleKey: 'how.features.revealNextLetter.title',
    bodyKey: 'how.features.revealNextLetter.body',
    icon: Star
  },
  {
    titleKey: 'how.features.fullAnswerPeek.title',
    bodyKey: 'how.features.fullAnswerPeek.body',
    icon: Eye
  },
  {
    titleKey: 'how.features.realWorldPhrases.title',
    bodyKey: 'how.features.realWorldPhrases.body',
    icon: MessageCircle
  },
  {
    titleKey: 'how.features.growingCollections.title',
    bodyKey: 'how.features.growingCollections.body',
    icon: LibraryBig
  },
  {
    titleKey: 'how.features.fromEarlier.title',
    bodyKey: 'how.features.fromEarlier.body',
    icon: History
  },
  {
    titleKey: 'how.features.promptFreePractice.title',
    bodyKey: 'how.features.promptFreePractice.body',
    icon: MessageSquareQuote
  },
  {
    titleKey: 'how.features.listenOrTranslate.title',
    bodyKey: 'how.features.listenOrTranslate.body',
    icon: Languages
  },
  {
    titleKey: 'how.features.instantFeedback.title',
    bodyKey: 'how.features.instantFeedback.body',
    icon: Zap
  },
  {
    titleKey: 'how.features.audioReplay.title',
    bodyKey: 'how.features.audioReplay.body',
    icon: Volume2
  },
  {
    titleKey: 'how.features.spellingPatternLists.title',
    bodyKey: 'how.features.spellingPatternLists.body',
    icon: BookOpen
  },
  {
    titleKey: 'how.features.calmDesignSounds.title',
    bodyKey: 'how.features.calmDesignSounds.body',
    icon: Sparkles
  },
  {
    titleKey: 'how.features.lightDarkModes.title',
    bodyKey: 'how.features.lightDarkModes.body',
    icon: SunMoon
  },
  {
    titleKey: 'how.features.bilingualInterface.title',
    bodyKey: 'how.features.bilingualInterface.body',
    icon: Globe2
  },
  {
    titleKey: 'how.features.shareLinksQr.title',
    bodyKey: 'how.features.shareLinksQr.body',
    icon: QrCode
  },
  {
    titleKey: 'how.features.practiceTestSharing.title',
    bodyKey: 'how.features.practiceTestSharing.body',
    icon: BadgeCheck
  }
];

export function HowSpelioWorks({
  onHome,
  interfaceLanguage,
  onInterfaceLanguageChange,
  t
}: {
  onHome: () => void;
  interfaceLanguage: InterfaceLanguage;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
}) {
  return (
    <main className="how-page">
      <button className="how-back-button" type="button" onClick={onHome} aria-label={t('how.backHomeLabel')}>
        <ArrowLeft size={24} strokeWidth={2.1} />
      </button>
      <div className="homepage-utility">
        <LanguageSwitcher
          interfaceLanguage={interfaceLanguage}
          onInterfaceLanguageChange={onInterfaceLanguageChange}
          t={t}
          variant="homepageTop"
        />
      </div>

      <section className="how-hero" aria-labelledby="how-spelio-works-title">
        <div className="how-page-logo">
          <Logo onClick={onHome} backHomeLabel={t('how.backHomeLabel')} />
        </div>

        <div className="how-hero-copy">
          <h1 id="how-spelio-works-title">{t('how.heroHeading')}</h1>
          <p>{t('how.heroSupport')}</p>
        </div>

        <DeviceMockup t={t} />
      </section>

      <section className="how-editorial" aria-labelledby="how-editorial-title">
        <h2 id="how-editorial-title">{t('how.editorialHeading')}</h2>
        <p>{t('how.editorialBody')}</p>
      </section>

      <section className="how-features" id="features" aria-label={t('how.featuresAriaLabel')}>
        {features.map(feature => (
          <FeatureItem key={feature.titleKey} feature={feature} t={t} />
        ))}
      </section>

      <section className="how-cta how-cta-single" aria-label={t('how.nextStepsAriaLabel')}>
        <button className="how-cta-button how-cta-primary" type="button" onClick={onHome}>
          <span>{t('how.startPractice')}</span>
          <ArrowRight size={26} strokeWidth={2.3} />
        </button>
      </section>

      <Footer
        className="home-footer"
        variant="home"
        interfaceLanguage={interfaceLanguage}
        onInterfaceLanguageChange={onInterfaceLanguageChange}
        t={t}
      />
    </main>
  );
}

function FeatureItem({ feature, t }: { feature: Feature; t: Translate }) {
  const Icon = feature.icon;

  return (
    <article className="how-feature">
      <span className="how-icon-circle how-feature-icon" aria-hidden="true">
        <Icon size={32} strokeWidth={1.85} />
      </span>
      <div>
        <h2>{t(feature.titleKey)}</h2>
        <p>{t(feature.bodyKey)}</p>
      </div>
    </article>
  );
}

function DeviceMockup({ t }: { t: Translate }) {
  return (
    <div className="how-device-wrap">
      <img
        className="how-device-image"
        src="/spelio-practice-screens.png"
        width="1609"
        height="977"
        alt={t('how.imageAlt')}
      />
    </div>
  );
}
