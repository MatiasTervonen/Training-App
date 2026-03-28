# Developement

For development you can use Android emulator or your physical device. Below are instructions for all of these options.

## Things to remember:

- Always when you make changes for native code you need to rebuild the development build from your app.
- **A physical device is required** for testing push notifications, sensors, biometrics, camera, background tasks, health integrations (HealthKit/Google Fit), and accurate performance profiling — emulators do not support these reliably.
- Expo Go is used mainly for testing the UI changes, as it doesn't support native modules. If you need to test something that requires native modules, you need to use development build.

## Android emulator

Download and install Android Studio from [here](https://developer.android.com/studio).

From Android Studio, open Virtual Device Manager and create a new virtual device.

## Physical device

You need to allow USB debugging on your Android device and connect it to your computer with a USB cable. USB debuggin is allowed from settings > developer options. If you don't see developer options, go to settings > about phone and tap on build number 7 times to enable it.

Check if your device or emulator is connected and recognized by running the following command:

```bash
adb devices
```

## Choosing which device to run on

When both a physical device and emulator are connected, you need to specify which one to target. By default, Expo picks the first device in the `adb devices` list.

### Development server (`expo start`)

Start the dev server and press `shift + a` to get a device picker:

```bash
npx expo start
# Then press shift + a to select from connected Android devices
```

### Development build (`expo run:android`)

Use the `--device` flag with the **AVD name** of the emulator (not the adb ID):

```bash
# Find the AVD name
adb -s emulator-5554 emu avd name
# Example output: Pixel_9

# Run on the emulator using the AVD name
npx expo run:android --device Pixel_9
```

Note: The `--device` flag expects the emulator's AVD name (e.g., `Pixel_9`), **not** the adb device ID (e.g., `emulator-5554`).

## Manual APK install

If `npx expo run:android` builds successfully but fails to install the APK on the emulator, you can install it manually with adb:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

Run this from the `mobile/` directory. After installing, start the dev server with `npx expo start --dev-client`.

## Debug vs Release builds

The Android build uses an `applicationIdSuffix ".dev"` for debug builds. This means:

- **Release build**: `com.layer100crypto.MyTrack`
- **Debug build**: `com.layer100crypto.MyTrack.dev`

This allows both builds to be installed side by side on the same device. You can test new features with the dev build without overwriting your release build.

### Firebase setup

Both package names must be registered in the Firebase console as separate Android apps. The `google-services.json` file contains both client entries. If you ever re-download it from Firebase, make sure both apps are still registered.

After updating `google-services.json` in the project root, you also need to copy it to `android/app/google-services.json` or run `npx expo prebuild` to regenerate it.

## Building for release

### Android AAB (Google Play / Internal Testing)

To build a release Android App Bundle (`.aab`) for uploading to Google Play Console (internal testing, closed testing, or production):

```bash
cd android && ./gradlew bundleRelease
```

Run this from the `mobile/` directory. The output bundle will be at:

```
android/app/build/outputs/bundle/release/app-release.aab
```

Upload this `.aab` file to Google Play Console under your app's release track.

