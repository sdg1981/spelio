# Spelio — Welsh spelling practice app

React + TypeScript + Tailwind web app for Welsh spelling practice. Spelio is an installable PWA, with the Android Trusted Web Activity wrapper kept in `android/`.

## Run

```bash
npm install
npm run dev
```

## Android Trusted Web Activity

The Android wrapper for Google Play internal testing lives in `android/`.

It is a minimal Trusted Web Activity for the existing PWA at `https://spelio.app` using package name `app.spelio.twa`. It does not add native login, sync, analytics, ads, subscriptions, push notifications, or native-only behaviour.

See [android/README.md](android/README.md) for build, local testing, signing, Digital Asset Links, and Play Console steps.

## Audio generation

Azure TTS post-processing uses the bundled `@ffmpeg-installer/ffmpeg` binary in serverless routes. Set `FFMPEG_PATH` only if a deployment environment needs to override that binary path.

## Included screens

- First-time homepage
- Returning homepage
- Struggled homepage
- Practice screen
- Settings modal
- Word list modal
- End screen

Use the tiny top-left state switcher while reviewing the prototype. It is intentionally temporary and can be removed when routing/state is added.
