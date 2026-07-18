export type BeforeInstallPromptChoiceOutcome = 'accepted' | 'dismissed';

export type BeforeInstallPromptEvent = Event & {
  readonly platforms?: string[];
  readonly userChoice: Promise<{
    outcome: BeforeInstallPromptChoiceOutcome;
    platform: string;
  }>;
  prompt(): Promise<void>;
};

export type InstallPromptState = {
  canInstall: boolean;
  isInstalled: boolean;
  isIosSafari: boolean;
  isStandalone: boolean;
  supportsPrompt: boolean;
};

type InstallPromptSubscriber = (state: InstallPromptState) => void;

// Disabled during Google Play closed testing; reconsider after the wider Android release.
export const ENABLE_AUTOMATIC_PWA_INSTALL_PROMPT = false;

type NavigatorWithInstallHints = Navigator & {
  standalone?: boolean;
  getInstalledRelatedApps?: () => Promise<unknown[]>;
};

type MediaQueryListWithLegacyListener = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

type InstallPromptEnvironment = {
  window?: Window;
  navigator?: NavigatorWithInstallHints;
};

export function isStandaloneDisplayMode(environment: InstallPromptEnvironment = getBrowserEnvironment()) {
  const win = environment.window;
  const nav = environment.navigator ?? win?.navigator as NavigatorWithInstallHints | undefined;
  if (nav?.standalone === true) return true;
  if (!win?.matchMedia) return false;

  return [
    '(display-mode: standalone)',
    '(display-mode: fullscreen)',
    '(display-mode: minimal-ui)'
  ].some(query => {
    try {
      return win.matchMedia(query).matches;
    } catch {
      return false;
    }
  });
}

export function isIosSafari(environment: InstallPromptEnvironment = getBrowserEnvironment()) {
  const nav = environment.navigator ?? environment.window?.navigator;
  const userAgent = nav?.userAgent ?? '';
  const isiOS = /iPad|iPhone|iPod/i.test(userAgent) || (nav as NavigatorWithInstallHints | undefined)?.standalone !== undefined;
  const isSafari = /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);
  return isiOS && isSafari;
}

export function shouldShowInstallAction(state: InstallPromptState) {
  return state.canInstall && !state.isStandalone && !state.isInstalled && state.supportsPrompt;
}

export function shouldShowInstallOptionsNavigation(state: InstallPromptState, isNativeApp: boolean) {
  return !isNativeApp && !state.isStandalone && !state.isInstalled;
}

export class InstallPromptController {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private initialized = false;
  private installed = false;
  private subscribers = new Set<InstallPromptSubscriber>();
  private standaloneQuery: MediaQueryListWithLegacyListener | null = null;

  private handleBeforeInstallPrompt = (event: Event) => {
    if (this.getState().isStandalone || this.installed) return;

    if (!ENABLE_AUTOMATIC_PWA_INSTALL_PROMPT) event.preventDefault();
    this.deferredPrompt = event as BeforeInstallPromptEvent;
    this.notify();
  };

  private handleAppInstalled = () => {
    this.deferredPrompt = null;
    this.installed = true;
    this.notify();
  };

  private handleDisplayModeChange = () => {
    this.notify();
  };

  constructor(private environment: InstallPromptEnvironment = getBrowserEnvironment()) {}

  initialize() {
    const win = this.environment.window;
    if (this.initialized || !win) return;

    this.initialized = true;
    win.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    win.addEventListener('appinstalled', this.handleAppInstalled);
    this.standaloneQuery = typeof win.matchMedia === 'function'
      ? win.matchMedia('(display-mode: standalone)') as MediaQueryListWithLegacyListener
      : null;
    this.standaloneQuery?.addEventListener?.('change', this.handleDisplayModeChange);
    this.standaloneQuery?.addListener?.(this.handleDisplayModeChange);
    void this.refreshInstalledRelatedApps();
  }

  dispose() {
    const win = this.environment.window;
    if (!this.initialized || !win) return;

    win.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    win.removeEventListener('appinstalled', this.handleAppInstalled);
    this.standaloneQuery?.removeEventListener?.('change', this.handleDisplayModeChange);
    this.standaloneQuery?.removeListener?.(this.handleDisplayModeChange);
    this.initialized = false;
    this.standaloneQuery = null;
  }

  subscribe(subscriber: InstallPromptSubscriber) {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  getState(): InstallPromptState {
    const isStandalone = isStandaloneDisplayMode(this.environment);
    const supportsPrompt = Boolean(this.deferredPrompt);

    return {
      canInstall: supportsPrompt && !isStandalone && !this.installed,
      isInstalled: this.installed,
      isIosSafari: isIosSafari(this.environment),
      isStandalone,
      supportsPrompt
    };
  }

  async promptInstall() {
    const promptEvent = this.deferredPrompt;
    if (!promptEvent || !shouldShowInstallAction(this.getState())) return false;

    this.deferredPrompt = null;
    this.notify();

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice.catch(() => null);
    if (choice?.outcome === 'accepted') {
      this.installed = true;
    }

    this.notify();
    return choice?.outcome === 'accepted';
  }

  private notify() {
    const state = this.getState();
    for (const subscriber of this.subscribers) subscriber(state);
  }

  private async refreshInstalledRelatedApps() {
    const relatedApps = await this.environment.navigator?.getInstalledRelatedApps?.().catch(() => []);
    if (relatedApps && relatedApps.length > 0) {
      this.installed = true;
      this.deferredPrompt = null;
      this.notify();
    }
  }
}

function getBrowserEnvironment(): InstallPromptEnvironment {
  if (typeof window === 'undefined') return {};

  return {
    window,
    navigator: navigator as NavigatorWithInstallHints
  };
}

export function createInstallPromptController(environment?: InstallPromptEnvironment) {
  return new InstallPromptController(environment);
}

export const spelioInstallPrompt = createInstallPromptController();
