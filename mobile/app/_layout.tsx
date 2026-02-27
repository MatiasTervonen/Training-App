import "@/lib/polyfillCrypto";
import "react-native-url-polyfill/auto";
import "./i18n";
import "@/features/activities/lib/locationTask";
import "@/lib/nativewindInterop";
import "./global.css";

import { Slot, usePathname } from "expo-router";
import { StatusBar, Platform, AppState } from "react-native";
import type { AppStateStatus } from "react-native";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LayoutWrapper from "@/features/layout/LayoutWrapper";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  QueryClientProvider,
  QueryClient,
  focusManager,
  onlineManager,
} from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import * as Sentry from "@sentry/react-native";
import { MenuProvider } from "react-native-popup-menu";
import { Provider as PaperProvider } from "react-native-paper";
import {
  configureNotificationChannels,
  configureNotificationCategories,
  configurePushNotificationsWhenAppIsOpen,
} from "@/features/push-notifications/actions";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { toastConfig } from "@/lib/config/toast";
import useNotificationResponse from "@/features/feed/hooks/useNotificationResponse";
import { useAppReadyStore } from "@/lib/stores/appReadyStore";
import BootScreen from "@/features/feed/fakeFeedLoader";
import SaveAreaInset from "@/features/layout/SaveAreaInset";
import Mapbox from "@rnmapbox/maps";
import TimerFinishListener from "@/features/layout/TimerFinished";
import AlarmPlayingListener from "@/features/layout/AlarmPlayingListener";
import GlobalReminderSnoozedListener from "@/features/layout/GlobalReminderSnoozedListener";
import AppStatePermissionListener from "@/features/push-notifications/AppStatePermissionListener";
import GpsTrackingPermission from "@/features/activities/gpsToggle/gpsTrackingPermission";
import { backfillMissingDaysThrottled } from "@/database/activities/syncStepsToDatabase";
import * as Device from "expo-device";
import { hasStepsPermission } from "@/features/activities/stepToggle/stepPermission";
import {
  startStepTrackingService,
  getTodaySteps,
} from "@/native/android/NativeStepCounter";
import { requestWidgetUpdate } from "react-native-android-widget";
import { StepsWidget } from "@/features/widgets/StepsWidget";
import { getGlobalStepsConfig } from "@/features/widgets/widget-storage";

// Set Mapbox access token
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: true, // now works with focusManager above
      refetchOnReconnect: true, // now works with onlineManager above
    },
    mutations: {
      retry: 0,
    },
  },
});

// React Native Focus Manager: refetch stale queries when app returns from background
async function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }

  // Update Steps widget with fresh data and saved config when app comes to foreground
  if (status === "active" && Platform.OS === "android") {
    try {
      const [steps, config] = await Promise.all([
        getTodaySteps(),
        getGlobalStepsConfig(),
      ]);
      requestWidgetUpdate({
        widgetName: "Steps",
        renderWidget: () => <StepsWidget steps={steps} config={config} />,
      }).catch(() => {
        // Widget may not be placed, ignore
      });
    } catch {
      // Step data unavailable, ignore
    }
  }
}

// React Native Online Manager: pause/resume queries based on network status
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

configureReanimatedLogger({
  level: ReanimatedLogLevel.error,
  strict: false,
});

export default Sentry.wrap(function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Russo-One": require("../assets/fonts/RussoOne-Regular.ttf"),
    "Lexend-Medium": require("../assets/fonts/Lexend-Medium.ttf"),
  });

  const feedReady = useAppReadyStore((state) => state.feedReady);
  const resetFeedReady = useAppReadyStore((state) => state.resetFeedReady);

  const pathname = usePathname();

  // handle notification response when app is opened from notification
  useNotificationResponse();

  // Subscribe to AppState changes for TanStack Query focus refetching
  useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, []);

  // Configure Notification Channels for Android and Push Notifications
  useEffect(() => {
    configureNotificationChannels();
    configureNotificationCategories();
    configurePushNotificationsWhenAppIsOpen();

    // Only run on physical Android device
    if (Platform.OS === "android" && Device.isDevice) {
      startStepTrackingService(); // Start foreground service for continuous step tracking

      const syncSteps = async () => {
        const canReadSteps = await hasStepsPermission();

        if (canReadSteps) {
          backfillMissingDaysThrottled();
        }
      };

      syncSteps();
    }
  }, []);

  // reset feed ready when app is mounted
  useEffect(() => {
    resetFeedReady();
  }, [resetFeedReady]);

  // listen for app state changes and check permissions notifications and gps tracking
  AppStatePermissionListener();
  GpsTrackingPermission();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <MenuProvider>
            <PaperProvider>
              <TimerFinishListener />
              <AlarmPlayingListener />
              <GlobalReminderSnoozedListener />
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
                !pathname.startsWith("/onboarding") &&
                (!fontsLoaded || !feedReady) && <BootScreen />}
            </PaperProvider>
            <Toast config={toastConfig} position="top" />
          </MenuProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
});
