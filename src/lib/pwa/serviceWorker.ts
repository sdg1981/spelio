export function registerServiceWorker() {
  if (!import.meta.env.PROD) return;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (!window.isSecureContext) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(error => {
      console.info('Spelio service worker registration failed.', error);
    });
  });
}
