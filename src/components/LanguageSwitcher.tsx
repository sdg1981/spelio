import type { InterfaceLanguage, Translate } from '../i18n';

type LanguageSwitcherProps = {
  interfaceLanguage: InterfaceLanguage;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
  variant?: 'footer' | 'homepageTop';
};

export function LanguageSwitcher({
  interfaceLanguage,
  onInterfaceLanguageChange,
  t,
  variant = 'footer'
}: LanguageSwitcherProps) {
  const classes = [
    'language-switcher',
    variant === 'footer' ? 'footer-language-switcher' : 'homepage-language-switcher'
  ].join(' ');

  return (
    <span className={classes} aria-label={t('settings.interfaceLanguage')}>
      <button
        className={interfaceLanguage === 'en' ? 'active' : ''}
        type="button"
        onClick={() => onInterfaceLanguageChange('en')}
        aria-label={t('language.switchToEnglish')}
        aria-pressed={interfaceLanguage === 'en'}
      >
        English
      </button>
      <span aria-hidden="true">·</span>
      <button
        className={interfaceLanguage === 'cy' ? 'active' : ''}
        type="button"
        onClick={() => onInterfaceLanguageChange('cy')}
        aria-label={t('language.switchToWelsh')}
        aria-pressed={interfaceLanguage === 'cy'}
      >
        Cymraeg
      </button>
    </span>
  );
}
