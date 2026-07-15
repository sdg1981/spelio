import {
  NATIVE_UPDATE_REMINDER_INTERVAL_MS,
  compareSemanticVersions,
  dismissNativeUpdate,
  fetchNativeUpdatePolicy,
  getNativeUpdateCandidate,
  isNativeUpdateDismissed,
  parseNativeUpdatePolicy,
  type NativeAppEnvironment,
  type NativeUpdateCandidate,
  type NativeUpdatePolicy
} from '../src/lib/nativeUpdate';
import { translate } from '../src/i18n';

declare function require(name: string): { readFileSync: (path: string, encoding: string) => string };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
}

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const enabledPolicy: NativeUpdatePolicy = {
  ios: {
    latestVersion: '1.1.0', minimumSupportedVersion: '1.0.0', noticeEnabled: true,
    releaseNotes: 'Latest fixes and improvements.', storeUrl: 'https://apps.apple.com/app/spelio/id6783524504'
  },
  android: {
    latestVersion: '0.3.0', minimumSupportedVersion: '0.3.0', noticeEnabled: false,
    releaseNotes: 'Latest fixes and improvements.', storeUrl: null
  }
};

function iosEnvironment(version: string): NativeAppEnvironment {
  return { kind: 'capacitor-ios', platform: 'ios', installedVersion: version, build: '1' };
}

assert(getNativeUpdateCandidate(iosEnvironment('1.0.1'), enabledPolicy), 'Older native iOS versions should show an enabled notice.');
assertEqual(getNativeUpdateCandidate(iosEnvironment('1.0.1'), enabledPolicy)?.storeUrl, enabledPolicy.ios.storeUrl, 'The iOS action should use the configured App Store URL.');
assertEqual(getNativeUpdateCandidate(iosEnvironment('1.1.0'), enabledPolicy), null, 'Equal iOS versions should not show a notice.');
assertEqual(getNativeUpdateCandidate(iosEnvironment('1.2.0'), enabledPolicy), null, 'Newer iOS versions should not show a notice.');
assertEqual(getNativeUpdateCandidate(iosEnvironment('1.0.1'), { ...enabledPolicy, ios: { ...enabledPolicy.ios, noticeEnabled: false } }), null, 'Disabled policies should not show a notice.');

const iphoneSafari: NativeAppEnvironment = { kind: 'browser', platform: null, installedVersion: null, build: null };
const androidBrowser: NativeAppEnvironment = { kind: 'browser', platform: null, installedVersion: null, build: null };
assertEqual(getNativeUpdateCandidate(iphoneSafari, enabledPolicy), null, 'iPhone Safari should not show a native notice.');
assertEqual(getNativeUpdateCandidate({ kind: 'pwa', platform: null, installedVersion: null, build: null }, enabledPolicy), null, 'Installed iOS PWAs should not show a native notice.');
assertEqual(getNativeUpdateCandidate(androidBrowser, enabledPolicy), null, 'Ordinary Android browsers should not show a Play notice.');
assertEqual(getNativeUpdateCandidate({ kind: 'android-twa', platform: 'android', installedVersion: null, build: null }, enabledPolicy), null, 'A TWA without a reliable native version should not show a notice.');

assertEqual(compareSemanticVersions('1.0.0', '1.0.1'), -1, 'Patch versions should compare safely.');
assertEqual(compareSemanticVersions('1.1.0', '1.0.9'), 1, 'Minor versions should compare safely.');
assertEqual(compareSemanticVersions('1.0.0-beta.1', '1.0.0'), -1, 'Prereleases should compare below releases.');
assertEqual(compareSemanticVersions('not-a-version', '1.0.0'), null, 'Malformed versions should fail closed.');

assert(parseNativeUpdatePolicy(enabledPolicy), 'A valid update policy should be accepted.');
assertEqual(parseNativeUpdatePolicy({ ...enabledPolicy, ios: { ...enabledPolicy.ios, latestVersion: 'latest' } }), null, 'Malformed policies should fail closed.');

const candidate = getNativeUpdateCandidate(iosEnvironment('1.0.1'), enabledPolicy) as NativeUpdateCandidate;
const local = new MemoryStorage();
const session = new MemoryStorage();
const now = 1_000_000;
dismissNativeUpdate(candidate, local, session, now);
assert(isNativeUpdateDismissed(candidate, local, session, now + 1), 'Dismissal should suppress a repeat in the same session.');
assert(isNativeUpdateDismissed(candidate, local, new MemoryStorage(), now + NATIVE_UPDATE_REMINDER_INTERVAL_MS - 1), 'Dismissal should suppress reminders for 48 hours.');
assertEqual(isNativeUpdateDismissed(candidate, local, new MemoryStorage(), now + NATIVE_UPDATE_REMINDER_INTERVAL_MS), false, 'Dismissal should expire after 48 hours.');
assertEqual(isNativeUpdateDismissed({ ...candidate, targetVersion: '1.2.0' }, local, session, now + 1), false, 'A new target version should not inherit an old dismissal.');
assertEqual(translate('en', 'nativeUpdate.update'), 'Update Spelio', 'English update copy should resolve through i18n.');
assertEqual(translate('cy', 'nativeUpdate.update'), 'Diweddaru Spelio', 'Welsh update copy should resolve through i18n.');

const { readFileSync } = require('fs');
const homeSource = readFileSync('src/components/Home.tsx', 'utf8');
const practiceSource = readFileSync('src/components/Practice.tsx', 'utf8');
const noticeSource = readFileSync('src/components/NativeUpdateNotice.tsx', 'utf8');
assert(homeSource.includes('<NativeUpdateNotice'), 'The notice should be mounted only on the homepage shell.');
assert(!practiceSource.includes('NativeUpdateNotice'), 'The notice should never cover active spelling input.');
assert(!noticeSource.includes('spelio-analytics'), 'The notice should not introduce unsupported analytics payloads.');

async function runNetworkFailureTests() {
  const offlineFetcher = async () => { throw new TypeError('offline'); };
  assertEqual(await fetchNativeUpdatePolicy(offlineFetcher as typeof fetch, 10), null, 'Offline policy checks should fail silently.');

  const malformedFetcher = async () => new Response('{"ios":', { status: 200 });
  assertEqual(await fetchNativeUpdatePolicy(malformedFetcher as typeof fetch, 10), null, 'Malformed policy responses should fail silently.');

  const timedOutFetcher = (_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  });
  assertEqual(await fetchNativeUpdatePolicy(timedOutFetcher as typeof fetch, 1), null, 'Timed-out policy checks should fail silently.');
}

void runNetworkFailureTests().then(() => console.log('native update tests passed'));
