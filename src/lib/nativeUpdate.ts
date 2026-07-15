import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SPELIO_PUBLIC_ORIGIN } from './nativeOrigin';

export type NativeUpdatePlatform = 'ios' | 'android';

export type NativeUpdatePolicyEntry = {
  latestVersion: string;
  minimumSupportedVersion: string;
  noticeEnabled: boolean;
  releaseNotes: string;
  storeUrl: string | null;
};

export type NativeUpdatePolicy = Record<NativeUpdatePlatform, NativeUpdatePolicyEntry>;

export type NativeAppEnvironment = {
  kind: 'capacitor-ios' | 'android-twa' | 'pwa' | 'browser';
  platform: NativeUpdatePlatform | null;
  installedVersion: string | null;
  build: string | null;
};

export type NativeUpdateCandidate = {
  platform: NativeUpdatePlatform;
  installedVersion: string;
  targetVersion: string;
  minimumSupportedVersion: string;
  belowMinimumSupportedVersion: boolean;
  releaseNotes: string;
  storeUrl: string;
};

export const NATIVE_UPDATE_POLICY_PATH = '/native-app-update-policy.json';
export const NATIVE_UPDATE_POLICY_TIMEOUT_MS = 3_000;
export const NATIVE_UPDATE_REMINDER_INTERVAL_MS = 48 * 60 * 60 * 1_000;

const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

type ParsedVersion = {
  core: [number, number, number];
  prerelease: string[];
};

function parseVersion(value: string): ParsedVersion | null {
  const match = SEMVER_PATTERN.exec(value);
  if (!match) return null;
  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: match[4]?.split('.') ?? []
  };
}

export function compareSemanticVersions(left: string, right: string) {
  const parsedLeft = parseVersion(left);
  const parsedRight = parseVersion(right);
  if (!parsedLeft || !parsedRight) return null;

  for (let index = 0; index < parsedLeft.core.length; index += 1) {
    if (parsedLeft.core[index] !== parsedRight.core[index]) {
      return parsedLeft.core[index] < parsedRight.core[index] ? -1 : 1;
    }
  }

  if (!parsedLeft.prerelease.length && !parsedRight.prerelease.length) return 0;
  if (!parsedLeft.prerelease.length) return 1;
  if (!parsedRight.prerelease.length) return -1;

  const length = Math.max(parsedLeft.prerelease.length, parsedRight.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = parsedLeft.prerelease[index];
    const rightPart = parsedRight.prerelease[index];
    if (leftPart === undefined) return -1;
    if (rightPart === undefined) return 1;
    if (leftPart === rightPart) continue;
    const leftNumeric = /^\d+$/.test(leftPart);
    const rightNumeric = /^\d+$/.test(rightPart);
    if (leftNumeric && rightNumeric) return Number(leftPart) < Number(rightPart) ? -1 : 1;
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    return leftPart < rightPart ? -1 : 1;
  }
  return 0;
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function parsePolicyEntry(value: unknown): NativeUpdatePolicyEntry | null {
  if (!value || typeof value !== 'object') return null;
  const entry = value as Record<string, unknown>;
  if (
    typeof entry.latestVersion !== 'string' || !parseVersion(entry.latestVersion) ||
    typeof entry.minimumSupportedVersion !== 'string' || !parseVersion(entry.minimumSupportedVersion) ||
    typeof entry.noticeEnabled !== 'boolean' ||
    typeof entry.releaseNotes !== 'string' || entry.releaseNotes.length > 500 ||
    !(entry.storeUrl === null || isHttpsUrl(entry.storeUrl))
  ) return null;

  return {
    latestVersion: entry.latestVersion,
    minimumSupportedVersion: entry.minimumSupportedVersion,
    noticeEnabled: entry.noticeEnabled,
    releaseNotes: entry.releaseNotes,
    storeUrl: entry.storeUrl
  };
}

export function parseNativeUpdatePolicy(value: unknown): NativeUpdatePolicy | null {
  if (!value || typeof value !== 'object') return null;
  const policy = value as Record<string, unknown>;
  const ios = parsePolicyEntry(policy.ios);
  const android = parsePolicyEntry(policy.android);
  return ios && android ? { ios, android } : null;
}

export async function detectNativeAppEnvironment(): Promise<NativeAppEnvironment> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return { kind: 'browser', platform: null, installedVersion: null, build: null };
  }

  try {
    const info = await App.getInfo();
    return {
      kind: 'capacitor-ios',
      platform: 'ios',
      installedVersion: info.version,
      build: info.build
    };
  } catch {
    return { kind: 'capacitor-ios', platform: 'ios', installedVersion: null, build: null };
  }
}

export async function fetchNativeUpdatePolicy(
  fetcher: typeof fetch = fetch,
  timeoutMs = NATIVE_UPDATE_POLICY_TIMEOUT_MS
): Promise<NativeUpdatePolicy | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(`${SPELIO_PUBLIC_ORIGIN}${NATIVE_UPDATE_POLICY_PATH}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) return null;
    return parseNativeUpdatePolicy(await response.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function getNativeUpdateCandidate(
  environment: NativeAppEnvironment,
  policy: NativeUpdatePolicy
): NativeUpdateCandidate | null {
  if (environment.kind !== 'capacitor-ios' || environment.platform !== 'ios' || !environment.installedVersion) return null;
  const entry = policy.ios;
  if (!entry.noticeEnabled || !entry.storeUrl) return null;
  const latestComparison = compareSemanticVersions(environment.installedVersion, entry.latestVersion);
  const minimumComparison = compareSemanticVersions(environment.installedVersion, entry.minimumSupportedVersion);
  if (latestComparison === null || minimumComparison === null || latestComparison >= 0) return null;

  return {
    platform: 'ios',
    installedVersion: environment.installedVersion,
    targetVersion: entry.latestVersion,
    minimumSupportedVersion: entry.minimumSupportedVersion,
    belowMinimumSupportedVersion: minimumComparison < 0,
    releaseNotes: entry.releaseNotes,
    storeUrl: entry.storeUrl
  };
}

function dismissalKey(candidate: NativeUpdateCandidate) {
  return `spelio:native-update-dismissal:${candidate.platform}:${candidate.targetVersion}`;
}

export function isNativeUpdateDismissed(
  candidate: NativeUpdateCandidate,
  local: Pick<Storage, 'getItem'>,
  session: Pick<Storage, 'getItem'>,
  now = Date.now()
) {
  const key = dismissalKey(candidate);
  try {
    if (session.getItem(key) === 'dismissed') return true;
  } catch {
    // Storage can be unavailable in privacy-restricted web views.
  }
  try {
    const dismissedAt = Number(local.getItem(key));
    return Number.isFinite(dismissedAt) && dismissedAt > 0 && now - dismissedAt < NATIVE_UPDATE_REMINDER_INTERVAL_MS;
  } catch {
    return false;
  }
}

export function dismissNativeUpdate(
  candidate: NativeUpdateCandidate,
  local: Pick<Storage, 'setItem'>,
  session: Pick<Storage, 'setItem'>,
  now = Date.now(),
  rememberForInterval = true
) {
  const key = dismissalKey(candidate);
  try { session.setItem(key, 'dismissed'); } catch { /* Notice dismissal still succeeds in memory. */ }
  if (rememberForInterval) {
    try { local.setItem(key, String(now)); } catch { /* A future session may show the notice again. */ }
  }
}
