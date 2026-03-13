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

export function setMilestoneConfig(config: {
  steps: { enabled: boolean; interval: number };
  duration: { enabled: boolean; interval: number };
  distance: { enabled: boolean; interval: number };
  calories: { enabled: boolean; interval: number };
  baseMet: number;
  userWeight: number;
}) {
  if (Platform.OS === "android" && nativeTimer) {
    nativeTimer.setMilestoneConfig(JSON.stringify(config));
  }
}

export function clearMilestoneConfig() {
  if (Platform.OS === "android" && nativeTimer) {
    nativeTimer.clearMilestoneConfig();
  }
}

export function setAppInForeground(inForeground: boolean) {
  if (Platform.OS === "android" && nativeTimer) {
    nativeTimer.setAppInForeground(inForeground);
  }
}

export async function getMilestoneThresholds(): Promise<{
  steps: number | null;
  durationSecs: number | null;
  distanceMeters: number | null;
  calories: number | null;
} | null> {
  if (Platform.OS !== "android" || !nativeTimer) return null;
  const json: string | null = await nativeTimer.getMilestoneThresholds();
  if (!json) return null;
  return JSON.parse(json);
}

export function updateCumulativeDistance(meters: number) {
  if (Platform.OS === "android" && nativeTimer) {
    nativeTimer.updateCumulativeDistance(meters);
  }
}
