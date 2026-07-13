import {
  ENABLE_AUTOMATIC_PWA_INSTALL_PROMPT,
  type BeforeInstallPromptEvent,
  createInstallPromptController,
  isStandaloneDisplayMode,
  shouldShowInstallAction
} from '../src/lib/pwa/installPrompt';

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

class FakeMediaQueryList extends EventTarget {
  onchange: ((event: MediaQueryListEvent) => void) | null = null;
  media = '(display-mode: standalone)';

  constructor(public matches: boolean) {
    super();
  }

  addListener(listener: (event: MediaQueryListEvent) => void) {
    this.addEventListener('change', listener as EventListener);
  }

  removeListener(listener: (event: MediaQueryListEvent) => void) {
    this.removeEventListener('change', listener as EventListener);
  }

  dispatchChange() {
    this.dispatchEvent(new Event('change') as MediaQueryListEvent);
  }
}

class FakeWindow extends EventTarget {
  navigator = {
    userAgent: 'Mozilla/5.0 Chrome/126.0 Safari/537.36'
  };
  mediaQueryList = new FakeMediaQueryList(false);

  matchMedia() {
    return this.mediaQueryList;
  }
}

class FakeBeforeInstallPromptEvent extends Event implements BeforeInstallPromptEvent {
  readonly platforms = ['web'];
  readonly userChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });
  promptCalls = 0;

  constructor() {
    super('beforeinstallprompt', { cancelable: true });
  }

  async prompt() {
    this.promptCalls += 1;
  }
}

const { existsSync, readFileSync } = require('fs') as {
  existsSync: (path: string) => boolean;
  readFileSync: (path: string, encoding: string) => string;
};

const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8')) as {
  name?: string;
  short_name?: string;
  description?: string;
  start_url?: string;
  scope?: string;
  display?: string;
  theme_color?: string;
  background_color?: string;
  icons?: Array<{ src?: string; sizes?: string; type?: string }>;
};

assertEqual(manifest.name, 'Spelio', 'Manifest should use the full app name.');
assertEqual(manifest.short_name, 'Spelio', 'Manifest should use the short app name.');
assertEqual(
  manifest.description,
  'Spelio is a focused Welsh spelling practice app for learners. Listen to Welsh, learn spelling patterns, recall words and type the correct spelling.',
  'Manifest should use the homepage app description.'
);
assertEqual(manifest.start_url, '/', 'Manifest should start at the app root.');
assertEqual(manifest.scope, '/', 'Manifest should scope the app to root.');
assertEqual(manifest.display, 'standalone', 'Manifest should request standalone display.');
assertEqual(manifest.theme_color, '#d90000', 'Manifest should match the public UI theme colour.');
assertEqual(manifest.background_color, '#f6f5f2', 'Manifest should match the warm public background.');
assert(manifest.icons?.some(icon => icon.src === '/spelio-icon-192.png' && icon.sizes === '192x192' && icon.type === 'image/png'), 'Manifest should include a 192px PNG icon.');
assert(manifest.icons?.some(icon => icon.src === '/spelio-icon-512.png' && icon.sizes === '512x512' && icon.type === 'image/png'), 'Manifest should include a 512px PNG icon.');
assert(existsSync('public/spelio-icon-192.png'), '192px install icon should exist.');
assert(existsSync('public/spelio-icon-512.png'), '512px install icon should exist.');
assertEqual(ENABLE_AUTOMATIC_PWA_INSTALL_PROMPT, false, 'Automatic PWA prompting should remain disabled during Google Play closed testing.');

{
  const fakeWindow = new FakeWindow();
  const controller = createInstallPromptController({
    window: fakeWindow as unknown as Window,
    navigator: fakeWindow.navigator as Navigator
  });

  assertEqual(shouldShowInstallAction(controller.getState()), false, 'Install action should be hidden before a browser prompt is available.');
}

{
  const fakeWindow = new FakeWindow();
  fakeWindow.mediaQueryList.matches = true;
  const controller = createInstallPromptController({
    window: fakeWindow as unknown as Window,
    navigator: fakeWindow.navigator as Navigator
  });
  controller.initialize();
  fakeWindow.dispatchEvent(new FakeBeforeInstallPromptEvent());

  assertEqual(isStandaloneDisplayMode({ window: fakeWindow as unknown as Window, navigator: fakeWindow.navigator as Navigator }), true, 'Standalone display mode should be detected.');
  assertEqual(shouldShowInstallAction(controller.getState()), false, 'Install action should be hidden in standalone mode.');
}

async function runPromptActionTest() {
  const fakeWindow = new FakeWindow();
  const controller = createInstallPromptController({
    window: fakeWindow as unknown as Window,
    navigator: fakeWindow.navigator as Navigator
  });
  const promptEvent = new FakeBeforeInstallPromptEvent();
  controller.initialize();
  fakeWindow.dispatchEvent(promptEvent);

  assertEqual(promptEvent.defaultPrevented, true, 'Capturing the prompt should suppress unsolicited browser installation UI.');
  assertEqual(promptEvent.promptCalls, 0, 'Capturing the prompt should not trigger installation automatically.');
  assertEqual(shouldShowInstallAction(controller.getState()), true, 'Install action should show after the browser prompt is captured.');
  await controller.promptInstall();
  assertEqual(promptEvent.promptCalls, 1, 'Install action should call the captured browser prompt.');
  assertEqual(shouldShowInstallAction(controller.getState()), false, 'Install action should hide after an accepted install prompt.');
}

void runPromptActionTest().then(() => {
  console.log('pwa install prompt tests passed');
});
