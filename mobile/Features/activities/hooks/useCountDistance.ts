import { TrackPoint } from "@/types/session";
import { useEffect } from "react";

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // meters
  const toRad = (v: number) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

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
