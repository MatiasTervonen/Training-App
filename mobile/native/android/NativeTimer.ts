import { NativeModules, Platform } from "react-native";

const nativeTimer = NativeModules.NativeTimer;

export function startNativeTimer(startTime: number, label: string) {
  if (Platform.OS === "android" && nativeTimer) {
    nativeTimer.startTimer(startTime, label);
  }
}

export function stopNativeTimer() {
  if (Platform.OS === "android" && nativeTimer) {
    nativeTimer.stopTimer();
  }
}
