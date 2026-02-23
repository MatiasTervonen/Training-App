import { useMemo } from "react";

export function useAveragePace(meters: number, movingTimeSeconds: number) {
  return useMemo(() => {
    if (meters <= 0 || movingTimeSeconds <= 0) return 0;

    return movingTimeSeconds / (meters / 1000);
  }, [meters, movingTimeSeconds]);
}
