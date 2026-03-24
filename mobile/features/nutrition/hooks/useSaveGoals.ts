import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { saveNutritionGoals } from "@/database/nutrition/save-nutrition-goals";

type NutritionGoalsInput = {
  calorieGoal: number;
  proteinGoal: number | null;
  carbsGoal: number | null;
  fatGoal: number | null;
  customMealTypes: string[];
};

export function useSaveGoals() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(["nutrition", "common"]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (goals: NutritionGoalsInput) => {
    setIsSaving(true);

    try {
      await saveNutritionGoals(goals);

      await queryClient.invalidateQueries({ queryKey: ["nutritionGoals"] });

      Toast.show({
        type: "success",
        text1: t("common:common.success"),
        text2: t("nutrition:goals.saved"),
      });
    } catch {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("nutrition:toast.error"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return { handleSave, isSaving };
}
