import { useEffect, useRef } from "react";
import {
  startLiveStepUpdates,
  stopLiveStepUpdates,
  addLiveStepListener,
} from "@/native/android/NativeStepCounter";

export function useLiveStepCounter({
  enabled,
  setSteps,
}: {
  enabled: boolean;
  setSteps: React.Dispatch<React.SetStateAction<number>>;
}) {
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) return;

    startLiveStepUpdates();

    const sub = addLiveStepListener((steps: number) => {
      if (enabledRef.current) {
        setSteps(steps);
      }
    });

    return () => {
      sub.remove();
      stopLiveStepUpdates();
    };
  }, [enabled, setSteps]);
}
