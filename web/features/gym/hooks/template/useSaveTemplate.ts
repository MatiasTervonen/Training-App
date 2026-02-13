"use client";

import { editTemplate } from "@/database/gym/templates/edit-template";
import { saveTemplate } from "@/database/gym/templates/save-template";
import { ExerciseEntry } from "@/types/session";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FullGymTemplate } from "@/database/gym/templates/full-gym-template";

export default function useSaveTemplate({
  workoutName,
  exercises,
  isEditing,
  setIsSaving,
  resetSession,
  template,
}: {
  workoutName: string;
  exercises: ExerciseEntry[];
  isEditing: boolean;
  setIsSaving: (isSaving: boolean) => void;
  resetSession: () => void;
  template: FullGymTemplate;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSaveTemplate = async () => {
    if (workoutName.trim() === "" || exercises.length === 0) return;

    setIsSaving(true);

    try {
      if (isEditing) {
        await editTemplate({
          id: template.id,
          exercises,
          name: workoutName,
        });
      } else {
        await saveTemplate({
          exercises,
          name: workoutName,
        });
      }

      if (isEditing) {
        Promise.all([
          queryClient.refetchQueries({
            queryKey: ["fullTemplate", template.id],
            exact: true,
          }),
          queryClient.refetchQueries({
            queryKey: ["templates"],
            exact: true,
          }),
        ]);
      } else {
        await queryClient.refetchQueries({
          queryKey: ["templates"],
          exact: true,
        });
      }
      resetSession();
      router.push("/gym/templates");
    } catch {
      toast.error("Failed to save template. Try again later.");
      setIsSaving(false);
    }
  };
  return {
    handleSaveTemplate,
  };
}
