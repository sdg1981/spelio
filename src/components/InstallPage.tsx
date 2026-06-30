import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import {
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
  getCurrentInstallDevice,
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
  const { canInstall, promptInstall } = useInstallPrompt();
  const googlePlayLive = isGooglePlayLive();

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
      <p className="install-page-intro">{t('install.intro')}</p>

      <div className="install-options" aria-label={t('install.optionsLabel')}>
        <InstallOption
          primary={installDevice === 'ios'}
          eyebrow={t('install.appStoreEyebrow')}
          title={t('install.appStoreTitle')}
          body={t('install.appStoreBody')}
          action={(
            <a className="install-badge-link" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              <img src="/store-badges/app-store.svg" alt={t('install.appStoreBadgeAlt')} />
            </a>
          )}
        />

        <InstallOption
          eyebrow={t('install.googlePlayEyebrow')}
          title={googlePlayLive ? t('install.googlePlayTitle') : t('install.googlePlayComingSoonTitle')}
          body={googlePlayLive ? t('install.googlePlayBody') : t('install.googlePlayComingSoonBody')}
          action={googlePlayLive ? (
            <a className="install-badge-link" href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer">
              <img src="/store-badges/google-play.svg" alt={t('install.googlePlayBadgeAlt')} />
            </a>
          ) : (
            <span className="install-coming-soon">{t('install.comingSoon')}</span>
          )}
        />

        <InstallOption
          primary={installDevice !== 'ios'}
          eyebrow={t('install.webAppEyebrow')}
          title={t('install.webAppTitle')}
          body={canInstall ? t('install.webAppAvailableBody') : getWebAppFallbackCopy(installDevice, t)}
          action={canInstall ? (
            <button className="install-web-button" type="button" onClick={() => void promptInstall()}>
              {t('install.webAppButton')}
            </button>
          ) : null}
        />
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
  title
}: {
  action?: ReactNode;
  body: string;
  eyebrow: string;
  primary?: boolean;
  title: string;
}) {
  return (
    <section className={['install-option', primary ? 'install-option-primary' : ''].filter(Boolean).join(' ')}>
      <div className="install-option-copy">
        <p className="install-option-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      {action && <div className="install-option-action">{action}</div>}
    </section>
  );
}
