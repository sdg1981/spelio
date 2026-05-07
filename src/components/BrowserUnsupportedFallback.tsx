import { createTranslator } from '../i18n';

export function BrowserUnsupportedFallback() {
  const t = createTranslator(window.location.pathname === '/cy' || window.location.pathname.startsWith('/cy/') ? 'cy' : 'en');

  return (
    <main className="app-bg">
      <section className="page-shell home-shell" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <h1 className="modal-title" style={{ margin: 0 }}>
          {t('browser.unsupportedTitle')}
        </h1>
        <p className="modal-text" style={{ maxWidth: 420, margin: '18px 0 0' }}>
          {t('browser.unsupportedBody')}
        </p>
      </section>
    </main>
  );
}
