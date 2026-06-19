# Spelio Android TWA

This is a minimal Trusted Web Activity wrapper for the Spelio PWA at `https://spelio.app`.

It does not add native login, sync, analytics, ads, subscriptions, push notifications, background sync, or native-only behaviour. The app state remains the existing browser/PWA state handled by Spelio on the web.

## Project Settings

- Package name / application ID: `app.spelio.twa`
- App name: `Spelio`
- Launch URL: `https://spelio.app`
- TWA dependency: `com.google.androidbrowserhelper:androidbrowserhelper:2.7.2`
- Native permissions: none declared

The TWA opens the existing PWA. When Digital Asset Links verification succeeds, Chrome removes the Custom Tab browser UI and presents the site in app form.

## Build

Requirements:

- Android Studio, or a local Android SDK
- JDK compatible with Android Gradle Plugin 8.7.x
- Android SDK Platform 35

From the repo root:

```bash
cd android
./gradlew assembleDebug
```

For a release build suitable for internal testing, create or configure a signing key, then build an Android App Bundle:

```bash
cd android
./gradlew bundleRelease
```

The release artifact is expected at:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

If using Android Studio, open the `android/` folder and use **Build > Generate Signed Bundle / APK**.

## Local Device Test

Build and install a debug APK:

```bash
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Open Spelio from the Android launcher. Before Digital Asset Links is configured and verified, Chrome may show Custom Tab browser UI. After verification, the TWA should launch `https://spelio.app` without the browser toolbar.

To inspect verification failures:

```bash
adb logcat | grep -e OriginVerifier -e digital_asset_links
```

## Digital Asset Links

Chrome verifies both directions:

1. App to website: configured in `app/src/main/res/values/strings.xml` as `asset_statements`.
2. Website to app: publish an Asset Links file at:

```text
https://spelio.app/.well-known/assetlinks.json
```

Use `android/assetlinks.template.json` as the starting point:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "app.spelio.twa",
      "sha256_cert_fingerprints": [
        "REPLACE_WITH_PLAY_APP_SIGNING_SHA256_FINGERPRINT"
      ]
    }
  }
]
```

The package name must remain:

```text
app.spelio.twa
```

### SHA-256 Fingerprint

For Google Play internal testing, use the SHA-256 fingerprint for the certificate that signs the build users receive.

If Play App Signing is enabled, use the **App signing key certificate** SHA-256 from Google Play Console:

```text
Google Play Console > Spelio > Setup > App integrity > App signing key certificate > SHA-256 certificate fingerprint
```

If testing a locally signed APK before Play App Signing, extract the local signing key fingerprint:

```bash
keytool -list -v -keystore path/to/upload-keystore.jks -alias upload
```

Copy the value shown as `SHA256:` into `sha256_cert_fingerprints`.

After publishing `assetlinks.json`, verify it is served as JSON over HTTPS at exactly:

```text
https://spelio.app/.well-known/assetlinks.json
```

## Google Play Internal Testing Checklist

1. Create the app in Google Play Console with package name `app.spelio.twa`.
2. Confirm Play App Signing settings and note the Play app signing SHA-256 fingerprint.
3. Publish `https://spelio.app/.well-known/assetlinks.json` with that SHA-256 fingerprint.
4. Build a signed release AAB from this Android project.
5. Upload the AAB to an internal testing track.
6. Complete required store-listing, content rating, data safety, privacy policy, and tester setup fields.
7. Install through the Play internal testing link and confirm the app opens `https://spelio.app` without browser UI after Digital Asset Links verification.

Remaining manual steps are signing-key creation/storage, Play Console setup, the store listing, and publishing the live `assetlinks.json` file with the final Play signing certificate fingerprint.
