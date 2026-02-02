"use client";

import { toast } from "react-hot-toast";
import { editSession } from "@/app/(app)/database/gym/edit-session";
import { saveSession } from "@/app/(app)/database/gym/save-session";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ExerciseEntry } from "@/app/(app)/types/session";
import { full_gym_session } from "@/app/(app)/types/models";
import { FeedData } from "@/app/(app)/types/session";
import { useTranslation } from "react-i18next";

export default function useSaveSession({
  sessionTitle,
  exercises,
  notes,
  durationEdit,
  isEditing,
  elapsedTime,
  setIsSaving,
  resetSession,
  session,
}: {
  sessionTitle: string;
  exercises: ExerciseEntry[];
  notes: string;
  durationEdit: number;
  isEditing: boolean;
  elapsedTime: number;
  setIsSaving: (isSaving: boolean) => void;
  resetSession: () => void;
  session: full_gym_session;
}) {
  const { t } = useTranslation("gym");
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSaveSession = async () => {
    if (sessionTitle.trim() === "") {
      toast.error(t("gym.saveSession.titleRequired"));
      return;
    }

    const confirmSave = confirm(t("gym.saveSession.confirmMessage"));

    if (!confirmSave) return;
    if (exercises.length === 0 && notes.trim() === "") return;

    setIsSaving(true);

    const duration = elapsedTime;

    try {
      if (isEditing) {
        const updatedFeedItem = await editSession({
          title: sessionTitle,
          notes,
          durationEdit,
          exercises,
          id: session.id,
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
                    : item
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
          title: sessionTitle,
          notes,
          duration,
          exercises,
        });

        await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });
      }

      if (isEditing) {
        router.push("/dashboard");
      } else {
        router.push("/gym/training-finished"); // Redirect to the finished page
      }
      resetSession(); // Clear the session data
    } catch {
      toast.error(t("gym.saveSession.saveError"));
      setIsSaving(false);
    }
  };

  return {
    handleSaveSession,
  };
}
