import { useConfirmAction } from "@/lib/confirmAction";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { saveActivitySession } from "@/database/activities/save-session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStopGPStracking } from "@/features/activities/lib/location-actions";
import { useQueryClient } from "@tanstack/react-query";
import { getDatabase } from "@/database/local-database/database";
import { useTimerStore } from "@/lib/stores/timerStore";
import { readRecords, initialize } from "react-native-health-connect";
import { handleError } from "@/utils/handleError";
import { filterTrackBeforeSaving } from "../lib/filterTrackBeforeSaving";
import { useTranslation } from "react-i18next";

async function loadTrackFromDatabase() {
  const db = await getDatabase();

  return await db.getAllAsync<{
    timestamp: number;
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    is_stationary: number;
    bad_signal: number;
  }>(
    "SELECT timestamp, latitude, longitude, altitude, accuracy, is_stationary, bad_signal FROM gps_points ORDER BY timestamp ASC",
  );
}

async function loadStepsFromHealthConnect(
  start_time: string,
  end_time: string,
): Promise<number> {
  try {
    // Ensure Health Connect is initialized before reading
    const initialized = await initialize();
    if (!initialized) {
      console.warn("Health Connect not initialized, returning 0 steps");
      return 0;
    }

    const steps = await readRecords("Steps", {
      timeRangeFilter: {
        operator: "between",
        startTime: start_time,
        endTime: end_time,
      },
    });

    const totalSteps = steps.records.reduce(
      (acc, record) => acc + record.count,
      0,
    );

    return totalSteps;
  } catch (error) {
    handleError(error, {
      message: "Error loading steps from Health Connect",
      route: "/Features/activities/hooks/useSaveSession",
      method: "loadStepsFromHealthConnect",
    });
    // Return 0 steps as fallback instead of crashing
    return 0;
  }
}

export default function useSaveActivitySession({
  title,
  notes,
  meters,
  setIsSaving,
  resetSession,
}: {
  title: string;
  notes: string;
  meters: number;
  setIsSaving: (isSaving: boolean) => void;
  resetSession: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { stopGPStracking } = useStopGPStracking();
  const { t } = useTranslation("activities");
  const confirmAction = useConfirmAction();

  const handleSaveSession = async () => {
    // Get timer state only when saving, not on every render
    const { startTimestamp, isRunning, remainingMs, activeSession } =
      useTimerStore.getState();

    if (title.trim() === "") {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("activities.saveSession.titleRequired"),
      });
      return;
    }

    const allowGPS = activeSession?.gpsAllowed ?? false;
    const stepsAllowed = activeSession?.stepsAllowed ?? false;

    if (allowGPS && meters <= 50) {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("activities.saveSession.minDistanceError"),
      });
      return;
    }

    const confirmSave = await confirmAction({
      title: t("activities.saveSession.confirmTitle"),
      message: t("activities.saveSession.confirmMessage"),
    });

    if (!confirmSave) return;

    try {
      setIsSaving(true);

      // stop the GPS tracking
      if (allowGPS) {
        await stopGPStracking();

        // Wait briefly to ensure any pending database writes complete
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const rawTrack = allowGPS ? await loadTrackFromDatabase() : [];

      const cleanTrack = allowGPS ? filterTrackBeforeSaving(rawTrack) : [];

      const durationInSeconds =
        isRunning && startTimestamp
          ? Math.floor((Date.now() - startTimestamp) / 1000)
          : Math.floor((remainingMs ?? 0) / 1000);

      const end_time = new Date().toISOString();

      const draft = await AsyncStorage.getItem("activity_draft");
      const parsedDraft = draft ? JSON.parse(draft) : null;

      const start_time = new Date(
        activeSession?.started_at ?? Date.now(),
      ).toISOString();

      const activityId = parsedDraft?.activityId ?? null;

      const steps = stepsAllowed
        ? await loadStepsFromHealthConnect(start_time, end_time)
        : 0;

      await saveActivitySession({
        title,
        notes,
        duration: durationInSeconds,
        start_time,
        end_time,
        track: cleanTrack,
        activityId,
        steps: steps ?? 0,
      });

      await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });

      resetSession();
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving activity session", error);
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("activities.saveSession.saveError"),
      });
      setIsSaving(false);
    }
  };
  return {
    handleSaveSession,
  };
}
