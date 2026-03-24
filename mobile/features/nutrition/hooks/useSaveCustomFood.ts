import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { saveCustomFood } from "@/database/nutrition/save-custom-food";

type CustomFoodInput = {
  name: string;
  brand: string | null;
  servingSizeG: number;
  servingDescription: string | null;
  caloriesPer100g: number;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  fiberPer100g: number | null;
  sugarPer100g: number | null;
  sodiumPer100g: number | null;
  saturatedFatPer100g: number | null;
};

export function useSaveCustomFood() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(["nutrition", "common"]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (food: CustomFoodInput): Promise<boolean> => {
    if (!food.name.trim()) {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("nutrition:custom.missingName"),
      });
      return false;
    }

    setIsSaving(true);

    try {
      await saveCustomFood(food);

      await queryClient.invalidateQueries({ queryKey: ["customFoods"] });

      Toast.show({
        type: "success",
        text1: t("common:common.success"),
        text2: t("nutrition:custom.saved"),
      });
      return true;
    } catch {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("nutrition:toast.error"),
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { handleSave, isSaving };
}
