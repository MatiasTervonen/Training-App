import { Toast } from "react-native-toast-message/lib/src/Toast";
import { useConfirmAction } from "@/lib/confirmAction";
import { ExerciseEntry, FeedData } from "@/types/session";
import { editSession } from "@/database/gym/edit-session";
import { saveSession } from "@/database/gym/save-session";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useTranslation } from "react-i18next";

export default function useSaveSession({
  title,
  exercises,
  notes,
  durationEdit,
  isEditing,
  setIsSaving,
  resetSession,
  session,
}: {
  title: string;
  exercises: ExerciseEntry[];
  notes: string;
  durationEdit: number;
  isEditing: boolean;
  setIsSaving: (isSaving: boolean) => void;
  resetSession: () => void;
  session: { id: string };
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation("gym");
  const confirmAction = useConfirmAction();
  
  const handleSaveSession = async () => {
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
    if (exercises.length === 0 && notes.trim() === "") return;

    setIsSaving(true);

    // Get timer state only when saving, not on every render
    const { startTimestamp, isRunning, remainingMs } = useTimerStore.getState();

    const durationInSeconds =
      isRunning && startTimestamp
        ? Math.floor((Date.now() - startTimestamp) / 1000)
        : Math.floor((remainingMs ?? 0) / 1000);

    try {
      if (isEditing) {
        const updatedFeedItem = await editSession({
          id: session.id,
          title,
          notes,
          durationEdit,
          exercises,
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
          queryClient.refetchQueries({
            queryKey: ["fullGymSession", session.id],
            exact: true,
          }),
        ]);
      } else {
        await saveSession({
          title,
          notes,
          duration: durationInSeconds,
          exercises,
        });

        await Promise.all([
          queryClient.refetchQueries({ queryKey: ["feed"], exact: true }),
          queryClient.refetchQueries({
            queryKey: ["myGymSessions"],
            exact: true,
          }),
        ]);
      }

      if (isEditing) {
        router.push("/dashboard");
      } else {
        router.push("/gym/training-finished");
      }

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
