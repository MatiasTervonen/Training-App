import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { saveMeal } from "@/database/nutrition/save-meal";

type SaveMealItem = {
  food_id: string | null;
  custom_food_id: string | null;
  serving_size_g: number;
  quantity: number;
  sort_order: number;
};

type SaveMealParams = {
  mealId?: string;
  name: string;
  items: SaveMealItem[];
};

export function useSaveMeal() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(["nutrition", "common"]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveMeal = async (params: SaveMealParams) => {
    setIsSaving(true);

    try {
      await saveMeal(params);

      await queryClient.invalidateQueries({ queryKey: ["savedMeals"] });

      Toast.show({
        type: "success",
        text1: t("common:common.success"),
        text2: t("nutrition:savedMeals.mealSaved"),
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

  return { handleSaveMeal, isSaving };
}
