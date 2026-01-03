import { TrackPoint } from "@/types/session";
import { useEffect } from "react";
import { haversine } from "../lib/countDistance";

export function useCountDistance({
  track,
  meters,
  setMeters,
}: {
  track: TrackPoint[];
  meters: number;
  setMeters: React.Dispatch<React.SetStateAction<number>>;
}) {
  useEffect(() => {
    if (track.length < 2) return;

    const prev = track[track.length - 2];
    const curr = track[track.length - 1];

    if (
      prev.latitude == null ||
      prev.longitude == null ||
      curr.latitude == null ||
      curr.longitude == null
    )
      return;

    if (
      (prev.accuracy && prev.accuracy > 30) ||
      (curr.accuracy && curr.accuracy > 30)
    ) {
      return;
    }

    const distance = haversine(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude
    );

    if (distance < 2) return;

    setMeters((m: number) => m + distance);
  }, [track, setMeters]);

  return {
    totalDistanceKm: (meters / 1000).toFixed(2),
  };
}
