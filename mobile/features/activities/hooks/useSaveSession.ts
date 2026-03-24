import { useConfirmAction } from "@/lib/confirmAction";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { saveActivitySessionWithoutMedia } from "@/database/activities/save-session";
import { getFullActivitySession } from "@/database/activities/get-full-activity-session";
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
import {
  getMovementType,
  getStrideLength,
  getDistanceFromSteps,
} from "@/features/activities/lib/strideLength";
import { useUserStore } from "@/lib/stores/useUserStore";

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
  setSavingProgress,
  resetSession,
  activityName = null,
}: {
  title: string;
  notes: string;
  meters: number;
  draftRecordings: DraftRecording[];
  draftImages?: DraftImage[];
  draftVideos?: DraftVideo[];
  setIsSaving: (isSaving: boolean) => void;
  setSavingProgress?: (progress: number | undefined) => void;
  resetSession: () => void;
  activityName?: string | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { stopGPStracking } = useStopGPStracking();
  const { t } = useTranslation("activities");
  const confirmAction = useConfirmAction();

  const handleSaveSession = async () => {
    if (draftVideos.some((v) => v.isCompressing)) {
      Toast.show({ type: "info", text1: t("common:common.media.videoStillCompressing") });
      return;
    }

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
      setSavingProgress?.(undefined);

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
      const templateId = parsedDraft?.templateId ?? null;
      const activitySlug = parsedDraft?.activitySlug ?? null;

      const steps = stepsAllowed ? await loadStepsFromNative() : 0;

      // Compute step-based distance for non-GPS sessions
      let stepDistanceMeters: number | null = null;
      if (!allowGPS && stepsAllowed && steps > 0) {
        const heightCm = useUserStore.getState().profile?.height_cm ?? null;
        const movementType = getMovementType(activitySlug);
        const stride = getStrideLength(heightCm, movementType);
        stepDistanceMeters = getDistanceFromSteps(steps, stride);
      }

      const { sessionId, hasMedia } = await saveActivitySessionWithoutMedia({
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
        templateId,
        stepDistanceMeters,
      });

      // Fetch the real DB-computed stats for the share card
      const [fullSession] = await Promise.all([
        getFullActivitySession(sessionId),
        queryClient.invalidateQueries({ queryKey: ["feed"], exact: true }),
      ]);

      const stats = fullSession.stats;
      const hasRoute = fullSession.route !== null;

      useActivitySessionSummaryStore.getState().setSummary({
        title,
        date: start_time,
        duration: durationInSeconds,
        activityName,
        activitySlug,
        hasRoute,
        route: fullSession.route,
        distance: stats?.distance_meters ?? null,
        movingTime: stats?.moving_time_seconds ?? null,
        averagePace: stats?.avg_pace ?? null,
        averageSpeed: stats?.avg_speed ?? null,
        steps: stats?.steps ?? null,
        calories: stats?.calories ?? null,
        isStepRelevant: fullSession.activity?.is_step_relevant ?? true,
        isCaloriesRelevant: fullSession.activity?.is_calories_relevant ?? true,
        sessionId,
      });

      resetSession();
      router.replace("/activities/activity-finished");

      if (hasMedia) {
        Toast.show({
          type: "info",
          text1: t("common:common.media.uploadingBackground"),
        });
      }
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
