export const SPELIO_PUBLIC_ORIGIN = 'https://spelio.app';

export function isNativeWebViewOrigin(origin: string) {
  return origin.startsWith('capacitor://') || origin.startsWith('ionic://');
}

export function getRuntimeOrigin() {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

export function getPublicOrigin(origin = getRuntimeOrigin()) {
  return isNativeWebViewOrigin(origin) ? SPELIO_PUBLIC_ORIGIN : origin;
}

export function getApiUrl(path: `/${string}`) {
  const origin = getRuntimeOrigin();
  return isNativeWebViewOrigin(origin) ? `${SPELIO_PUBLIC_ORIGIN}${path}` : path;
}
