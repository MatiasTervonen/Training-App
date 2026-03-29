import { savePlan } from "@/database/gym/plans/save-plan";
import { updatePlan } from "@/database/gym/plans/update-plan";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

type PlanDayExercise = {
  exercise_id: string;
  position: number;
  superset_id: string | null;
  rest_timer_seconds: number | null;
};

type PlanDay = {
  position: number;
  label: string | null;
  rest_timer_seconds: number | null;
  exercises: PlanDayExercise[];
};

type PlanTarget = {
  day_position: number;
  exercise_position: number;
  week_number: number;
  set_number: number;
  target_weight: number | null;
  target_reps: number | null;
  target_rpe: string | null;
  notes: string | null;
};

export default function useSavePlan({
  name,
  totalWeeks,
  days,
  targets,
  planId,
  setIsSaving,
  onSuccess,
}: {
  name: string;
  totalWeeks: number | null;
  days: PlanDay[];
  targets: PlanTarget[];
  planId?: string;
  setIsSaving: (saving: boolean) => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation("gym");

  const handleSavePlan = async () => {
    if (name.trim() === "" || days.length === 0) return;

    setIsSaving(true);

    try {
      if (planId) {
        await updatePlan({ planId, name, totalWeeks, days, targets });
      } else {
        await savePlan({ name, totalWeeks, days, targets });
      }

      await Promise.all([
        ...(planId ? [queryClient.invalidateQueries({ queryKey: ["full-training-plan", planId], exact: true })] : []),
        queryClient.invalidateQueries({ queryKey: ["training-plans"], exact: true }),
        queryClient.invalidateQueries({ queryKey: ["active-training-plan"], exact: true }),
      ]);

      onSuccess?.();
      router.push("/gym/plans" as any);
      Toast.show({
        type: "success",
        text1: t("gym.plans.saveSuccess"),
        text2: t("gym.plans.saveSuccessSub"),
      });
    } catch {
      setIsSaving(false);
      Toast.show({
        type: "error",
        text1: t("gym.plans.saveError"),
        text2: t("gym.plans.saveErrorSub"),
      });
    }
  };

  return { handleSavePlan };
}
