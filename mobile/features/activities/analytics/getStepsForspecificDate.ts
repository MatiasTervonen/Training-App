import { getStepsForDate as nativeGetStepsForDate } from "@/native/android/NativeStepCounter";

export async function getStepsForDate(date: Date): Promise<number> {
  const dateString = date.toLocaleDateString("en-CA"); // "YYYY-MM-DD"
  return nativeGetStepsForDate(dateString);
}
