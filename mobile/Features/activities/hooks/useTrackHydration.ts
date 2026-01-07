import { useCallback, useEffect, useRef } from "react";
import { getDatabase } from "@/database/local-database/database";
import { TrackPoint } from "@/types/session";
import useForeground from "./useForeground";
import { useTimerStore } from "@/lib/stores/timerStore";

export function useTrackHydration({
  isRunning,
  setTrack,
  onHydrated,
}: {
  isRunning: boolean;
  setTrack: React.Dispatch<React.SetStateAction<TrackPoint[]>>;
  onHydrated: (points: TrackPoint[]) => void;
}) {
  const { isForeground } = useForeground();
  const prevForegroundRef = useRef(false);
  const { activeSession } = useTimerStore();

  const hydrateFromDatabase = useCallback(async () => {
    const db = await getDatabase();

    const result = await db.getAllAsync<{
      timestamp: number;
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number | null;
    }>(
      "SELECT timestamp, latitude, longitude, altitude, accuracy FROM gps_points ORDER BY timestamp ASC"
    );

    if (result.length > 0) {
      const points: TrackPoint[] = result.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
        altitude: point.altitude,
        accuracy: point.accuracy,
        timestamp: point.timestamp,
      }));

      setTrack(points);
      onHydrated(points);
    }
  }, [setTrack, onHydrated]);

  // Hydrate on initial mount if there's an active session
  useEffect(() => {
    if (activeSession && isRunning) {
      hydrateFromDatabase();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    const wasForeground = prevForegroundRef.current;
    prevForegroundRef.current = isForeground;

    // Also hydrate when coming back to foreground
    if (!wasForeground && isForeground && isRunning) {
      hydrateFromDatabase();
    }
  }, [isForeground, isRunning, hydrateFromDatabase]);
}
