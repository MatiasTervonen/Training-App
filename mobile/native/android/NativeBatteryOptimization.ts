import { NativeModules, Platform } from "react-native";

const nativeBatteryOptimization = NativeModules.NativeBatteryOptimization;

export async function isIgnoringBatteryOptimizations(): Promise<boolean> {
  if (Platform.OS !== "android" || !nativeBatteryOptimization) return true;
  return nativeBatteryOptimization.isIgnoringBatteryOptimizations();
}

export async function requestIgnoreBatteryOptimizations(): Promise<boolean> {
  if (Platform.OS !== "android" || !nativeBatteryOptimization) return true;
  return nativeBatteryOptimization.requestIgnoreBatteryOptimizations();
}
