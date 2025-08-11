import "@/lib/nativewindInterop";
import { Slot } from "expo-router";
import { StatusBar, View } from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "./global.css";
import Navbar from "@/components/navbar/Navbar";
import "react-native-url-polyfill/auto";
import LayoutWrapper from "@/components/LayoutWrapper";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/toastGonfig";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Russo-One": require("../assets/fonts/RussoOne-Regular.ttf"),
  });

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
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar
            barStyle="light-content"
            backgroundColor="#020617"
            translucent={false}
          />
          <SafeAreaView style={{ flex: 1 }} className="bg-slate-950">
            <View className="flex-1 bg-slate-800 font-russo">
              <Navbar />
              <LayoutWrapper>
                <Slot />
              </LayoutWrapper>
              <Toast config={toastConfig} position="top" />
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
