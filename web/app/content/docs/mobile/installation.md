# Installation

Both web and mobile applications lives in the same repository, so you only need to clone it once to get started.
Both have own dependencies, so you need to install them separately. Below are the instructions for mobile.

Clone the repository

```bash
git clone  https://github.com/MatiasTervonen/Training-App.git
```

Go under mobile directory:

```bash
cd mobile
```

Install the packages:

```bash
pnpm install
```

Run the development server:

```bash
pnpm start
```

## Development build

To create a development build of the mobile application, run the following command:

```bash
npx expo run android
```

## Production build

To create a production build of the mobile application, run the following command:

```bash
npx expo run:android --variant=release
```

## Build install APK

To build a signed release APK that can be installed directly on a device (sideload), run Gradle's `assembleRelease` task:

```bash
cd android && ./gradlew assembleRelease
```

Run this from the `mobile/` directory. The signed APK will be at:

```
android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

Install it on a connected device with:

```bash
adb install android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

> **Note:** This requires a signing keystore configured in `android/keystore.properties`. The release signing config is already set up in `build.gradle`.

That's it! You're ready to go.
