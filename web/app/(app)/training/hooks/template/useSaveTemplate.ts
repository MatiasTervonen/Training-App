"use client";

import { editTemplate } from "@/app/(app)/database/template";
import { saveTemplateToDB } from "@/app/(app)/database/template";
import { ExerciseEntry } from "@/app/(app)/types/session";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { full_gym_template } from "@/app/(app)/types/models";

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
  template: full_gym_template;
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
        await saveTemplateToDB({
          exercises,
          name: workoutName,
        });
      }

      if (isEditing) {
        await queryClient.refetchQueries({
          queryKey: ["fullTemplate", template.id],
          exact: true,
        });
      } else {
        await queryClient.refetchQueries({
          queryKey: ["templates"],
          exact: true,
        });
      }
      resetSession();
      router.push("/training/templates");
    } catch {
      toast.error("Failed to save template. Try again later.");
      setIsSaving(false);
    }
  };
  return {
    handleSaveTemplate,
  };
}
