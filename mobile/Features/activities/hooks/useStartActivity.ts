import { useTimerStore } from "@/lib/stores/timerStore";
import Toast from "react-native-toast-message";
import {
  useStartGPStracking,
  useStopGPStracking,
} from "@/features/activities/lib/location-actions";
import { getDatabase } from "@/database/local-database/database";
import { clearLocalSessionDatabase } from "@/features/activities/lib/database-actions";
import { startStepSession } from "@/native/android/NativeStepCounter";
import { clearLog, debugLog } from "@/features/activities/lib/debugLogger";

export function useStartActivity({
  activityName,
  title,
  allowGPS,
  stepsAllowed,
}: {
  activityName: string;
  title: string;
  allowGPS: boolean;
  stepsAllowed: boolean;
}) {
  const setActiveSession = useTimerStore((state) => state.setActiveSession);
  const startSession = useTimerStore((state) => state.startSession);
  const { startGPStracking } = useStartGPStracking();
  const { stopGPStracking } = useStopGPStracking();

  const startActivity = async () => {
    if (!activityName || activityName.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select an activity",
      });
      return;
    }

    // Clear debug log from previous session
    clearLog();
    debugLog("SESSION", `Starting activity: ${activityName}, gps=${allowGPS}, steps=${stepsAllowed}`);

    // Stop any running GPS tracking first to prevent race conditions
    await stopGPStracking();

    // Wait briefly to ensure any pending database writes complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Always clear old GPS data first to avoid loading stale points
    await clearLocalSessionDatabase();

    if (allowGPS) {
      const initializeDatabase = async () => {
        const db = await getDatabase();

        try {
          // Create fresh table for new session
          await db.execAsync(`
            CREATE TABLE IF NOT EXISTS gps_points (
              timestamp INTEGER NOT NULL UNIQUE,
              latitude REAL NOT NULL,
              longitude REAL NOT NULL,
              altitude REAL,
              accuracy REAL,
              is_stationary INTEGER DEFAULT 0,
              confidence INTEGER DEFAULT 0,
              bad_signal INTEGER DEFAULT 0
            );
        `);

          return true;
        } catch (error) {
          console.error("Error initializing database", error);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to initialize database. Please try again.",
          });
          return false;
        }
      };

      const ok = await initializeDatabase();

      if (!ok) return;
    }

    setActiveSession({
      type: activityName,
      label: title,
      path: "/activities/start-activity",
      gpsAllowed: allowGPS,
      stepsAllowed: stepsAllowed,
    });

    if (stepsAllowed) {
      await startStepSession();
    }

    if (allowGPS) {
      await startGPStracking();
    }

    startSession(activityName);
  };

  return {
    startActivity,
  };
}
