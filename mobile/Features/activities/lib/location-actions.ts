import * as Location from "expo-location";
import { LOCATION_TASK_NAME } from "./locationTask";
import { useCallback } from "react";
import { useUserStore } from "@/lib/stores/useUserStore";

export function useStartGPStracking() {
  const gpsEnabledGlobally = useUserStore(
    (state) => state.settings?.gps_tracking_enabled
  );

  const startGPStracking = useCallback(async () => {
    if (!gpsEnabledGlobally) return;

    const started =
      await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

    if (started) return;

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Highest,
      timeInterval: 5000,
      distanceInterval: 0, // Must be 0 to detect stationary (otherwise callbacks stop when not moving)
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "MyTrack is tracking your location",
        notificationBody: "You are moving",
        notificationColor: "#0f172a",
      },
    });
  }, [gpsEnabledGlobally]);

  return {
    startGPStracking,
  };
}

export function useStopGPStracking() {
  const stopGPStracking = useCallback(async () => {
    const started =
      await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

    if (!started) return;

    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }, []);

  return {
    stopGPStracking,
  };
}
