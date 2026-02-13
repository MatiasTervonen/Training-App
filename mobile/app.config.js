import "dotenv/config";

export default {
  expo: {
    name: "MyTrack",
    slug: "mytrack",
    version: "1.0.0",
    orientation: "default",
    icon: "./assets/images/ios-tinted-icon.png",
    scheme: "mytrack",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: "com.layer100crypto.MyTrack",
      softwareKeyboardLayoutMode: "resize",
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_LOCATION",
      ],
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-sqlite",
      "@rnmapbox/maps",
      "expo-router",
      "expo-dev-client",
      "expo-font",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow MyTrack to use your location.",
          isAndroidBackgroundLocationEnabled: true,
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#0f172a",
        },
      ],
      [
        "expo-audio",
        {
          microphonePermission:
            "Allow $(PRODUCT_NAME) to access your microphone.",
        },
      ],
      [
        "@sentry/react-native/expo",
        {
          url: "https://sentry.io/",
          project: "mytrack-mobile",
          organization: "matias-tervonen",
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/small-notification-icon.png",
          color: "#0f172a",
          androidCollapsedTitle: "{appName} Notifications",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      mapboxDownloadsToken: process.env.MAPBOX_DOWNLOADS_TOKEN,
      router: {},
      eas: {
        projectId: "0eb5a9f8-44ed-470e-be70-717758c923f0",
      },
    },
    owner: "matiastervonen",
  },
};
