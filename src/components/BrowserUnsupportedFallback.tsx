export function BrowserUnsupportedFallback() {
  return (
    <main className="app-bg">
      <section className="page-shell home-shell" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <h1 className="modal-title" style={{ margin: 0 }}>
          Browser Not Fully Supported
        </h1>
        <p className="modal-text" style={{ maxWidth: 420, margin: '18px 0 0' }}>
          Spelio may not work correctly on this browser or device. Please try updating your browser or using a recent version of Chrome, Safari, Edge, or Firefox.
        </p>
      </section>
    </main>
  );
}
