import { useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { deleteSavedMeal } from "@/database/nutrition/delete-saved-meal";

export function useDeleteSavedMeal() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(["nutrition", "common"]);

  const mutation = useMutation({
    mutationFn: (mealId: string) => deleteSavedMeal(mealId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["savedMeals"] });

      Toast.show({
        type: "success",
        text1: t("common:common.success"),
        text2: t("nutrition:savedMeals.mealDeleted"),
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

  return { handleDeleteMeal: mutation.mutate, isDeleting: mutation.isPending };
}
