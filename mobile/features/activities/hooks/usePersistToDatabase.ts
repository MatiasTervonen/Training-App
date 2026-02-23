import { getDatabase } from "@/database/local-database/database";
import { useCallback, useEffect, useRef } from "react";
import { TrackPoint } from "@/types/session";
import { useTimerStore } from "@/lib/stores/timerStore";
import { handleError } from "@/utils/handleError";
import { debugLog } from "../lib/debugLogger";

export function usePersistToDatabase() {
  const trackRef = useRef<TrackPoint[]>([]);
  const activeSession = useTimerStore((state) => state.activeSession);
  const lastPersistedLengthRef = useRef(0);
  const isPersistingRef = useRef(false);
  const lastPersistRef = useRef(0);

  useEffect(() => {
    if (!activeSession) {
      trackRef.current = [];
      lastPersistedLengthRef.current = 0;
      lastPersistRef.current = 0;
    }
  }, [activeSession]);

  // Persist the track to the local-database
  const addPoint = useCallback(async (point: TrackPoint) => {


    const lastPoint = trackRef.current[trackRef.current.length - 1];
    if (lastPoint?.timestamp === point.timestamp) {
      return;
    }

    trackRef.current.push(point);

    const now = Date.now();
    const shouldPersist =
      now - lastPersistRef.current >= 2000 || // Reduced from 5000ms to 2000ms
      trackRef.current.length - lastPersistedLengthRef.current >= 5; // Reduced from 25 to 5

    if (!shouldPersist || isPersistingRef.current) return;

    lastPersistRef.current = now;
    isPersistingRef.current = true;

    try {
      const db = await getDatabase();
      const pointsToPersist = trackRef.current.slice(
        lastPersistedLengthRef.current
      );

      if (pointsToPersist.length === 0) {
        isPersistingRef.current = false;
        return;
      }

      // Insert points without explicit transaction to avoid locking conflicts
      for (const point of pointsToPersist) {
        await db.runAsync(
          `INSERT OR IGNORE INTO gps_points (timestamp, latitude, longitude, altitude, accuracy, is_stationary, confidence, bad_signal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            point.timestamp,
            point.latitude,
            point.longitude,
            point.altitude ?? null,
            point.accuracy ?? null,
            point.isStationary ? 1 : 0,
            point.confidence ?? 0,
            point.isBadSignal ? 1 : 0,
          ]
        );
      }

      lastPersistedLengthRef.current = trackRef.current.length;
    } catch (error) {
      handleError(error, {
        message: "Error persisting points to database",
        route: "/features/activities/hooks/usePersistToDatabase",
        method: "addPoint",
      });
    } finally {
      isPersistingRef.current = false;
    }
  }, []);

  const replaceFromHydration = useCallback(async (points: TrackPoint[]) => {
    debugLog("PERSIST", `replaceFromHydration: ${points.length} pts`);
    trackRef.current = points;
    lastPersistedLengthRef.current = points.length;
    lastPersistRef.current = Date.now();
  }, []);

  return {
    addPoint,
    replaceFromHydration,
  };
}
