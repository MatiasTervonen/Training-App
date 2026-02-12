# Developement

For development you can use Android emulator or your physical device. Below are instructions for all of these options.

## Things to remember:

- Always when you make changes for native code you need to rebuild the development build from your app.
- Always use development build when you need to use native modules, such as camera or file system. Production build doesn't support these modules, so you won't be able to use them.
- Expo Go is used mainly for testing the UI changes, as it doesn't support native modules. If you need to test something that requires native modules, you need to use development build.
- **A physical device is required** for testing push notifications, sensors, biometrics, camera, background tasks, health integrations (HealthKit/Google Fit), and accurate performance profiling — emulators do not support these reliably.


## Android emulator

Download and install Android Studio from [here](https://developer.android.com/studio).
