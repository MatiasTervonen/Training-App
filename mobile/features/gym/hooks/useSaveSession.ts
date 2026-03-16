import { Toast } from "react-native-toast-message/lib/src/Toast";
import { useConfirmAction } from "@/lib/confirmAction";
import { DraftVideo, ExerciseEntry, FeedData, PhaseData } from "@/types/session";
import { editSession } from "@/database/gym/edit-session";
import { saveSession } from "@/database/gym/save-session";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useRestTimerStore } from "@/lib/stores/restTimerStore";
import { useSessionSummaryStore } from "@/lib/stores/sessionSummaryStore";
import { useUserStore } from "@/lib/stores/useUserStore";
import { useTranslation } from "react-i18next";

type DraftRecording = {
  id: string;
  uri: string;
  createdAt: number;
  durationMs?: number;
};

type DraftImage = {
  id: string;
  uri: string;
};

export default function useSaveSession({
  title,
  exercises,
  notes,
  durationEdit,
  isEditing,
  setIsSaving,
  setSavingProgress,
  resetSession,
  session,
  draftImages = [],
  draftRecordings = [],
  draftVideos = [],
  deletedImageIds = [],
  deletedImagePaths = [],
  deletedVideoIds = [],
  deletedVideoPaths = [],
  deletedRecordingIds = [],
  deletedRecordingPaths = [],
  warmup,
  cooldown,
}: {
  title: string;
  exercises: ExerciseEntry[];
  notes: string;
  durationEdit: number;
  isEditing: boolean;
  setIsSaving: (isSaving: boolean) => void;
  setSavingProgress?: (progress: number | undefined) => void;
  resetSession: () => void;
  session: { id: string };
  draftImages?: DraftImage[];
  draftRecordings?: DraftRecording[];
  draftVideos?: DraftVideo[];
  deletedImageIds?: string[];
  deletedImagePaths?: string[];
  deletedVideoIds?: string[];
  deletedVideoPaths?: string[];
  deletedRecordingIds?: string[];
  deletedRecordingPaths?: string[];
  warmup?: PhaseData | null;
  cooldown?: PhaseData | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation("gym");
  const confirmAction = useConfirmAction();

  const handleSaveSession = async () => {
    if (draftVideos.some((v) => v.isCompressing)) {
      Toast.show({ type: "info", text1: t("common:common.media.videoStillCompressing") });
      return;
    }

    if (warmup?.is_tracking || cooldown?.is_tracking) {
      Toast.show({
        type: "error",
        text1: t("gym.saveSession.phaseStillRunningTitle"),
        text2: t("gym.saveSession.phaseStillRunningSub"),
      });
      return;
    }

    if (title.trim() === "") {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("gym.saveSession.titleRequired"),
      });
      return;
    }

    const confirmSave = await confirmAction({
      title: t("gym.saveSession.confirmTitle"),
      message: t("gym.saveSession.confirmMessage"),
    });

    if (!confirmSave) return;

    const hasPhases = (warmup && warmup.duration_seconds > 0) || (cooldown && cooldown.duration_seconds > 0);
    if (exercises.length === 0 && notes.trim() === "" && !hasPhases) return;

    setIsSaving(true);
    setSavingProgress?.(undefined);

    // Get timer state only when saving, not on every render
    const { startTimestamp, isRunning, remainingMs } = useTimerStore.getState();

    const durationInSeconds =
      isRunning && startTimestamp
        ? Math.floor((Date.now() - startTimestamp) / 1000)
        : Math.floor((remainingMs ?? 0) / 1000);

    // Build phases array from warmup/cooldown state
    const phases: {
      phase_type: string;
      activity_id: string;
      duration_seconds: number;
      steps: number | null;
      distance_meters: number | null;
      is_manual: boolean;
    }[] = [];
    if (warmup && warmup.duration_seconds > 0) {
      phases.push({
        phase_type: "warmup",
        activity_id: warmup.activity_id,
        duration_seconds: warmup.duration_seconds,
        steps: warmup.steps,
        distance_meters: warmup.distance_meters,
        is_manual: warmup.is_manual,
      });
    }
    if (cooldown && cooldown.duration_seconds > 0) {
      phases.push({
        phase_type: "cooldown",
        activity_id: cooldown.activity_id,
        duration_seconds: cooldown.duration_seconds,
        steps: cooldown.steps,
        distance_meters: cooldown.distance_meters,
        is_manual: cooldown.is_manual,
      });
    }

    try {
      if (isEditing) {
        const updatedFeedItem = await editSession({
          id: session.id,
          title,
          notes,
          durationEdit,
          exercises,
          newImages: draftImages,
          newVideos: draftVideos,
          newRecordings: draftRecordings,
          deletedImageIds,
          deletedImagePaths,
          deletedVideoIds,
          deletedVideoPaths,
          deletedRecordingIds,
          deletedRecordingPaths,
          phases,
        });

        await Promise.all([
          queryClient.setQueryData<FeedData>(["feed"], (oldData) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                feed: page.feed.map((item) =>
                  item.id === updatedFeedItem.id
                    ? { ...item, ...updatedFeedItem }
                    : item,
                ),
              })),
            };
          }),
          queryClient.invalidateQueries({
            queryKey: ["fullGymSession", session.id],
            exact: true,
          }),
        ]);

        router.push("/dashboard");
      } else {
        const { sessionId } = await saveSession({
          title,
          notes,
          duration: durationInSeconds,
          exercises,
          draftImages,
          draftRecordings,
          draftVideos,
          onProgress: (p) => setSavingProgress?.(p),
          phases,
        });

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["feed"], exact: true }),
          queryClient.invalidateQueries({
            queryKey: ["myGymSessions"],
            exact: true,
          }),
        ]);

        const weightUnit =
          useUserStore.getState().profile?.weight_unit ?? "kg";
        useSessionSummaryStore.getState().setSummary({
          title,
          date: new Date().toISOString(),
          duration: durationInSeconds,
          exercises,
          notes,
          weightUnit,
          phases,
          sessionId,
        });
        router.push("/gym/training-finished");
      }

      useRestTimerStore.getState().clearRestTimer();
      resetSession();
    } catch {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("gym.saveSession.saveError"),
      });
      setIsSaving(false);
    }
  };
  return {
    handleSaveSession,
  };
}
