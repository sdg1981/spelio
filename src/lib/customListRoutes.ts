export const CUSTOM_LIST_ROUTE_PREFIX = '/custom/';

export function getCustomListPath(publicId: string, options: { practiceTest?: boolean } = {}) {
  return `${CUSTOM_LIST_ROUTE_PREFIX}${encodeURIComponent(publicId)}${options.practiceTest ? '?mode=practice-test' : ''}`;
}

export function getCustomListSharePath(publicId: string) {
  return `/custom-list/${encodeURIComponent(publicId)}/share`;
}

export function getCustomListCanonicalUrl(publicId: string, origin?: string, options: { practiceTest?: boolean } = {}) {
  const baseOrigin = (origin ?? (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
  return `${baseOrigin}${getCustomListPath(publicId, options)}`;
}

export function getCustomListShareUrl(publicId: string, origin?: string) {
  const baseOrigin = (origin ?? (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
  return `${baseOrigin}${getCustomListSharePath(publicId)}`;
}

export function getCustomPublicIdFromPath(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, '');
  if (!normalizedPath.startsWith(CUSTOM_LIST_ROUTE_PREFIX)) return null;
  const rawPublicId = normalizedPath.slice(CUSTOM_LIST_ROUTE_PREFIX.length);
  if (!rawPublicId || rawPublicId.includes('/')) return null;
  try {
    const publicId = decodeURIComponent(rawPublicId);
    return /^[A-Za-z0-9_-]{16,96}$/.test(publicId) ? publicId : null;
  } catch {
    return null;
  }
}

export function getCustomSharePublicIdFromPath(pathname: string) {
  const match = pathname.replace(/\/+$/, '').match(/^\/custom-list\/([^/]+)\/share$/);
  if (!match?.[1]) return null;
  try {
    const publicId = decodeURIComponent(match[1]);
    return /^[A-Za-z0-9_-]{16,96}$/.test(publicId) ? publicId : null;
  } catch {
    return null;
  }
}
