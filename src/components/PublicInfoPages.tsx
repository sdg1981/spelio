import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { FeedbackFormContent, Footer, getFeedbackLearningMethodOptions, getFeedbackSignalOptions } from './Footer';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import type { InterfaceLanguage, Translate } from '../i18n';

type PublicPageShellProps = {
  children: ReactNode;
  interfaceLanguage: InterfaceLanguage;
  onBack: () => void;
  onHome: () => void;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  titleId: string;
  t: Translate;
};

function PublicPageShell({
  children,
  interfaceLanguage,
  onBack,
  onHome,
  onInterfaceLanguageChange,
  titleId,
  t
}: PublicPageShellProps) {
  return (
    <main className="how-page public-info-page">
      <button className="how-back-button" type="button" onClick={onBack} aria-label={t('publicPages.backLabel')}>
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

      <div className="how-page-logo public-info-logo">
        <Logo onClick={onHome} backHomeLabel={t('how.backHomeLabel')} />
      </div>

      <section className="public-info-content" aria-labelledby={titleId}>
        {children}
      </section>

      <Footer
        className="home-footer public-info-footer"
        variant="home"
        interfaceLanguage={interfaceLanguage}
        onInterfaceLanguageChange={onInterfaceLanguageChange}
        t={t}
      />
    </main>
  );
}

export function FeedbackPage({
  interfaceLanguage,
  onBack,
  onHome,
  onInterfaceLanguageChange,
  t
}: {
  interfaceLanguage: InterfaceLanguage;
  onBack: () => void;
  onHome: () => void;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
}) {
  const feedbackSignalOptions = getFeedbackSignalOptions(t);
  const learningMethodOptions = getFeedbackLearningMethodOptions(t);

  return (
    <PublicPageShell
      interfaceLanguage={interfaceLanguage}
      onBack={onBack}
      onHome={onHome}
      onInterfaceLanguageChange={onInterfaceLanguageChange}
      titleId="feedback-page-title"
      t={t}
    >
      <h1 className="public-info-title" id="feedback-page-title">{t('footer.feedback')}</h1>
      <FeedbackFormContent
        t={t}
        feedbackSignalOptions={feedbackSignalOptions}
        learningMethodOptions={learningMethodOptions}
        className="public-feedback-body"
      />
    </PublicPageShell>
  );
}

export function PrivacyPage({
  interfaceLanguage,
  onBack,
  onHome,
  onInterfaceLanguageChange,
  t
}: {
  interfaceLanguage: InterfaceLanguage;
  onBack: () => void;
  onHome: () => void;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
}) {
  return (
    <PublicPageShell
      interfaceLanguage={interfaceLanguage}
      onBack={onBack}
      onHome={onHome}
      onInterfaceLanguageChange={onInterfaceLanguageChange}
      titleId="privacy-page-title"
      t={t}
    >
      <h1 className="public-info-title" id="privacy-page-title">{t('footer.privacyTitle')}</h1>
      <div className="public-info-body modal-text">
        <p>{t('footer.privacyBody1')}</p>
        <p>{t('footer.privacyBody2')}</p>
        <p>{t('footer.privacyBody3')}</p>
        <p>{t('footer.privacyBody4')}</p>
        <p>{t('footer.privacyBody5')}</p>
      </div>
    </PublicPageShell>
  );
}

export function AboutPage({
  interfaceLanguage,
  onBack,
  onHome,
  onInterfaceLanguageChange,
  t
}: {
  interfaceLanguage: InterfaceLanguage;
  onBack: () => void;
  onHome: () => void;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
}) {
  return (
    <PublicPageShell
      interfaceLanguage={interfaceLanguage}
      onBack={onBack}
      onHome={onHome}
      onInterfaceLanguageChange={onInterfaceLanguageChange}
      titleId="about-page-title"
      t={t}
    >
      <h1 className="public-info-title" id="about-page-title">{t('footer.aboutTitle')}</h1>
      <div className="public-info-body modal-text">
        <p>{t('footer.aboutBody1')}</p>
        <p>{t('footer.aboutBody2')}</p>
        <p>{t('footer.aboutBody3')}</p>
        <p>{t('footer.aboutBody4')}</p>
        <p>{t('footer.aboutBody5')}</p>
      </div>
    </PublicPageShell>
  );
}
