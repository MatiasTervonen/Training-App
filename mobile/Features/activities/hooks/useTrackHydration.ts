import { useCallback, useEffect, useRef } from "react";
import { getDatabase } from "@/database/local-database/database";
import { TrackPoint } from "@/types/session";
import useForeground from "./useForeground";
import { useTimerStore } from "@/lib/stores/timerStore";

export function useTrackHydration({
  isRunning,
  setTrack,
  onHydrated,
  setMeters,
}: {
  isRunning: boolean;
  setTrack: React.Dispatch<React.SetStateAction<TrackPoint[]>>;
  onHydrated: (points: TrackPoint[]) => void;
  setMeters: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { isForeground } = useForeground();
  const prevForegroundRef = useRef(false);
  const { activeSession } = useTimerStore();

  useEffect(() => {
    if (!activeSession) {
      setTrack([]);
      setMeters(0);
      onHydrated([]);
      prevForegroundRef.current = false;
    }
  }, [activeSession, setTrack, setMeters, onHydrated]);

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

      const meters = await db.getFirstAsync<{ meters: number }>(
        "SELECT meters FROM session_stats"
      );

      if (meters) {
        setMeters(meters.meters);
      }

      setTrack(points);
      onHydrated(points);
    }
  }, [setTrack, setMeters, onHydrated]);

  useEffect(() => {
    const wasForeground = prevForegroundRef.current;
    prevForegroundRef.current = isForeground;

    if (!wasForeground && isForeground && isRunning) {
      hydrateFromDatabase();
    }
  }, [isForeground, isRunning, hydrateFromDatabase]);
}
