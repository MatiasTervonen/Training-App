import { getTodaySteps as nativeGetTodaySteps } from "@/native/android/NativeStepCounter";

export async function getTodaysSteps(): Promise<number> {
  return nativeGetTodaySteps();
}
