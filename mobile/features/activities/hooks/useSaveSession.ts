import { useConfirmAction } from "@/lib/confirmAction";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { saveActivitySession } from "@/database/activities/save-session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStopGPStracking } from "@/features/activities/lib/location-actions";
import { useQueryClient } from "@tanstack/react-query";
import { getDatabase } from "@/database/local-database/database";
import { useTimerStore } from "@/lib/stores/timerStore";
import { handleError } from "@/utils/handleError";
import { getSessionSteps } from "@/native/android/NativeStepCounter";
import { filterTrackBeforeSaving } from "../lib/filterTrackBeforeSaving";
import { useTranslation } from "react-i18next";
import { DraftRecording, DraftVideo } from "@/types/session";
import { useActivitySessionSummaryStore } from "@/lib/stores/activitySessionSummaryStore";

type DraftImage = {
  id: string;
  uri: string;
};

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

async function loadStepsFromNative(): Promise<number> {
  try {
    return await getSessionSteps();
  } catch (error) {
    handleError(error, {
      message: "Error loading steps from native step counter",
      route: "/Features/activities/hooks/useSaveSession",
      method: "loadStepsFromNative",
    });
    return 0;
  }
}

export default function useSaveActivitySession({
  title,
  notes,
  meters,
  draftRecordings,
  draftImages = [],
  draftVideos = [],
  setIsSaving,
  resetSession,
  activityName = null,
  baseMet = 0,
  userWeight = 70,
  movingTimeSeconds = null,
  averagePacePerKm = null,
  averageSpeed = null,
}: {
  title: string;
  notes: string;
  meters: number;
  draftRecordings: DraftRecording[];
  draftImages?: DraftImage[];
  draftVideos?: DraftVideo[];
  setIsSaving: (isSaving: boolean) => void;
  resetSession: () => void;
  activityName?: string | null;
  baseMet?: number;
  userWeight?: number;
  movingTimeSeconds?: number | null;
  averagePacePerKm?: number | null;
  averageSpeed?: number | null;
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

      const steps = stepsAllowed ? await loadStepsFromNative() : 0;

      await saveActivitySession({
        title,
        notes,
        duration: durationInSeconds,
        start_time,
        end_time,
        track: cleanTrack,
        activityId,
        steps: steps ?? 0,
        draftRecordings,
        draftImages,
        draftVideos,
      });

      await queryClient.invalidateQueries({ queryKey: ["feed"], exact: true });

      // Populate activity session summary for share card
      const hasRoute = allowGPS && cleanTrack.length > 0;
      let route = null;
      if (hasRoute) {
        const coords = cleanTrack.map(
          (p) => [p.longitude, p.latitude] as [number, number],
        );
        route = { type: "LineString" as const, coordinates: coords };
      }
      const calories =
        baseMet && userWeight
          ? Math.round(baseMet * userWeight * (durationInSeconds / 3600))
          : null;

      const avgSpeed =
        hasRoute && meters > 0 && (movingTimeSeconds ?? 0) > 0
          ? Number(
              ((meters / 1000) / ((movingTimeSeconds ?? 0) / 3600)).toFixed(1),
            )
          : null;

      useActivitySessionSummaryStore.getState().setSummary({
        title,
        date: start_time,
        duration: durationInSeconds,
        activityName,
        hasRoute,
        route,
        distance: hasRoute ? meters : null,
        movingTime: hasRoute ? (movingTimeSeconds ?? null) : null,
        averagePace: hasRoute ? (averagePacePerKm ?? null) : null,
        averageSpeed: averageSpeed ?? avgSpeed,
        steps: steps > 0 ? steps : null,
        calories,
      });

      resetSession();
      router.push("/activities/activity-finished");
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
