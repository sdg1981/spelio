# Spelio iOS App

This is a minimal Capacitor iOS wrapper for Spelio.

It packages the existing Vite web build into a native iOS WebView shell. It does not add native login, analytics, push notifications, in-app purchases, background modes, or extra Apple capabilities.

## Project Settings

- App name: `Spelio`
- Bundle identifier: `app.spelio.ios`
- Public website origin: `https://spelio.app`
- Web asset source: `dist/`
- Native project: `ios/App/App.xcodeproj`
- Capacitor config: `capacitor.config.ts`
- iOS deployment target: `15.0`
- Signing style: automatic

The checked-in native project uses Swift Package Manager for Capacitor. Generated web assets under `ios/App/App/public` are intentionally ignored by Git; rebuild and sync them before opening Xcode for release work.

The bundled web app uses `@capacitor/app` and `App.getInfo()` to read the installed native marketing version and build for the optional update notice. The remotely hosted policy and release procedure are documented in [`docs/native_app_update_notices.md`](../docs/native_app_update_notices.md). Because this wrapper packages its web assets, bundled app changes require an App Store release; the checker cannot run in builds released before it was included.

## Build And Sync

From the repo root:

```bash
npm install
npm run build
npx cap sync ios
```

`npm run build` compiles the Vite app into `dist/`. `npx cap sync ios` copies those built assets into the iOS project and refreshes Capacitor native configuration.

## Open In Xcode

Open the project from the repo root:

```bash
npx cap open ios
```

If opening manually, open:

```text
ios/App/App.xcodeproj
```

Then in Xcode:

1. Select the `App` project in the navigator.
2. Select the `App` target.
3. Open **Signing & Capabilities**.
4. Enable **Automatically manage signing** if it is not already enabled.
5. Select the approved Apple Developer team.
6. Confirm **Bundle Identifier** is `app.spelio.ios`.
7. Confirm no extra capabilities are enabled.

## Archive And Upload

In Xcode:

1. Select **Any iOS Device** or a connected generic iOS device as the run destination.
2. Choose **Product > Archive**.
3. When Organizer opens, select the new archive.
4. Click **Distribute App**.
5. Select **App Store Connect**.
6. Select **Upload**.
7. Use automatic signing unless Xcode reports a provisioning issue.
8. Complete the upload and wait for App Store Connect processing.
9. In App Store Connect, attach the build to the Spelio app record, complete TestFlight or submission metadata, and submit for review.

Xcode is required for final signing, archiving, upload, and any provisioning fixes tied to the Apple Developer account.

## App Store Review Notes

This app is intentionally a thin wrapper around the Spelio learning experience. Review risk is lower if the submitted build clearly works as a complete educational app, not only as a generic website frame.

Before submission, test on a real iPhone and confirm:

- The packaged app shell opens offline and, where bundled/static content is available, text-based practice can continue; audio, custom lists, feedback, and live content refresh still require network access.
- Any feature that needs serverless routes, such as feedback, custom list creation, or generated fallback audio, can reach `https://spelio.app`.
- External share links point to `https://spelio.app`, not `capacitor://localhost`.
- The app does not expose broken install-PWA prompts inside the native shell.
- App Store metadata, screenshots, privacy answers, and review notes describe the educational spelling-practice functionality, not just the website wrapper.
- App Store privacy answers match the published June 2026 declaration in [`docs/apple_app_store_privacy_declaration.md`](../docs/apple_app_store_privacy_declaration.md).

Apple may reject apps that are merely repackaged websites or have insufficient native/app-like value. Spelio should be positioned and tested as an interactive Welsh spelling practice app with real learning content and a focused app flow.
