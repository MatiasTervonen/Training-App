import { useState, useEffect } from "react";
import { AppState } from "react-native";
import { getTodaySteps } from "@/native/android/NativeStepCounter";
import { Platform } from "react-native";

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function useTodaySteps() {
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const fetchSteps = () => {
      getTodaySteps().then(setSteps).catch(() => {});
    };

    fetchSteps();

    const interval = setInterval(fetchSteps, POLL_INTERVAL_MS);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") fetchSteps();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  return steps;
}
