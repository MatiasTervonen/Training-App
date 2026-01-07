import { TrackPoint } from "@/types/session";
import { useMemo } from "react";

export function useMovingTimeFromTrack(track: TrackPoint[]) {
  return useMemo(() => {
    if (track.length < 2) return 0;

    let totalTime = 0;

    for (let i = 1; i < track.length; i++) {
      const prev = track[i - 1];
      const curr = track[i];

      if (
        prev.latitude == null ||
        prev.longitude == null ||
        curr.latitude == null ||
        curr.longitude == null
      )
        continue;

      if (
        (prev.accuracy && prev.accuracy > 30) ||
        (curr.accuracy && curr.accuracy > 30)
      )
        continue;

      if (curr.timestamp == null || prev.timestamp == null) continue;

      const delta_time_seconds = (curr.timestamp - prev.timestamp) / 1000;

      if (delta_time_seconds < 0.5 || delta_time_seconds > 30) continue;

      totalTime += delta_time_seconds;
    }

    return totalTime;
  }, [track]);
}
