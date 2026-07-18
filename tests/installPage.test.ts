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
assertEqual(GOOGLE_PLAY_STATUS, 'closed-testing', 'Google Play should be marked as closed testing.');
assertEqual(isGooglePlayLive(), false, 'Google Play should not render as a live store link while URL is blank.');

assertEqual(detectInstallDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), 'ios', 'iPhone should get iOS install priority.');
assertEqual(detectInstallDevice('Mozilla/5.0 (Linux; Android 15; Pixel 9)'), 'android', 'Android should get Android/web app install priority.');
assertEqual(detectInstallDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)', 4), 'ios', 'iPadOS desktop-mode Safari should get iOS install priority.');
assertEqual(detectInstallDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)', 0), 'desktop', 'Desktop should get desktop install priority.');
assertEqual(getInstallOptionOrder('ios').join(','), 'android,appStore,webApp', 'iOS should use the temporary beta-period order.');
assertEqual(getInstallOptionOrder('android').join(','), 'android,appStore,webApp', 'Android should use the temporary beta-period order.');
assertEqual(getInstallOptionOrder('desktop').join(','), 'android,appStore,webApp', 'Desktop should use the temporary beta-period order.');

assert(existsSync('public/store-badges/app-store.svg'), 'App Store badge asset should exist locally.');
assert(existsSync('public/store-badges/google-play.svg'), 'Google Play badge asset should exist locally for the future live state.');

const appSource = readFileSync('src/App.tsx', 'utf8');
assert(appSource.includes("pathname === '/install'"), 'App route detection should include /install.');
assert(appSource.includes("openPublicPage('install', '/install')"), 'Homepage menu callback should navigate to /install.');
assert(appSource.includes('<InstallPage'), 'App should render InstallPage for the install screen.');

const homeSource = readFileSync('src/components/Home.tsx', 'utf8');
assert(homeSource.includes('onInstall'), 'Homepage should accept an install navigation callback.');
assert(homeSource.includes("t('home.installSpelio')"), 'Homepage menu should keep the install-options navigation entry.');
assert(homeSource.includes('showInstallOptions &&'), 'Homepage menu should hide Install options in installed app runtimes.');
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
assert(installPageSource.includes('href="/feedback"'), 'Install page should reuse the existing feedback form for beta access and private feedback.');
assert(installPageSource.includes("t('install.appStoreFeedbackLink')"), 'iPhone card should offer a private feedback link.');
assert(!installPageSource.includes("t('install.comingSoon')"), 'Install page should not render a duplicated coming-soon pill.');
assert(installPageSource.includes('APP_STORE_URL'), 'Install page should render the configured App Store URL.');

const enSource = readFileSync('src/i18n/en.ts', 'utf8');
const cySource = readFileSync('src/i18n/cy.ts', 'utf8');
assert(enSource.includes('Help improve Spelio before its wider launch'), 'English beta-period title should be translated.');
assert(enSource.includes("installSpelio: 'Install options'"), 'English homepage navigation should describe the installation-options page.');
assert(enSource.includes('Private feedback is incredibly valuable'), 'English intro should prioritise private feedback.');
assert(enSource.includes('Join the Android beta'), 'English Android card should recruit beta testers.');
assert(enSource.includes('Request Android beta access'), 'English Android beta request button should be translated.');
assert(enSource.includes('Help test on iPhone'), 'English iPhone testing card should be translated.');
assert(enSource.includes('Already installed'), 'English installed state should be passive.');
assert(enSource.includes('best testing experience during this pre-launch period'), 'English web app copy should present it as an alternative during testing.');
assert(cySource.includes('Helpwch i wella Spelio cyn ei lansio’n ehangach'), 'Welsh beta-period title should be translated.');
assert(cySource.includes("installSpelio: 'Opsiynau gosod'"), 'Welsh homepage navigation should describe the installation-options page.');
assert(cySource.includes('Mae adborth preifat yn hynod werthfawr'), 'Welsh intro should prioritise private feedback.');
assert(cySource.includes('Ymunwch â beta Android'), 'Welsh Android beta guidance should be translated.');
assert(cySource.includes('Anfon adborth preifat'), 'Welsh private feedback link should be translated.');
assert(cySource.includes('Eisoes wedi’i osod'), 'Welsh installed state should be translated.');

console.log('install page tests passed');
