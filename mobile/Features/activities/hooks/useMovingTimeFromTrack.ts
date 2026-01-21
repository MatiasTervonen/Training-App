import { TrackPoint } from "@/types/session";
import { useMemo } from "react";

export function useMovingTimeFromTrack(track: TrackPoint[]) {
  return useMemo(() => {
    if (track.length < 2) return 0;

    let movingTime = 0;

    for (let i = 1; i < track.length; i++) {
      const prev = track[i - 1];
      const curr = track[i];

      if (!prev.timestamp || !curr.timestamp) continue;

      const dt = (curr.timestamp - prev.timestamp) / 1000;

      if (dt <= 0) continue;

      // Only count time while moving
      if (prev.isStationary && curr.isStationary) continue;

      movingTime += Math.min(dt, 10);
    }

    return movingTime;
  }, [track]);
}
