import { getAudioUnavailableStatusText, isBrowserOffline } from '../src/lib/practice/audioAvailability';
import type { Translate } from '../src/i18n';

declare function require(name: string): {
  readFileSync?: (path: string, encoding: string) => string;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};

const offlineHtml = readFileSync('public/offline.html', 'utf8');
const serviceWorkerSource = readFileSync('public/sw.js', 'utf8');
const appSource = readFileSync('src/App.tsx', 'utf8');
const offlineComponentSource = readFileSync('src/components/OfflineState.tsx', 'utf8');
const identityTranslator = ((key: string) => key) as Translate;

assert(offlineHtml.includes('Spelio needs an internet connection to load.'), 'Static offline page should use the approved offline heading.');
assert(offlineHtml.includes('Please reconnect and try again.'), 'Static offline page should use the approved supporting text.');
assert(offlineHtml.includes('window.location.reload()'), 'Static offline page Retry button should reload.');

assert(serviceWorkerSource.includes("'/offline.html'"), 'Service worker should precache the static offline page.');
assert(serviceWorkerSource.includes("cache.match('/offline.html')"), 'Service worker should serve the offline page as a navigation fallback.');
assert(serviceWorkerSource.includes("request.mode === 'navigate'"), 'Offline page should be limited to navigation fallback handling.');

assert(offlineComponentSource.includes('Spelio needs an internet connection to load.'), 'React offline state should use the approved offline heading.');
assert(offlineComponentSource.includes('Please reconnect and try again.'), 'React offline state should use the approved supporting text.');
assert(appSource.includes("publicContentStatus === 'failed'"), 'App should track failed public content loading.');
assert(appSource.includes('<OfflineState'), 'App should render the offline state when usable content is unavailable.');

assertEqual(isBrowserOffline({ onLine: false }), true, 'Navigator offline=false state should be detected.');
assertEqual(isBrowserOffline({ onLine: true }), false, 'Navigator online=true state should not be treated as offline.');
assertEqual(
  getAudioUnavailableStatusText(identityTranslator, { onLine: false }),
  'practice.audioUnavailableOffline',
  'Practice audio failures should use offline-specific copy when the browser is offline.'
);
assertEqual(
  getAudioUnavailableStatusText(identityTranslator, { onLine: true }),
  'practice.audioUnavailable',
  'Practice audio failures should keep general unavailable copy when the browser is online.'
);

console.log('offline fallback tests passed');
