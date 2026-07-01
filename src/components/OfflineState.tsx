type OfflineStateProps = {
  onRetry?: () => void;
};

export function OfflineState({ onRetry }: OfflineStateProps) {
  return (
    <main className="app-bg offline-app">
      <section className="page-shell offline-shell">
        <div className="logo-text logo-small" aria-label="Spelio">
          Spelio<span className="logo-mark">.</span>
        </div>
        <div className="offline-copy">
          <h1>Spelio needs an internet connection to load.</h1>
          <p>Please reconnect and try again.</p>
        </div>
        <button className="done-button offline-retry-button" type="button" onClick={onRetry ?? (() => window.location.reload())}>
          Retry
        </button>
      </section>
    </main>
  );
}
