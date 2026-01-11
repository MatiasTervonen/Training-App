import { confirmAction } from "@/lib/confirmAction";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { saveActivitySession } from "@/database/activities/save-session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStopGPStracking } from "@/Features/activities/lib/location-actions";
import { useQueryClient } from "@tanstack/react-query";
import { getDatabase } from "@/database/local-database/database";
import { clearLocalSessionDatabase } from "@/Features/activities/lib/database-actions";
import { useTimerStore } from "@/lib/stores/timerStore";

async function loadTrackFromDatabase() {
  const db = await getDatabase();

  return await db.getAllAsync<{
    timestamp: number;
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
  }>(
    "SELECT timestamp, latitude, longitude, altitude, accuracy FROM gps_points ORDER BY timestamp ASC"
  );
}

export default function useSaveActivitySession({
  title,
  notes,
  setIsSaving,
  resetSession,
  meters,
}: {
  title: string;
  notes: string;
  setIsSaving: (isSaving: boolean) => void;
  resetSession: () => void;
  meters: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { startTimestamp, isRunning, remainingMs } = useTimerStore();
  const { stopGPStracking } = useStopGPStracking();

  const handleSaveSession = async () => {
    if (title.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Title is required.",
      });
      return;
    }

    if (meters <= 50) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "You need to track at least 50 meters to save the session.",
      });
      return;
    }

    const confirmSave = await confirmAction({
      title: "Confirm Finish Session",
      message: "Are you sure you want to finish this session?",
    });

    if (!confirmSave) return;

    try {
      setIsSaving(true);

      // stop the GPS tracking
      await stopGPStracking();

      const track = await loadTrackFromDatabase();

      const durationInSeconds =
        isRunning && startTimestamp
          ? Math.floor((Date.now() - startTimestamp) / 1000)
          : Math.floor((remainingMs ?? 0) / 1000);

      const end_time = new Date().toISOString();

      const draft = await AsyncStorage.getItem("activity_draft");

      const start_time = draft
        ? JSON.parse(draft).start_time
        : new Date().toISOString();

      const activityId = draft ? JSON.parse(draft).activityId : null;

      await saveActivitySession({
        title,
        notes,
        duration: durationInSeconds,
        start_time,
        end_time,
        track,
        activityId,
      });

      await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });

      await clearLocalSessionDatabase();

      resetSession();
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving activity session", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save session. Please try again.",
      });
      setIsSaving(false);
    }
  };
  return {
    handleSaveSession,
  };
}
