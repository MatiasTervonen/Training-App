import { NativeModules, Platform } from "react-native";

const nativeStepCounter = NativeModules.NativeStepCounter;

export function initializeStepCounter(): void {
  if (Platform.OS === "android" && nativeStepCounter) {
    nativeStepCounter.initializeStepCounter();
  }
}

export async function hasStepPermission(): Promise<boolean> {
  if (Platform.OS !== "android" || !nativeStepCounter) return false;
  return nativeStepCounter.hasPermission();
}

export async function requestStepPermission(): Promise<boolean> {
  if (Platform.OS !== "android" || !nativeStepCounter) return false;
  return nativeStepCounter.requestPermission();
}

export async function isStepPermissionPermanentlyDenied(): Promise<boolean> {
  if (Platform.OS !== "android" || !nativeStepCounter) return false;
  return nativeStepCounter.isPermissionPermanentlyDenied();
}

export async function hasStepSensor(): Promise<boolean> {
  if (Platform.OS !== "android" || !nativeStepCounter) return false;
  return nativeStepCounter.hasSensor();
}

export async function getTodaySteps(): Promise<number> {
  if (Platform.OS !== "android" || !nativeStepCounter) return 0;
  return nativeStepCounter.getTodaySteps();
}

export async function getStepsForDate(dateString: string): Promise<number> {
  if (Platform.OS !== "android" || !nativeStepCounter) return 0;
  return nativeStepCounter.getStepsForDate(dateString);
}

export async function startStepSession(): Promise<boolean> {
  if (Platform.OS !== "android" || !nativeStepCounter) return false;
  return nativeStepCounter.startSession();
}

export async function getSessionSteps(): Promise<number> {
  if (Platform.OS !== "android" || !nativeStepCounter) return 0;
  return nativeStepCounter.getSessionSteps();
}

export async function getDailyStepsHistory(
  days: number,
): Promise<Record<string, number>> {
  if (Platform.OS !== "android" || !nativeStepCounter) return {};
  return nativeStepCounter.getDailyStepsHistory(days);
}
