const CACHE_NAME = 'spelio-app-shell-v2';
const APP_SHELL_URLS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/spelio-favicon.svg',
  '/spelio-icon-192.png',
  '/spelio-icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname === '/native-app-update-policy.json') return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/'));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (APP_SHELL_URLS.includes(url.pathname)) {
    event.respondWith(networkFirst(request, url.pathname));
  }
});

async function networkFirst(request, fallbackPath) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(fallbackPath, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(fallbackPath);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const offlineFallback = await cache.match('/offline.html');
      if (offlineFallback) return offlineFallback;
    }
    throw new Error('Spelio app shell is not cached.');
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}
