import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AppState } from "react-native";
import {
  startStepSession,
  getSessionSteps,
  startLiveStepUpdates,
  stopLiveStepUpdates,
  addLiveStepListener,
} from "@/native/android/NativeStepCounter";
import {
  getMovementType,
  getStrideLength,
  getDistanceFromSteps,
} from "@/features/activities/lib/strideLength";
import { useUserStore } from "@/lib/stores/useUserStore";

export default function usePhaseTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [sessionSteps, setSessionSteps] = useState(0);
  const [baseSteps, setBaseSteps] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const activitySlugRef = useRef<string | null>(null);
  const baseStepsRef = useRef(0);

  const heightCm = useUserStore((state) => state.profile?.height_cm ?? null);

  const steps = baseSteps + sessionSteps;

  const estimatedDistance = useMemo(() => {
    if (steps <= 0) return 0;
    const movementType = getMovementType(activitySlugRef.current);
    const stride = getStrideLength(heightCm, movementType);
    return getDistanceFromSteps(steps, stride);
  }, [steps, heightCm]);

  const start = useCallback(async (slug?: string | null) => {
    if (slug !== undefined) activitySlugRef.current = slug ?? null;
    await startStepSession();
    startLiveStepUpdates();
    startTimeRef.current = Date.now();
    setBaseSteps(0);
    baseStepsRef.current = 0;
    setSessionSteps(0);
    setElapsedSeconds(0);
    setIsTracking(true);
  }, []);

  const resume = useCallback(async (timestamp: number, slug?: string | null, previousSteps?: number) => {
    if (slug !== undefined) activitySlugRef.current = slug ?? null;
    startTimeRef.current = timestamp;
    setElapsedSeconds(Math.floor((Date.now() - timestamp) / 1000));
    const base = previousSteps ?? 0;
    setBaseSteps(base);
    baseStepsRef.current = base;
    // Don't start a new step session — the native session_start_value
    // from the original start() is still in SharedPreferences.
    // Hydrate the accumulated steps from the native counter instead.
    const currentSessionSteps = await getSessionSteps();
    setSessionSteps(currentSessionSteps);
    startLiveStepUpdates();
    setIsTracking(true);
  }, []);

  const stop = useCallback(async () => {
    stopLiveStepUpdates();
    setIsTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const finalSessionSteps = await getSessionSteps();
    const totalSteps = baseStepsRef.current + finalSessionSteps;
    setSessionSteps(finalSessionSteps);
    const finalElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setElapsedSeconds(finalElapsed);

    // Compute final distance from total step count
    const movementType = getMovementType(activitySlugRef.current);
    const stride = getStrideLength(
      useUserStore.getState().profile?.height_cm ?? null,
      movementType,
    );
    const distanceMeters = getDistanceFromSteps(totalSteps, stride);

    return { steps: totalSteps, duration_seconds: finalElapsed, distance_meters: distanceMeters };
  }, []);

  // Timer tick
  useEffect(() => {
    if (!isTracking) return;

    intervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTracking]);

  // Live step listener
  useEffect(() => {
    if (!isTracking) return;

    const sub = addLiveStepListener((liveSteps: number) => {
      setSessionSteps(liveSteps);
    });

    return () => {
      sub.remove();
    };
  }, [isTracking]);

  // Hydrate steps when returning from background (native counter keeps accumulating)
  useEffect(() => {
    if (!isTracking) return;

    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active") {
        const totalSessionSteps = await getSessionSteps();
        setSessionSteps(totalSessionSteps);
      }
    });

    return () => sub.remove();
  }, [isTracking]);

  return {
    isTracking,
    steps,
    elapsedSeconds,
    estimatedDistance,
    start,
    resume,
    stop,
  };
}
