import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { saveCustomFood } from "@/database/nutrition/save-custom-food";

type CustomFoodInput = {
  name: string;
  brand: string | null;
  servingSizeG: number;
  servingDescription: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
  sugarPer100g: number | null;
  sodiumPer100g: number | null;
  saturatedFatPer100g: number | null;
};

export function useSaveCustomFood() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(["nutrition", "common"]);

  const mutation = useMutation({
    mutationFn: (food: CustomFoodInput) => saveCustomFood(food),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customFoods"] });
      toast.success(t("nutrition:custom.saved"));
    },
    onError: () => {
      toast.error(t("nutrition:toast.error"));
    },
  });

  const handleSave = async (food: CustomFoodInput): Promise<boolean> => {
    if (!food.name.trim()) {
      toast.error(t("nutrition:custom.missingName"));
      return false;
    }

    try {
      await mutation.mutateAsync(food);
      return true;
    } catch {
      return false;
    }
  };

  return { handleSave, isSaving: mutation.isPending };
}
