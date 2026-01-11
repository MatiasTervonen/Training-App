import { NativeModules, Platform } from "react-native";

const nativeTimer = NativeModules.NativeTimer;

export function startNativeTimer(startTime: number, label: string, mode: string) {
  if (Platform.OS === "android" && nativeTimer) {
    nativeTimer.startTimer(startTime, label, mode);
  }
}

export function stopNativeTimer() {
  if (Platform.OS === "android" && nativeTimer) {
    nativeTimer.stopTimer();
  }
}
