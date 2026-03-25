import { useMutation, useQueryClient } from "@tanstack/react-query";
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

  const mutation = useMutation({
    mutationFn: (params: SaveMealParams) => saveMeal(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedMeals"] });

      Toast.show({
        type: "success",
        text1: t("common:common.success"),
        text2: t("nutrition:savedMeals.mealSaved"),
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

  const handleSaveMeal = async (params: SaveMealParams) => {
    await mutation.mutateAsync(params);
  };

  return { handleSaveMeal, isSaving: mutation.isPending };
}
