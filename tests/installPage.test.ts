import {
  APP_STORE_URL,
  GOOGLE_PLAY_STATUS,
  GOOGLE_PLAY_URL,
  detectInstallDevice,
  isGooglePlayLive
} from '../src/lib/installOptions';

declare function require(name: string): {
  existsSync?: (path: string) => boolean;
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

const { existsSync, readFileSync } = require('fs') as {
  existsSync: (path: string) => boolean;
  readFileSync: (path: string, encoding: string) => string;
};

assertEqual(APP_STORE_URL, 'https://apps.apple.com/app/spelio/id6783524504', 'Install page should use the live App Store URL.');
assertEqual(GOOGLE_PLAY_URL, '', 'Google Play URL should remain blank until the real listing is live.');
assertEqual(GOOGLE_PLAY_STATUS, 'coming-soon', 'Google Play should be marked coming soon.');
assertEqual(isGooglePlayLive(), false, 'Google Play should not render as a live store link while URL is blank.');

assertEqual(detectInstallDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), 'ios', 'iPhone should get iOS install priority.');
assertEqual(detectInstallDevice('Mozilla/5.0 (Linux; Android 15; Pixel 9)'), 'android', 'Android should get Android/web app install priority.');
assertEqual(detectInstallDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)', 4), 'ios', 'iPadOS desktop-mode Safari should get iOS install priority.');
assertEqual(detectInstallDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)', 0), 'desktop', 'Desktop should get desktop install priority.');

assert(existsSync('public/store-badges/app-store.svg'), 'App Store badge asset should exist locally.');
assert(existsSync('public/store-badges/google-play.svg'), 'Google Play badge asset should exist locally for the future live state.');

const appSource = readFileSync('src/App.tsx', 'utf8');
assert(appSource.includes("pathname === '/install'"), 'App route detection should include /install.');
assert(appSource.includes("openPublicPage('install', '/install')"), 'Homepage menu callback should navigate to /install.');
assert(appSource.includes('<InstallPage'), 'App should render InstallPage for the install screen.');

const homeSource = readFileSync('src/components/Home.tsx', 'utf8');
assert(homeSource.includes('onInstall'), 'Homepage should accept an install navigation callback.');
assert(homeSource.includes("t('home.installSpelio')"), 'Homepage menu should keep the Install Spelio label.');
assert(!homeSource.includes('promptInstall'), 'Homepage menu should not directly trigger the browser install prompt.');

const installPageSource = readFileSync('src/components/InstallPage.tsx', 'utf8');
assert(installPageSource.includes('useInstallPrompt'), 'Install page should reuse the existing PWA install prompt hook.');
assert(installPageSource.includes("t('install.webAppButton')"), 'Install page should render an install web app button when the prompt is available.');
assert(installPageSource.includes('getWebAppFallbackCopy'), 'Install page should render calm fallback instructions when the prompt is not available.');
assert(installPageSource.includes("t('install.googlePlayComingSoonTitle')"), 'Install page should render Google Play as coming soon while no live URL is configured.');
assert(installPageSource.includes('APP_STORE_URL'), 'Install page should render the configured App Store URL.');

const enSource = readFileSync('src/i18n/en.ts', 'utf8');
const cySource = readFileSync('src/i18n/cy.ts', 'utf8');
assert(enSource.includes('Install Spelio'), 'English install page title should be translated.');
assert(cySource.includes('Gosod Spelio'), 'Welsh install page title should be translated.');

console.log('install page tests passed');
