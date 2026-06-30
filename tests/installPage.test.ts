import {
  APP_STORE_URL,
  GOOGLE_PLAY_STATUS,
  GOOGLE_PLAY_URL,
  detectInstallDevice,
  getInstallOptionOrder,
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
assertEqual(getInstallOptionOrder('ios').join(','), 'appStore,webApp,android', 'iOS should show App Store first and keep web app visible.');
assertEqual(getInstallOptionOrder('android').join(','), 'android,webApp,appStore', 'Android should show Android guidance before web app and App Store.');
assertEqual(getInstallOptionOrder('desktop').join(','), 'webApp,appStore,android', 'Desktop should show web app first while keeping store options visible.');

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
assert(installPageSource.includes("t('install.webAppOpenButton')"), 'Install page should preserve the browser open CTA when a web app is known installed.');
assert(installPageSource.includes("t('install.webAppInstalledBadge')"), 'Install page should render a passive installed badge in standalone mode.');
assert(installPageSource.includes('install-installed-badge'), 'Standalone installed state should not use the primary install CTA.');
assert(installPageSource.includes("t('install.webAppUseButton')"), 'Install page should render a safe use CTA when the browser prompt is unavailable.');
assert(installPageSource.includes('getWebAppFallbackCopy'), 'Install page should render calm fallback instructions when the prompt is not available.');
assert(installPageSource.includes("t('install.androidTitle')"), 'Install page should render Android-first guidance while Google Play is not live.');
assert(!installPageSource.includes("t('install.comingSoon')"), 'Install page should not render a duplicated coming-soon pill.');
assert(installPageSource.includes('APP_STORE_URL'), 'Install page should render the configured App Store URL.');

const enSource = readFileSync('src/i18n/en.ts', 'utf8');
const cySource = readFileSync('src/i18n/cy.ts', 'utf8');
assert(enSource.includes('Install Spelio'), 'English install page title should be translated.');
assert(enSource.includes('Use Spelio on your device or directly in your browser.'), 'English install intro should be warmer and device-aware.');
assert(enSource.includes('Install on Android'), 'English Android guidance should not be centred on a dead-end coming-soon title.');
assert(enSource.includes('Already installed'), 'English installed state should be passive.');
assert(enSource.includes('Use Spelio in your browser, or install it as a web app where supported.'), 'English browser fallback should be concise.');
assert(cySource.includes('Gosod Spelio'), 'Welsh install page title should be translated.');
assert(cySource.includes('Defnyddiwch Spelio ar eich dyfais neu yn uniongyrchol yn eich porwr.'), 'Welsh install intro should be translated.');
assert(cySource.includes('Gosod ar Android'), 'Welsh Android guidance should be translated.');
assert(cySource.includes('Eisoes wedi’i osod'), 'Welsh installed state should be translated.');

console.log('install page tests passed');
