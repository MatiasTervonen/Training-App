import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { saveNutritionGoals } from "@/database/nutrition/save-nutrition-goals";

type NutritionGoalsInput = {
  calorieGoal: number;
  proteinGoal: number | null;
  carbsGoal: number | null;
  fatGoal: number | null;
  fiberGoal: number | null;
  sugarGoal: number | null;
  sodiumGoal: number | null;
  saturatedFatGoal: number | null;
  visibleNutrients: string[];
  customMealTypes: string[];
};

export function useSaveGoals() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(["nutrition", "common"]);

  const mutation = useMutation({
    mutationFn: (goals: NutritionGoalsInput) => saveNutritionGoals(goals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutritionGoals"] });
      toast.success(t("nutrition:goals.saved"));
    },
    onError: () => {
      toast.error(t("nutrition:toast.error"));
    },
  });

  const handleSave = async (goals: NutritionGoalsInput) => {
    await mutation.mutateAsync(goals);
  };

  return { handleSave, isSaving: mutation.isPending };
}
