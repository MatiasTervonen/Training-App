import * as TaskManager from "expo-task-manager";
import { getDatabase } from "@/database/local-database/database";
import { handleError } from "@/utils/handleError";
import { LocationObject } from "expo-location";
import { haversine } from "./countDistance";
import { detectMovement, MovementState } from "./stationaryDetection";

export const LOCATION_TASK_NAME = "location-task";

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error || !data) return;

  const { locations } = data as { locations: LocationObject[] };
  if (!locations.length) return;

  try {
    const db = await getDatabase();

    // Get last saved point (full context)
    const lastSaved = await db.getFirstAsync<{
      latitude: number;
      longitude: number;
      timestamp: number;
      is_stationary: number;
      confidence: number;
    }>(
      `SELECT latitude, longitude, timestamp, is_stationary, confidence
       FROM gps_points
       ORDER BY timestamp DESC
       LIMIT 1`
    );

    // Get last moving point for anchor (exclude bad_signal points)
    const lastMoving = await db.getFirstAsync<{
      latitude: number;
      longitude: number;
      timestamp: number;
    }>(
      `SELECT latitude, longitude, timestamp
       FROM gps_points
       WHERE is_stationary = 0 AND bad_signal = 0
       ORDER BY timestamp DESC
       LIMIT 1`
    );

    // Count consecutive bad_signal points at the end (simple approach)
    const recentPoints = await db.getAllAsync<{ bad_signal: number }>(
      `SELECT bad_signal FROM gps_points ORDER BY timestamp DESC LIMIT 10`
    );
    let badSignalCount = 0;
    for (const p of recentPoints) {
      if (p.bad_signal === 1) {
        badSignalCount++;
      } else {
        break;
      }
    }

    let state: MovementState = {
      confidence: lastSaved?.confidence ?? 0,
      badSignalCount: badSignalCount,
      lastMovingPoint: lastMoving ?? null,
      lastAcceptedTimestamp: lastSaved?.timestamp ?? null,
    }

    let lastPoint = lastSaved
      ? {
        latitude: lastSaved.latitude,
        longitude: lastSaved.longitude,
      }
      : null;

    for (const location of locations) {
      const point = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude ?? null,
        accuracy: location.coords.accuracy ?? null,
        timestamp: location.timestamp,
      };

      // Timestamp sanity
      if (state.lastAcceptedTimestamp && point.timestamp <= state.lastAcceptedTimestamp) {
        continue;
      }

      const result = detectMovement(point, lastPoint, state, haversine);
      state = result.newState;

      if (!result.shouldSave) continue;

      await db.runAsync(
        `INSERT INTO gps_points (timestamp, latitude, longitude, altitude, accuracy, is_stationary, confidence, bad_signal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          point.timestamp,
          point.latitude,
          point.longitude,
          point.altitude ?? null,
          point.accuracy ?? null,
          result.isBadSignal ? 0 : (result.isMoving ? 0 : 1), // Only mark stationary if not bad signal
          state.confidence,
          result.isBadSignal ? 1 : 0,
        ]
      );


      lastPoint = { latitude: point.latitude, longitude: point.longitude };
    }
  } catch (error) {
    handleError(error, {
      message: "Error persisting points to database",
      route: "/features/activities/lib/locationTask",
      method: "LOCATION_TASK_NAME",
    });
  }
});
