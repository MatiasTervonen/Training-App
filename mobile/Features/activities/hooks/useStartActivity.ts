import { useTimerStore } from "@/lib/stores/timerStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useStartGPStracking } from "@/Features/activities/lib/location-actions";
import { getDatabase } from "@/database/local-database/database";
import { clearLocalSessionDatabase } from "@/Features/activities/lib/database-actions";

export function useStartActivity({
  activityName,
  title,
}: {
  activityName: string;
  title: string;
}) {
  const { elapsedTime, setActiveSession, startTimer } = useTimerStore();
  const { startGPStracking } = useStartGPStracking();

  const startActivity = async () => {
    if (elapsedTime > 0) return;

    if (!activityName || activityName.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select an activity",
      });
      return;
    }

    const initializeDatabase = async () => {
      const db = await getDatabase();

      try {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS gps_points (
              timestamp INTEGER NOT NULL,
              latitude REAL NOT NULL,
              longitude REAL NOT NULL,
              altitude REAL,
              accuracy REAL
            );
        `);

        // Clear any leftover data from previous sessions
        await clearLocalSessionDatabase();

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

    setActiveSession({
      type: "activity",
      label: title,
      path: "/activities/start-activity",
    });

    const start_time = new Date().toISOString();

    const stored = await AsyncStorage.getItem("activity_draft");
    const draft = stored ? JSON.parse(stored) : {};

    await AsyncStorage.setItem(
      "activity_draft",
      JSON.stringify({ ...draft, start_time })
    );

    await startGPStracking();

    startTimer(0);
  };

  return {
    startActivity,
  };
}
