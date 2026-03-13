import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  const [steps, setSteps] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const activitySlugRef = useRef<string | null>(null);

  const heightCm = useUserStore((state) => state.profile?.height_cm ?? null);

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
    setSteps(0);
    setElapsedSeconds(0);
    setIsTracking(true);
  }, []);

  const resume = useCallback(async (timestamp: number, slug?: string | null) => {
    if (slug !== undefined) activitySlugRef.current = slug ?? null;
    startTimeRef.current = timestamp;
    setElapsedSeconds(Math.floor((Date.now() - timestamp) / 1000));
    await startStepSession();
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
    const finalSteps = await getSessionSteps();
    setSteps(finalSteps);
    const finalElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setElapsedSeconds(finalElapsed);

    // Compute final distance from final step count
    const movementType = getMovementType(activitySlugRef.current);
    const stride = getStrideLength(
      useUserStore.getState().profile?.height_cm ?? null,
      movementType,
    );
    const distanceMeters = getDistanceFromSteps(finalSteps, stride);

    return { steps: finalSteps, duration_seconds: finalElapsed, distance_meters: distanceMeters };
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
      setSteps(liveSteps);
    });

    return () => {
      sub.remove();
    };
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
