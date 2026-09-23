# Spelio — Welsh spelling mastery system

React + TypeScript + Tailwind web app for Welsh spelling mastery, with a finite learning path and an expandable practice library. Spelio is an installable PWA, with the Android Trusted Web Activity wrapper kept in `android/` and the iOS Capacitor wrapper kept in `ios/`.

## Run

```bash
npm install
npm run dev
```

## Offline Behaviour

Spelio does not claim full offline support. The public app prefers live Supabase content, then falls back to bundled static content so text-based practice can continue where practical if the app shell is already available.

If the shell cannot load enough content to function, Spelio shows a minimal offline state with a Retry button. The service worker also precaches `/offline.html` as a navigation fallback for installed/cached PWA sessions where the app shell cannot be served. Practice audio failures do not block typing practice; when the browser reports it is offline, the temporary feedback says "Audio unavailable while offline."

## Android Trusted Web Activity

The Android wrapper published on Google Play lives in `android/`.

It is a minimal Trusted Web Activity for the existing PWA at `https://spelio.app` using package name `app.spelio.twa`. It does not add native login, sync, analytics, ads, subscriptions, push notifications, or native-only behaviour.

The public `/install` page is titled `Get Spelio` and presents Google Play and the Apple App Store as the primary mobile installation routes. It prioritises the matching store on Android and iPhone/iPad, and shows both stores side by side on desktop. PWA capability remains available through the manifest, service worker, and browser-native controls, but the page no longer promotes it as a separate installation choice. The public menu shows `Get Spelio` only in a normal browser where Spelio is not already installed; it remains hidden in the iOS Capacitor app, Android TWA, and installed PWA. Automatic PWA prompting remains disabled.

See [android/README.md](android/README.md) for build, local testing, signing, Digital Asset Links, and Play Console steps.

## iOS Capacitor App

The iOS wrapper for App Store Connect/TestFlight submission lives in `ios/`.

It is a minimal Capacitor app for the existing Spelio web build using bundle identifier `app.spelio.ios`. It does not add native login, analytics, push notifications, in-app purchases, or native-only behaviour.

See [ios/README.md](ios/README.md) for build, sync, Xcode signing, archive, upload, and App Store review notes.

Native wrapper update notices and their remotely hosted policy are documented in [docs/native_app_update_notices.md](docs/native_app_update_notices.md). Browser and installed-PWA users do not receive native-store prompts.

## Audio generation

Azure TTS post-processing uses the bundled `@ffmpeg-installer/ffmpeg` binary in serverless routes. Set `FFMPEG_PATH` only if a deployment environment needs to override that binary path.

The Azure route uses the server-only `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` env vars and sends the key with `Ocp-Apim-Subscription-Key`. It does not use a bearer-token flow. Legacy `VITE_AZURE_SPEECH_KEY` and `VITE_AZURE_SPEECH_REGION` names are still read as a fallback, but do not use client-prefixed names for new local, Vercel, or function deployments.

For a small safe connectivity check, run:

```bash
npm run diagnose:azure-tts -- gwaith
```

The diagnostic reports which env vars are present, the region-derived Azure host, status code, Azure request id when returned, and success/failure without printing secret values.

## Database development

Supabase migration, environment-safety, Data API privilege, and local verification
rules are documented in [docs/database_and_supabase_workflow.md](docs/database_and_supabase_workflow.md).

## Included screens

- First-time homepage
- Returning homepage
- Struggled homepage
- Practice screen
- Settings modal
- Word list modal
- End screen

Use the tiny top-left state switcher while reviewing the prototype. It is intentionally temporary and can be removed when routing/state is added.
