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

