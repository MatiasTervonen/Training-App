import { hasStepPermission } from "@/native/android/NativeStepCounter";

export async function hasStepsPermission(): Promise<boolean> {
  return hasStepPermission();
}
