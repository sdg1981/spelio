# Native app update notices

Spelio has a small, remotely configurable update notice for native wrapper releases. The policy is the static, founder-editable file at `public/native-app-update-policy.json`. Both platform notices ship disabled by default. Routine notices are dismissible, return no sooner than 48 hours, and are suppressed for the rest of the current session. A new `latestVersion` has its own dismissal state.

## Platform audit

- **iOS Capacitor app:** The Xcode target supplies `CFBundleShortVersionString` from `MARKETING_VERSION` and `CFBundleVersion` from `CURRENT_PROJECT_VERSION` (currently `1.0.1` and build `1`). `@capacitor/app` is installed, synced through the existing Swift Package Manager Capacitor project, and `App.getInfo()` exposes those installed native values. The checker also requires `Capacitor.isNativePlatform()` and the native platform `ios`, so Safari and installed iOS PWAs are excluded.
- **Android TWA:** `android/` is a stock Android Browser Helper `LauncherActivity` using `com.google.androidbrowserhelper:androidbrowserhelper:2.7.2`. It launches `https://spelio.app`, currently has native `versionName "0.3"` / `versionCode 2`, and does not expose either value to web content. A user-agent, display mode, or Android-looking browser is not proof of the installed package version, so Android notices remain disabled and the web checker deliberately does not infer one.
- **Installed browser PWA:** The existing `display-mode: standalone` / install-prompt helpers distinguish installed web-app presentation where needed. A PWA is still hosted web content and does not receive a native-store update notice.
- **Ordinary website:** It receives neither native-store notice. Web and PWA updates continue to use the existing service worker behaviour.

The official iOS destination is `https://apps.apple.com/app/spelio/id6783524504`. There is not yet a public Google Play URL in the repository; `GOOGLE_PLAY_URL` remains blank during closed testing. The repository has no general announcement or web-update prompt to integrate with. Existing anonymous analytics are feature-specific, so this notice does not add a separate tracking path.

## Policy and caching

The checker reads the policy from `https://spelio.app/native-app-update-policy.json` only after confirming a native iOS runtime. It uses a three-second timeout, `cache: no-store`, defensive JSON and semantic-version validation, and silent failure for network, offline, timeout, native API, or malformed-data errors. Vercel serves the document with `Cache-Control: no-store` and cross-origin access for the Capacitor origin. The service worker explicitly leaves this path to the network and never caches it.

`minimumSupportedVersion` is retained and compared for future diagnostics, but it does not block practice, close the app, or make the notice non-dismissible. `storeUrl` may be `null` while a store listing is not public; an enabled notice without a valid HTTPS store URL fails closed.

To announce an iOS release:

1. Keep `noticeEnabled` false while preparing and distributing the native build.
2. Confirm the new App Store version is live at the configured `storeUrl`.
3. Set `latestVersion` to that native marketing version and enable the iOS notice.
4. Deploy the policy change to the Spelio web origin.

Do not change `latestVersion` for an ordinary website deployment. iOS Capacitor builds package their web assets, so bundled changes require a new App Store build. The Android TWA normally displays current hosted web content, so a future Play notice must refer only to a native wrapper/package release.

## Android future options

The smallest future-safe options are to make the wrapper provide a deliberate, testable native version signal (for example, a wrapper-owned launch parameter combined with a robust TWA provenance mechanism), add a lightweight supported native bridge, or implement Google Play Core flexible in-app updates in a separate Android wrapper task. A launch parameter alone is forgeable in an ordinary browser and is not sufficient. Keep the TWA thin unless a native-wrapper requirement justifies the added code.

This checker cannot run retroactively in iOS or Android builds released before it was bundled. It begins protecting releases only after users install a native build that contains the checker.
