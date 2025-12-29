import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const LOCATION_TASK_NAME = "location-task";

type Location = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error || !data) return;

  const { locations } = data as { locations: any[] };

  if (!locations.length) return;

  const track: Location[] = [];

  for (const point of locations) {
    const coord: Location = {
      latitude: point.coords.latitude,
      longitude: point.coords.longitude,
      altitude: point.coords.altitude ?? null,
      accuracy: point.coords.accuracy ?? null,
      speed: point.coords.speed ?? null,
      heading: point.coords.heading ?? null,
      timestamp: point.timestamp,
    };

    track.push(coord);
  }

  const stored = await AsyncStorage.getItem("activity_draft");

  const draft = stored ? JSON.parse(stored) : {};

  const existingTrack = Array.isArray(draft.track) ? draft.track : [];

  const nextTrack = [...existingTrack, ...track];

  await AsyncStorage.mergeItem(
    "activity_draft",
    JSON.stringify({ track: nextTrack })
  );
});
