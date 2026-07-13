import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import {
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
  getCurrentInstallDevice,
  getInstallOptionOrder,
  isGooglePlayLive,
  type InstallDevice
} from '../lib/installOptions';
import type { InterfaceLanguage, Translate } from '../i18n';
import { PublicPageShell } from './PublicInfoPages';

type InstallPageProps = {
  interfaceLanguage: InterfaceLanguage;
  onBack: () => void;
  onHome: () => void;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
};

export function InstallPage({
  interfaceLanguage,
  onBack,
  onHome,
  onInterfaceLanguageChange,
  t
}: InstallPageProps) {
  const installDevice = useMemo(() => getCurrentInstallDevice(), []);
  const installOptionOrder = useMemo(() => getInstallOptionOrder(installDevice), [installDevice]);
  const { canInstall, isInstalled, isStandalone, promptInstall } = useInstallPrompt();
  const googlePlayLive = isGooglePlayLive();
  const webAppKnownInstalled = isInstalled && !isStandalone;
  const webAppButtonLabel = webAppKnownInstalled
    ? t('install.webAppOpenButton')
    : canInstall
      ? t('install.webAppButton')
      : t('install.webAppUseButton');
  const handleWebAppAction = canInstall
    ? () => void promptInstall()
    : onHome;
  const installOptions = {
    appStore: (
      <InstallOption
        key="appStore"
        eyebrow={t('install.appStoreEyebrow')}
        title={t('install.appStoreTitle')}
        body={t('install.appStoreBody')}
        action={(
          <div className="install-option-actions">
            <a className="install-badge-link" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              <img src="/store-badges/app-store.svg" alt={t('install.appStoreBadgeAlt')} />
            </a>
            <a className="install-feedback-link" href="/feedback">{t('install.appStoreFeedbackLink')}</a>
          </div>
        )}
      />
    ),
    android: (
      <InstallOption
        key="android"
        primary
        eyebrow={t('install.googlePlayEyebrow')}
        title={googlePlayLive ? t('install.googlePlayTitle') : t('install.androidTitle')}
        subheading={googlePlayLive ? undefined : t('install.androidSubheading')}
        body={googlePlayLive ? t('install.googlePlayBody') : (
          <>
            <p>{t('install.androidTestingBody')}</p>
            <p>{t('install.androidAccessBody')}</p>
            <p>{t('install.androidFeedbackBody')}</p>
          </>
        )}
        action={googlePlayLive ? (
          <a className="install-badge-link" href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer">
            <img src="/store-badges/google-play.svg" alt={t('install.googlePlayBadgeAlt')} />
          </a>
        ) : (
          <a className="install-web-button" href="/feedback">{t('install.androidButton')}</a>
        )}
      />
    ),
    webApp: (
      <InstallOption
        key="webApp"
        eyebrow={t('install.webAppEyebrow')}
        title={t('install.webAppTitle')}
        body={isStandalone ? t('install.webAppInstalledBody') : canInstall ? t('install.webAppAvailableBody') : getWebAppFallbackCopy(installDevice, t)}
        action={isStandalone ? (
          <span className="install-installed-badge">{t('install.webAppInstalledBadge')}</span>
        ) : (
          <button className="install-web-button" type="button" onClick={handleWebAppAction}>
            {webAppButtonLabel}
          </button>
        )}
      />
    )
  };

  return (
    <PublicPageShell
      contentClassName="install-page-content"
      interfaceLanguage={interfaceLanguage}
      onBack={onBack}
      onHome={onHome}
      onInterfaceLanguageChange={onInterfaceLanguageChange}
      titleId="install-page-title"
      t={t}
    >
      <h1 className="public-info-title" id="install-page-title">{t('install.title')}</h1>
      <div className="install-page-intro">
        <p>{t('install.introRefining')}</p>
        <p>{t('install.introMobile')}</p>
        <p>{t('install.introFeedback')}</p>
      </div>

      <div className="install-options" aria-label={t('install.optionsLabel')}>
        {installOptionOrder.map(optionId => installOptions[optionId])}
      </div>
    </PublicPageShell>
  );
}

function getWebAppFallbackCopy(device: InstallDevice, t: Translate) {
  if (device === 'ios') return t('install.webAppIosFallbackBody');
  if (device === 'android') return t('install.webAppAndroidFallbackBody');
  return t('install.webAppDesktopFallbackBody');
}

function InstallOption({
  action,
  body,
  eyebrow,
  primary,
  subheading,
  title
}: {
  action?: ReactNode;
  body: ReactNode;
  eyebrow: string;
  primary?: boolean;
  subheading?: string;
  title: string;
}) {
  return (
    <section className={['install-option', primary ? 'install-option-primary' : ''].filter(Boolean).join(' ')}>
      <div className="install-option-copy">
        <p className="install-option-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {subheading && <p className="install-option-subheading">{subheading}</p>}
        <div className="install-option-body">{typeof body === 'string' ? <p>{body}</p> : body}</div>
      </div>
      {action && <div className="install-option-action">{action}</div>}
    </section>
  );
}
