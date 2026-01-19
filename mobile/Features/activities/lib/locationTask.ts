import * as TaskManager from "expo-task-manager";
import { getDatabase } from "@/database/local-database/database";
import { handleError } from "@/utils/handleError";

export const LOCATION_TASK_NAME = "location-task";

type Location = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  timestamp: number;
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error || !data) return;

  const { locations } = data as { locations: any[] };
  if (!locations.length) return;

  try {
    const db = await getDatabase();

    // Get the last saved point to check if we were moving
    const lastPoint = await db.getFirstAsync<{ is_stationary: number }>(
      "SELECT is_stationary FROM gps_points ORDER BY timestamp DESC LIMIT 1"
    );
    let wasMoving = lastPoint ? lastPoint.is_stationary === 0 : true;

    for (const point of locations) {
      const coord: Location = {
        latitude: point.coords.latitude,
        longitude: point.coords.longitude,
        altitude: point.coords.altitude ?? null,
        accuracy: point.coords.accuracy ?? null,
        speed: point.coords.speed ?? null,
        timestamp: point.timestamp,
      };

      // Filter out low accuracy points
      if ((coord.accuracy ?? Infinity) > 20) continue;

      const isMoving = (coord.speed ?? 0) >= 0.6;
      const isTransitionToStationary = !isMoving && wasMoving;

      // If already stationary and still stationary, skip (jitter protection)
      if (!isMoving && !wasMoving) {
        continue;
      }

      const isStationary = isTransitionToStationary ? 1 : 0;

      await db.runAsync(
        `INSERT INTO gps_points (timestamp, latitude, longitude, altitude, accuracy, is_stationary) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          coord.timestamp,
          coord.latitude,
          coord.longitude,
          coord.altitude ?? null,
          coord.accuracy ?? null,
          isStationary,
        ]
      );

      // Update state for next iteration
      wasMoving = isMoving;
    }
  } catch (error) {
    handleError(error, {
      message: "Error persisting points to database",
      route: "/features/activities/lib/locationTask",
      method: "LOCATION_TASK_NAME",
    });
  }
});
