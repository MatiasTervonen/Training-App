import "@/lib/nativewindInterop";
import { Slot } from "expo-router";
import { StatusBar, View } from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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
import { toastConfig } from "@/lib/config/toast";
import useScreenOrientation from "@/hooks/layout/useScreenOrientation";

Sentry.init({
  dsn: "https://cf3db79ed11dbd657e73bb68617c6a34@o4510142810619904.ingest.de.sentry.io/4510160894361680",
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],
});

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
  const [loaded, error] = useFonts({
    "Russo-One": require("../assets/fonts/RussoOne-Regular.ttf"),
  });

  // useScreenOrientation hook to get screen orientation and hide navbar on timer page when in landscape mode
  const { hideNawbar } = useScreenOrientation();

  const insets = useSafeAreaInsets();

  // Configure Notification Channels for Android
  useEffect(() => {
    configureNotificationChannels();
    configurePushNotificationsWhenAppIsOpen();
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
              <View
                style={{
                  flex: 1,
                  paddingTop: insets.top,
                  paddingBottom: insets.bottom,
                  paddingLeft: insets.left,
                  paddingRight: insets.right,
                }}
                className="bg-slate-900"
              >
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
              </View>
            </SafeAreaProvider>
          </PaperProvider>
          <Toast config={toastConfig} position="top" />
        </MenuProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
});
