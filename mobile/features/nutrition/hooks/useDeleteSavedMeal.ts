import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { deleteSavedMeal } from "@/database/nutrition/delete-saved-meal";

export function useDeleteSavedMeal() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(["nutrition", "common"]);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteMeal = async (mealId: string) => {
    setIsDeleting(true);

    try {
      await deleteSavedMeal(mealId);

      await queryClient.invalidateQueries({ queryKey: ["savedMeals"] });

      Toast.show({
        type: "success",
        text1: t("common:common.success"),
        text2: t("nutrition:savedMeals.mealDeleted"),
      });
    } catch {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("nutrition:toast.error"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return { handleDeleteMeal, isDeleting };
}
