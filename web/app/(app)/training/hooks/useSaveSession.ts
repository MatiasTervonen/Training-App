"use client";

import { toast } from "react-hot-toast";
import { editGymSession, saveGymToDB } from "@/app/(app)/database/gym";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ExerciseEntry } from "../../types/session";
import { full_gym_session } from "../../types/models";

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
  const router = useRouter();
  const queryClient = useQueryClient();

  const saveSession = async () => {
    if (sessionTitle.trim() === "") {
      toast.error("Please enter a session title before saving.");
      return;
    }

    const confirmSave = confirm(
      "Are you sure you want to finish this session?"
    );

    if (!confirmSave) return;
    if (exercises.length === 0 && notes.trim() === "") return;

    setIsSaving(true);

    const duration = elapsedTime;

    try {
      if (isEditing) {
        await editGymSession({
          title: sessionTitle,
          notes,
          durationEdit,
          exercises,
          id: session.id,
        });
      } else {
        await saveGymToDB({
          title: sessionTitle,
          notes,
          duration,
          exercises,
        });
      }

      await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });
      if (isEditing) {
        router.push("/dashboard");
      } else {
        router.push("/training/training-finished"); // Redirect to the finished page
      }
      resetSession(); // Clear the session data
    } catch {
      toast.error("Failed to save gym session. Please try again.");
      setIsSaving(false);
    }
  };

  return {
    saveSession,
  };
}
