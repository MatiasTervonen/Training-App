import { NativeModules, Platform } from "react-native";

const nativeRestTimer = NativeModules.NativeRestTimer;

export function startNativeRestTimer(
  endTime: number,
  label: string,
  statusText: string,
  cancelText: string,
  finishedText: string,
) {
  if (Platform.OS === "android" && nativeRestTimer) {
    nativeRestTimer.startRestTimer(
      endTime,
      label,
      statusText,
      cancelText,
      finishedText,
    );
  }
}

export function stopNativeRestTimer() {
  if (Platform.OS === "android" && nativeRestTimer) {
    nativeRestTimer.stopRestTimer();
  }
}
