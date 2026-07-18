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

The checked-in native project uses Swift Package Manager for Capacitor. Generated web assets under `ios/App/App/public` are intentionally ignored by Git. The App Store build therefore contains the frontend that was last built and synced on the release machine; website-only frontend or content-display changes do not update an already released iOS app.

The bundled web app uses `@capacitor/app` and `App.getInfo()` to read the installed native marketing version and build for the optional update notice. The remotely hosted policy and release procedure are documented in [`docs/native_app_update_notices.md`](../docs/native_app_update_notices.md). Because this wrapper packages its web assets, bundled app changes require an App Store release; the checker cannot run in builds released before it was included.

## Build And Sync

From the repo root:

```bash
npm install
npm test
npx tsc --noEmit
node scripts/prepare-ios-release.mjs
```

Before running the release preparation, provide the live production values for `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` through the release environment or an ignored `.env.production.local`. Do not use the development project for an App Store build.

`node scripts/prepare-ios-release.mjs` removes the old generated `dist/` and `ios/App/App/public` directories, runs `npm run build`, verifies that the production frontend contains the current Learning Journeys and Practice Library UI and targets the live Supabase project, runs `npx cap sync ios`, then confirms the copied iOS assets exactly match `dist/`. It fails before Xcode release work if the bundle is stale, incomplete, or configured for the wrong Supabase project.

The underlying commands remain:

```bash
npm run build
npx cap sync ios
node scripts/verify-ios-content-bundle.mjs
```

`npm run build` compiles the Vite app into `dist/`. `npx cap sync ios` copies those built assets into the iOS project and refreshes Capacitor native configuration. Both are required after frontend changes and before every archive. The iOS app does not use a remote `server.url`, so deploying the website or changing live content-display code cannot replace the frontend inside an installed App Store build; users receive bundled frontend changes only after installing a new App Store version.

## Verify Before Upload

After release preparation:

1. Confirm `node scripts/verify-ios-content-bundle.mjs` passes.
2. Open the app from Xcode on a real iPhone while online.
3. Open **Word Lists** and confirm **Learning Journeys** shows the current Welsh Spelling Foundations pattern lessons, beginning with `D / DD`, `Y`, and `F / FF`.
4. Confirm **Practice Library** contains the current `Most Common ...` cards rather than only the growth placeholder.
5. Turn off network access and relaunch once to check that the existing bundled/static fallback still opens where available. The fallback is for resilience and is not the authoritative content source.
6. Re-enable network access and confirm the live catalogue returns before archiving.

The live admin database remains authoritative. The build and verification steps do not import content or write to Supabase.

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
