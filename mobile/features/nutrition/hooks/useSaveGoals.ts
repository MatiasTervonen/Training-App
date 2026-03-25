import { useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
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

      Toast.show({
        type: "success",
        text1: t("common:common.success"),
        text2: t("nutrition:goals.saved"),
      });
    },
    onError: () => {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("nutrition:toast.error"),
      });
    },
  });

  const handleSave = async (goals: NutritionGoalsInput) => {
    await mutation.mutateAsync(goals);
  };

  return { handleSave, isSaving: mutation.isPending };
}
