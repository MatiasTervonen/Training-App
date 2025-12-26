import "@/components/activities/locationTask";
import "@/lib/nativewindInterop";

import { Slot, usePathname } from "expo-router";
import { StatusBar } from "react-native";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";
import "react-native-url-polyfill/auto";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
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
import { toastConfig } from "@/lib/config/toast";
import useNotificationResponse from "@/hooks/feed/useNotificationResponse";
import { useAppReadyStore } from "@/lib/stores/appReadyStore";
import BootScreen from "@/components/feed/fakeFeedLoader";
import SaveAreaInset from "@/components/layout/SaveAreaInset";
import Mapbox from "@rnmapbox/maps";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN!);

if (!__DEV__) {
  Sentry.init({
    dsn: "https://cf3db79ed11dbd657e73bb68617c6a34@o4510142810619904.ingest.de.sentry.io/4510160894361680",
    sendDefaultPii: true,
    enableLogs: true,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.mobileReplayIntegration()],
  });
}
// Initialize Reactotron in development
if (__DEV__) {
  import("../ReactotronConfig");
}

const queryClient = new QueryClient();

configureReanimatedLogger({
  level: ReanimatedLogLevel.error,
  strict: false,
});

export default Sentry.wrap(function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Russo-One": require("../assets/fonts/RussoOne-Regular.ttf"),
  });

  const feedReady = useAppReadyStore((state) => state.feedReady);
  const resetFeedReady = useAppReadyStore((state) => state.resetFeedReady);

  const pathname = usePathname();

  // handle notification response when app is opened from notification
  useNotificationResponse();

  // Configure Notification Channels for Android
  useEffect(() => {
    configureNotificationChannels();
    configurePushNotificationsWhenAppIsOpen();
  }, []);

  // reset feed ready when app is mounted
  useEffect(() => {
    resetFeedReady();
  }, [resetFeedReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <MenuProvider>
            <PaperProvider>
              <StatusBar
                barStyle="light-content"
                backgroundColor="#020617"
                translucent={false}
              />
              <SaveAreaInset>
                <LayoutWrapper>
                  <Slot />
                </LayoutWrapper>
              </SaveAreaInset>
              {pathname !== "/" &&
                pathname !== "/login" &&
                (!fontsLoaded || !feedReady) && <BootScreen />}
            </PaperProvider>
            <Toast config={toastConfig} position="top" />
          </MenuProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
});
