import { Slot } from "expo-router";
import { StatusBar, View } from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";
import Navbar from "@/app/components/navbar/Navbar";
import "react-native-url-polyfill/auto";
import LayoutWrapper from "./components/LayoutWrapper";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Russo-One": require("../assets/fonts/RussoOne-Regular.ttf"),
  });

  useEffect(() => {
    if (__DEV__) {
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
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#020617"
        translucent={false}
      />
      <View className="flex-1 bg-slate-800 font-russo">
        <Navbar />
        <LayoutWrapper>
          <Slot />
        </LayoutWrapper>
      </View>
    </SafeAreaProvider>
  );
}
