import { useCallback, useEffect, useRef } from "react";
import { getDatabase } from "@/database/local-database/database";
import { TrackPoint } from "@/types/session";
import useForeground from "./useForeground";
import { useTimerStore } from "@/lib/stores/timerStore";
import { handleError } from "@/utils/handleError";

export function useTrackHydration({
  setTrack,
  onHydrated,
}: {
  setTrack: React.Dispatch<React.SetStateAction<TrackPoint[]>>;
  onHydrated: (points: TrackPoint[]) => void;
}) {
  const { isForeground } = useForeground();
  const prevForegroundRef = useRef(false);
  const { activeSession } = useTimerStore();
  const isHydratingRef = useRef(false);
  const hydrateFromDatabase = useCallback(async () => {
    if (isHydratingRef.current) return;
    isHydratingRef.current = true;

    try {
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
    } catch (error) {
      handleError(error, {
        message: "Error hydrating from database",
        route: "/features/activities/hooks/useTrackHydration",
        method: "hydrateFromDatabase",
      });
    } finally {
      isHydratingRef.current = false;
    }
  }, [setTrack, onHydrated]);

  // Hydrate on initial mount if there's an active session
  useEffect(() => {
    if (activeSession) {
      hydrateFromDatabase();
    }
  }, [activeSession, hydrateFromDatabase]);

  useEffect(() => {
    const wasForeground = prevForegroundRef.current;
    prevForegroundRef.current = isForeground;

    // Also hydrate when coming back to foreground (regardless of isRunning)
    if (!wasForeground && isForeground && activeSession) {
      hydrateFromDatabase();
    }
  }, [isForeground, activeSession, hydrateFromDatabase]);
}
