import "@/lib/nativewindInterop";
import { Slot, useSegments } from "expo-router";
import { StatusBar, View } from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "./global.css";
import Navbar from "@/components/navbar/Navbar";
import "react-native-url-polyfill/auto";
import LayoutWrapper from "@/components/LayoutWrapper";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/react-native";
import { MenuProvider } from "react-native-popup-menu";
import { Provider as PaperProvider } from "react-native-paper";
import {
  configureNotificationChannels,
  configurePushNotificationsWhenAppIsOpen,
} from "@/components/push-notifications/actions";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import * as ScreenOrientation from "expo-screen-orientation";
import { toastConfig } from "@/lib/config/toast";

const queryClient = new QueryClient();

configureReanimatedLogger({
  level: ReanimatedLogLevel.error,
  strict: false,
});

Sentry.init({
  dsn: "https://cf3db79ed11dbd657e73bb68617c6a34@o4510142810619904.ingest.de.sentry.io/4510160894361680",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function RootLayout() {
  const [orieantation, setOrientation] =
    useState<ScreenOrientation.Orientation | null>(null);

  const segments = useSegments();
  const route = segments.join("/");

  const [loaded, error] = useFonts({
    "Russo-One": require("../assets/fonts/RussoOne-Regular.ttf"),
  });

  // Hide navbar on timer page when rotating to landscape

  useEffect(() => {
    const getOrientation = async () => {
      const orientation = await ScreenOrientation.getOrientationAsync();
      setOrientation(orientation);
    };
    getOrientation();

    // Subscribe to orientation changes
    const subscription = ScreenOrientation.addOrientationChangeListener(
      (event) => {
        setOrientation(event.orientationInfo.orientation);
      },
    );

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  // Lock screen orientation to portrait

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  const isLandscape =
    orieantation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
    orieantation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;

  const isTimerPage = route === "timer/empty-timer";
  const hideNawbar = isTimerPage && isLandscape;

  // Configure Notification Channels for Android

  useEffect(() => {
    configureNotificationChannels();
    configurePushNotificationsWhenAppIsOpen();
  }, []);

  useEffect(() => {
    if (__DEV__) {
      import("@/lib/reactotron").then(() => {
        console.log("Reactotron Configured 2");
      });
      import("../ReactotronConfig").then(() => {
        console.log("Reactotron Configured");
      });
    }
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <MenuProvider>
          <PaperProvider>
            <SafeAreaProvider>
              <StatusBar
                barStyle="light-content"
                backgroundColor="#020617"
                translucent={false}
              />
              <SafeAreaView style={{ flex: 1 }} className="bg-slate-900">
                <View
                  className={`flex-1 bg-slate-800 font-russo  ${
                    hideNawbar ? "max-w-screen" : "max-w-3xl"
                  }`}
                >
                  {!hideNawbar && <Navbar />}
                  <LayoutWrapper>
                    <Slot />
                  </LayoutWrapper>
                </View>
              </SafeAreaView>
            </SafeAreaProvider>
          </PaperProvider>
          <Toast config={toastConfig} position="top" />
        </MenuProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
});
