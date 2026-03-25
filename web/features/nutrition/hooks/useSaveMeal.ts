import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { saveMeal } from "@/database/nutrition/save-meal";

type SaveMealParams = Parameters<typeof saveMeal>[0];

export function useSaveMeal() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(["nutrition", "common"]);

  const mutation = useMutation({
    mutationFn: (params: SaveMealParams) => saveMeal(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedMeals"] });
      toast.success(t("nutrition:savedMeals.mealSaved"));
    },
    onError: () => {
      toast.error(t("nutrition:toast.error"));
    },
  });

  const handleSaveMeal = async (params: SaveMealParams) => {
    await mutation.mutateAsync(params);
  };

  return { handleSaveMeal, isSaving: mutation.isPending };
}
