import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Footer } from './Footer';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import { WordListSelectorPanel } from './Practice';
import type { WordList } from '../data/wordLists';
import type { InterfaceLanguage, Translate } from '../i18n';
import { loadRecentCustomLists, removeRecentCustomList, type RecentCustomListReference } from '../lib/customListRecent';
import { resetPublicPageScrollToTop } from '../lib/scrollRestoration';

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
  const [recentCustomLists, setRecentCustomLists] = useState<RecentCustomListReference[]>([]);

  useEffect(() => {
    setRecentCustomLists(loadRecentCustomLists());
  }, []);

  function openRecentCustomList(reference: RecentCustomListReference) {
    window.history.pushState({ spelioPublicPage: true }, '', reference.shareUrl);
    resetPublicPageScrollToTop();
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  function removeRecentReference(publicId: string) {
    removeRecentCustomList(publicId);
    setRecentCustomLists(loadRecentCustomLists());
  }

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

        {recentCustomLists.length > 0 && (
          <section className="word-lists-recent-custom" aria-labelledby="word-lists-recent-custom-title">
            <div>
              <h2 id="word-lists-recent-custom-title">{t('customLists.recentHeading')}</h2>
              <p>{t('customLists.recentSupport')}</p>
            </div>
            <div className="word-lists-recent-custom-links">
              {recentCustomLists.map(reference => (
                <div className="word-lists-recent-custom-item" key={reference.publicId}>
                  <button type="button" onClick={() => openRecentCustomList(reference)}>
                    <span>{reference.title}</span>
                    <small>{t('customLists.recentOpenShare')}</small>
                  </button>
                  <button
                    className="word-lists-recent-custom-remove"
                    type="button"
                    onClick={() => removeRecentReference(reference.publicId)}
                    aria-label={`${t('customLists.recentRemove')} - ${reference.title}`}
                  >
                    {t('customLists.recentRemove')}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

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
