import { NativeModules, Platform } from "react-native";

const nativeTimer = NativeModules.NativeTimer;

export function startNativeTimer(
  startTime: number,
  label: string,
  mode: string,
  statusText?: string,
  pauseText?: string,
  extendText?: string,
) {
  if (Platform.OS === "android" && nativeTimer) {
    nativeTimer.startTimer(
      startTime,
      label,
      mode,
      statusText || "",
      pauseText || "Stop",
      extendText || "+1 min",
    );
  }
}

export function updateNativeTimerLabel(
  startTime: number,
  label: string,
  mode: string,
  statusText?: string,
  pauseText?: string,
  extendText?: string,
) {
  if (Platform.OS === "android" && nativeTimer) {
    nativeTimer.updateTimerLabel(
      startTime,
      label,
      mode,
      statusText || "",
      pauseText || "Stop",
      extendText || "+1 min",
    );
  }
}

export function pauseNativeTimer(
  frozenTime?: string,
  pausedLabel?: string,
  resumeText?: string,
) {
  if (Platform.OS === "android" && nativeTimer) {
    nativeTimer.pauseTimer(
      frozenTime || "",
      pausedLabel || "Paused",
      resumeText || "Resume",
    );
  }
}

export function stopNativeTimer() {
  if (Platform.OS === "android" && nativeTimer) {
    nativeTimer.stopTimer();
  }
}
