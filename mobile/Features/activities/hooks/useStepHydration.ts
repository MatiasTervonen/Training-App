import { useCallback, useEffect, useRef } from "react";
import useForeground from "./useForeground";
import { useTimerStore } from "@/lib/stores/timerStore";
import { handleError } from "@/utils/handleError";
import { readRecords } from "react-native-health-connect";

export function useStepHydration({
  setSteps,
  stepsAllowed,
}: {
  setSteps: React.Dispatch<React.SetStateAction<number>>;
  stepsAllowed: boolean;
}) {
  const { isForeground } = useForeground();
  const prevForegroundRef = useRef(false);
  const { activeSession } = useTimerStore();
  const isHydratingRef = useRef(false);

  const hydrateSteps = useCallback(async () => {
    if (!stepsAllowed || !activeSession || isHydratingRef.current) return;

    isHydratingRef.current = true;

    try {
      const now = new Date().toISOString();

      const steps = await readRecords("Steps", {
        timeRangeFilter: {
          operator: "between",
          startTime: new Date(activeSession.started_at).toISOString(),
          endTime: now,
        },
      });

      const totalSteps = steps.records.reduce(
        (acc, record) => acc + record.count,
        0
      );

      setSteps(totalSteps);
    } catch (error) {
      handleError(error, {
        message: "Error hydrating steps",
        route: "/features/activities/hooks/useStepHydration",
        method: "hydrateSteps",
      });
    } finally {
      isHydratingRef.current = false;
    }
  }, [setSteps, activeSession, stepsAllowed]);

  // Hydrate on initial mount if there's an active session
  useEffect(() => {
    if (activeSession) {
      hydrateSteps();
    }
  }, [activeSession, hydrateSteps]);

  useEffect(() => {
    const wasForeground = prevForegroundRef.current;
    prevForegroundRef.current = isForeground;

    // Also hydrate when coming back to foreground (regardless of isRunning)
    if (!wasForeground && isForeground && activeSession) {
      hydrateSteps();
    }
  }, [isForeground, activeSession, hydrateSteps]);
}
