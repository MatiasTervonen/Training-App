import { useState, useEffect, useRef, useCallback } from "react";
import {
  startStepSession,
  getSessionSteps,
  startLiveStepUpdates,
  stopLiveStepUpdates,
  addLiveStepListener,
} from "@/native/android/NativeStepCounter";

export default function usePhaseTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const start = useCallback(async () => {
    await startStepSession();
    startLiveStepUpdates();
    startTimeRef.current = Date.now();
    setSteps(0);
    setElapsedSeconds(0);
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
    return { steps: finalSteps, duration_seconds: finalElapsed };
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
    start,
    stop,
  };
}
