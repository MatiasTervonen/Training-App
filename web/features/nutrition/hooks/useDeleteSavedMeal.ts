import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { deleteSavedMeal } from "@/database/nutrition/delete-saved-meal";

export function useDeleteSavedMeal() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(["nutrition", "common"]);

  const mutation = useMutation({
    mutationFn: (mealId: string) => deleteSavedMeal(mealId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["savedMeals"] });
      toast.success(t("nutrition:savedMeals.mealDeleted"));
    },
    onError: () => {
      toast.error(t("nutrition:toast.error"));
    },
  });

  return { handleDeleteMeal: mutation.mutate, isDeleting: mutation.isPending };
}
