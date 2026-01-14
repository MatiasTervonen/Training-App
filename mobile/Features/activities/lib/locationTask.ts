import * as TaskManager from "expo-task-manager";
import { getDatabase } from "@/database/local-database/database";

export const LOCATION_TASK_NAME = "location-task";

type Location = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  timestamp: number;
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error || !data) return;

  const { locations } = data as { locations: any[] };
  if (!locations.length) return;

  try {
    const db = await getDatabase();

    // Insert points without explicit transaction to avoid locking conflicts
    for (const point of locations) {
      const coord: Location = {
        latitude: point.coords.latitude,
        longitude: point.coords.longitude,
        altitude: point.coords.altitude ?? null,
        accuracy: point.coords.accuracy ?? null,
        timestamp: point.timestamp,
      };

      const isMoving = (coord.accuracy ?? Infinity) <= 20;
      if (!isMoving) continue;

      await db.runAsync(
        `INSERT INTO gps_points (timestamp, latitude, longitude, altitude, accuracy) VALUES (?, ?, ?, ?, ?)`,
        [
          coord.timestamp,
          coord.latitude,
          coord.longitude,
          coord.altitude ?? null,
          coord.accuracy ?? null,
        ]
      );
    }
  } catch (error) {
    console.error("Error persisting points to database", error);
  }
});
