import { ArrowLeft } from 'lucide-react';
import { Footer } from './Footer';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import { WordListSelectorPanel } from './Practice';
import type { WordList } from '../data/wordLists';
import type { InterfaceLanguage, Translate } from '../i18n';

export function WordListsPage({
  lists,
  initialSelectedIds,
  completedListIds,
  interfaceLanguage,
  onBack,
  onHome,
  onDone,
  onCreateCustomList,
  onInterfaceLanguageChange,
  t
}: {
  lists: WordList[];
  initialSelectedIds: string[];
  completedListIds: string[];
  interfaceLanguage: InterfaceLanguage;
  onBack: () => void;
  onHome: () => void;
  onDone: (selectedIds: string[]) => void;
  onCreateCustomList: () => void;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  t: Translate;
}) {
  return (
    <main className="how-page public-info-page word-lists-page">
      <button className="how-back-button word-lists-back" type="button" onClick={onBack} aria-label={t('publicPages.backLabel')}>
        <ArrowLeft size={24} strokeWidth={2.1} aria-hidden="true" />
      </button>
      <div className="homepage-utility word-lists-language">
        <LanguageSwitcher
          interfaceLanguage={interfaceLanguage}
          onInterfaceLanguageChange={onInterfaceLanguageChange}
          t={t}
          variant="homepageTop"
        />
      </div>

      <div className="how-page-logo public-info-logo word-lists-logo">
        <Logo onClick={onHome} backHomeLabel={t('how.backHomeLabel')} />
      </div>

      <section className="word-lists-content" aria-labelledby="word-lists-page-title">
        <div className="how-hero-copy word-lists-heading">
          <h1 id="word-lists-page-title">{t('wordLists.title')}</h1>
        </div>

        <WordListSelectorPanel
          lists={lists}
          initialSelectedIds={initialSelectedIds}
          completedListIds={completedListIds}
          onClose={onBack}
          onDone={onDone}
          onCreateCustomList={onCreateCustomList}
          interfaceLanguage={interfaceLanguage}
          t={t}
          variant="page"
        />
      </section>

      <Footer
        className="home-footer public-info-footer word-lists-footer"
        variant="home"
        interfaceLanguage={interfaceLanguage}
        onInterfaceLanguageChange={onInterfaceLanguageChange}
        t={t}
      />
    </main>
  );
}
