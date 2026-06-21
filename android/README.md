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
- JDK 17, compatible with Android Gradle Plugin 8.13.x
- Android SDK Platform 36 or later

If SDK Platform 36 is missing, install it from Android Studio SDK Manager, or run:

```bash
sdkmanager "platforms;android-36"
```

From the repo root:

```bash
cd android
./gradlew assembleDebug
```

For a signed release build suitable for Play Console upload, configure the local upload key described in [Release Signing](#release-signing), then build an Android App Bundle:

```bash
cd android
./gradlew bundleRelease
```

The release artifact is expected at:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

If using Android Studio, open the `android/` folder and use **Build > Generate Signed Bundle / APK**.

## Release Signing

Google Play requires uploaded Android App Bundles to be signed. This project uses the standard Play App Signing model:

- Google Play owns the final **app signing key** used for installs.
- This repo uses a local **upload key** only to sign bundles before upload.
- Digital Asset Links must use the Play **app signing key** SHA-256 certificate fingerprint, not the local upload key fingerprint, once Play App Signing is enabled.

The local upload key is stored at:

```text
android/upload-keystore.jks
```

Gradle reads the signing credentials from:

```text
android/keystore.properties
```

Both files are local secrets and are ignored by Git. The committed template is:

```text
android/keystore.properties.example
```

The generated keystore uses alias:

```text
upload
```

Back up both `android/upload-keystore.jks` and `android/keystore.properties` outside Git in a secure password manager or encrypted secrets vault. Use one item named `Spelio Android upload key`, attach `upload-keystore.jks`, and store the four `keystore.properties` values with it. Losing the upload key can block Play Console uploads until Google approves an upload key reset.

To create a replacement local upload key for a new checkout only when no existing Spelio upload key is available:

```bash
cd android
cp keystore.properties.example keystore.properties
keytool -genkeypair -v \
  -keystore upload-keystore.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Then edit `keystore.properties` with the generated passwords. Do not commit `keystore.properties` or `upload-keystore.jks`.

To rebuild a signed release bundle:

```bash
cd android
./gradlew bundleRelease
```

The Play-uploadable signed bundle is:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

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

If testing a locally signed APK before Play App Signing, extract the local upload key fingerprint:

```bash
keytool -list -v -keystore android/upload-keystore.jks -alias upload
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
