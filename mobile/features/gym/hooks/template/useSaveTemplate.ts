import { editTemplate } from "@/database/gym/edit-template";
import { saveTemplate } from "@/database/gym/save-template";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { ExerciseEntry, TemplatePhaseData } from "@/types/session";
import { useTranslation } from "react-i18next";

export default function useSaveTemplate({
  workoutName,
  exercises,
  setIsSaving,
  resetSession,
  templateId,
  warmup,
  cooldown,
}: {
  workoutName: string;
  exercises: ExerciseEntry[];
  setIsSaving: (isSaving: boolean) => void;
  resetSession: () => void;
  templateId: string;
  warmup?: TemplatePhaseData | null;
  cooldown?: TemplatePhaseData | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation("gym");

  const handleSaveTemplate = async () => {
    if (workoutName.trim() === "" || exercises.length === 0) return;

    setIsSaving(true);

    const simplified = exercises.map((ex, index) => ({
      template_id: templateId,
      exercise_id: ex.exercise_id,
      position: index,
      superset_id: ex.superset_id ?? undefined,
    }));

    const phases: { phase_type: string; activity_id: string }[] = [];
    if (warmup) {
      phases.push({ phase_type: "warmup", activity_id: warmup.activity_id });
    }
    if (cooldown) {
      phases.push({
        phase_type: "cooldown",
        activity_id: cooldown.activity_id,
      });
    }

    try {
      if (templateId) {
        await editTemplate({
          id: templateId,
          exercises: simplified,
          name: workoutName,
          phases,
        });
      } else {
        await saveTemplate({
          exercises: simplified,
          name: workoutName,
          phases,
        });
      }

      if (templateId) {
        await queryClient.invalidateQueries({
          queryKey: ["full_gym_template", templateId],
          exact: true,
        });
      } else {
        await queryClient.invalidateQueries({
          queryKey: ["get-templates"],
          exact: true,
        });
      }

      router.push("/gym/templates");
      resetSession();
      Toast.show({
        type: "success",
        text1: t("gym.templateForm.saveSuccess"),
        text2: t("gym.templateForm.saveSuccessSub"),
      });
    } catch {
      setIsSaving(false);
      Toast.show({
        type: "error",
        text1: t("gym.templateForm.saveError"),
        text2: t("gym.templateForm.saveErrorSub"),
      });
    }
  };
  return {
    handleSaveTemplate,
  };
}
