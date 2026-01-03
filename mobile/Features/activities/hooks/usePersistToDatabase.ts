import { getDatabase } from "@/database/local-database/database";
import { useCallback, useEffect, useRef } from "react";
import { TrackPoint } from "@/types/session";
import { useTimerStore } from "@/lib/stores/timerStore";

export function usePersistToDatabase() {
  const trackRef = useRef<TrackPoint[]>([]);
  const { activeSession } = useTimerStore();
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
  const addPoint = useCallback(async (point: TrackPoint, meters: number) => {
    trackRef.current.push(point);

    const now = Date.now();
    const shouldPersist =
      now - lastPersistRef.current >= 5000 ||
      trackRef.current.length - lastPersistedLengthRef.current >= 25;

    if (!shouldPersist || isPersistingRef.current) return;

    lastPersistRef.current = now;
    isPersistingRef.current = true;

    const db = await getDatabase();
    const pointsToPersist = trackRef.current.slice(
      lastPersistedLengthRef.current
    );

    if (pointsToPersist.length === 0) {
      isPersistingRef.current = false;
      return;
    }

    await db.execAsync("BEGIN");

    try {
      for (const point of pointsToPersist) {
        await db.runAsync(
          `INSERT INTO gps_points (timestamp, latitude, longitude, altitude, accuracy) VALUES (?, ?, ?, ?, ?)`,
          [
            point.timestamp,
            point.latitude,
            point.longitude,
            point.altitude ?? null,
            point.accuracy ?? null,
          ]
        );
      }

      await db.runAsync(`UPDATE session_stats SET meters = ?`, [meters]);

      await db.execAsync("COMMIT");
      lastPersistedLengthRef.current = trackRef.current.length;
    } catch (error) {
      await db.execAsync("ROLLBACK");
      console.error("Error persisting points to database", error);
    } finally {
      isPersistingRef.current = false;
    }
  }, []);

  const replaceFromFydration = useCallback(async (points: TrackPoint[]) => {
    trackRef.current = points;
    lastPersistedLengthRef.current = points.length;
    lastPersistRef.current = Date.now();
  }, []);

  return {
    addPoint,
    replaceFromFydration,
  };
}
