# Spelio — Welsh spelling mastery system

React + TypeScript + Tailwind web app for Welsh spelling mastery, with a finite learning path and an expandable practice library. Spelio is an installable PWA, with the Android Trusted Web Activity wrapper kept in `android/` and the iOS Capacitor wrapper kept in `ios/`.

## Run

```bash
npm install
npm run dev
```

## Android Trusted Web Activity

The Android wrapper for Google Play internal testing lives in `android/`.

It is a minimal Trusted Web Activity for the existing PWA at `https://spelio.app` using package name `app.spelio.twa`. It does not add native login, sync, analytics, ads, subscriptions, push notifications, or native-only behaviour.

See [android/README.md](android/README.md) for build, local testing, signing, Digital Asset Links, and Play Console steps.

## iOS Capacitor App

The iOS wrapper for App Store Connect/TestFlight submission lives in `ios/`.

It is a minimal Capacitor app for the existing Spelio web build using bundle identifier `app.spelio.ios`. It does not add native login, analytics, push notifications, in-app purchases, or native-only behaviour.

See [ios/README.md](ios/README.md) for build, sync, Xcode signing, archive, upload, and App Store review notes.

## Audio generation

Azure TTS post-processing uses the bundled `@ffmpeg-installer/ffmpeg` binary in serverless routes. Set `FFMPEG_PATH` only if a deployment environment needs to override that binary path.

The Azure route uses the server-only `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` env vars and sends the key with `Ocp-Apim-Subscription-Key`. It does not use a bearer-token flow. Legacy `VITE_AZURE_SPEECH_KEY` and `VITE_AZURE_SPEECH_REGION` names are still read as a fallback, but do not use client-prefixed names for new local, Vercel, or function deployments.

For a small safe connectivity check, run:

```bash
npm run diagnose:azure-tts -- gwaith
```

The diagnostic reports which env vars are present, the region-derived Azure host, status code, Azure request id when returned, and success/failure without printing secret values.

## Included screens

- First-time homepage
- Returning homepage
- Struggled homepage
- Practice screen
- Settings modal
- Word list modal
- End screen

Use the tiny top-left state switcher while reviewing the prototype. It is intentionally temporary and can be removed when routing/state is added.
