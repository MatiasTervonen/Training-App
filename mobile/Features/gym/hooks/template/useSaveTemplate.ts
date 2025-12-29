import { editTemplate } from "@/database/gym/edit-template";
import { saveTemplate } from "@/database/gym/save-template";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { ExerciseEntry } from "@/types/session";

export default function useSaveTemplate({
  workoutName,
  exercises,
  setIsSaving,
  resetSession,
  templateId,
}: {
  workoutName: string;
  exercises: ExerciseEntry[];
  setIsSaving: (isSaving: boolean) => void;
  resetSession: () => void;
  templateId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSaveTemplate = async () => {
    if (workoutName.trim() === "" || exercises.length === 0) return;

    setIsSaving(true);

    const simplified = exercises.map((ex, index) => ({
      template_id: templateId,
      exercise_id: ex.exercise_id,
      position: index,
      superset_id: ex.superset_id,
    }));

    const updated = new Date().toISOString();

    try {
      if (templateId) {
        await editTemplate({
          id: templateId,
          exercises: simplified,
          name: workoutName,
          updated_at: updated,
        });
      } else {
        await saveTemplate({
          exercises: simplified,
          name: workoutName,
        });
      }

      if (templateId) {
        await queryClient.refetchQueries({
          queryKey: ["full_gym_template", templateId],
          exact: true,
        });
      } else {
        await queryClient.refetchQueries({
          queryKey: ["get-templates"],
          exact: true,
        });
      }

      router.push("/training/templates");
      resetSession();
      Toast.show({
        type: "success",
        text1: "Template saved",
        text2: "Template has been saved successfully.",
      });
    } catch (error) {
      console.log("error saving template", error);
      setIsSaving(false);
      Toast.show({
        type: "error",
        text1: "Error saving template",
        text2: "Please try again later.",
      });
    }
  };
  return {
    handleSaveTemplate,
  };
}
