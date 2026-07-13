export const APP_STORE_URL = 'https://apps.apple.com/app/spelio/id6783524504';
export const GOOGLE_PLAY_URL = '';
export const GOOGLE_PLAY_STATUS: 'closed-testing' | 'live' = 'closed-testing';

export type InstallDevice = 'ios' | 'android' | 'desktop';
export type InstallOptionId = 'appStore' | 'android' | 'webApp';

export function detectInstallDevice(userAgent: string, maxTouchPoints = 0): InstallDevice {
  const isiPadOSDesktopMode = /Macintosh/i.test(userAgent) && maxTouchPoints > 1;
  if (/iPad|iPhone|iPod/i.test(userAgent) || isiPadOSDesktopMode) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'desktop';
}

export function getCurrentInstallDevice(): InstallDevice {
  if (typeof navigator === 'undefined') return 'desktop';
  return detectInstallDevice(navigator.userAgent, navigator.maxTouchPoints);
}

export function isGooglePlayLive() {
  return GOOGLE_PLAY_STATUS === 'live' && GOOGLE_PLAY_URL.trim().length > 0;
}

export function getInstallOptionOrder(_device: InstallDevice): InstallOptionId[] {
  return ['android', 'appStore', 'webApp'];
}
