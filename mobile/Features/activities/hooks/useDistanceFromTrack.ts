import { TrackPoint } from "@/types/session";
import { useMemo } from "react";
import { haversine } from "../lib/countDistance";

export function useDistanceFromTrack({ track }: { track: TrackPoint[] }) {
  const meters = useMemo(() => {
    if (track.length < 2) return 0;

    let total = 0;

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

      const distance = haversine(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );

      if (distance < 2) continue;

      total += distance;
    }

    return total;
  }, [track]);

  return {
    meters,
  };
}
