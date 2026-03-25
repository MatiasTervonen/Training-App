import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { logFood } from "@/database/nutrition/log-food";

type LogFoodParams = {
  foodId?: string;
  customFoodId?: string;
  foodName: string;
  mealType: string;
  servingSizeG: number;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string;
  notes?: string;
};

export function useLogFood() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useTranslation(["nutrition", "common"]);

  const mutation = useMutation({
    mutationFn: (params: LogFoodParams) =>
      logFood({
        foodId: params.foodId,
        customFoodId: params.customFoodId,
        foodName: params.foodName,
        mealType: params.mealType,
        servingSizeG: params.servingSizeG,
        quantity: params.quantity,
        calories: params.calories,
        protein: params.protein,
        carbs: params.carbs,
        fat: params.fat,
        loggedAt: params.loggedAt,
        notes: params.notes,
      }),
    onSuccess: (_data, params) => {
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["dailyLogs", params.loggedAt],
        }),
        queryClient.invalidateQueries({ queryKey: ["feed"] }),
        queryClient.invalidateQueries({ queryKey: ["recentFoods"] }),
      ]);

      router.push("/nutrition");
      toast.success(t("nutrition:toast.logged"));
    },
    onError: () => {
      toast.error(t("nutrition:toast.error"));
    },
  });

  const handleLogFood = async (params: LogFoodParams) => {
    if (!params.foodName.trim() || params.servingSizeG <= 0) {
      toast.error(t("nutrition:toast.error"));
      return;
    }

    await mutation.mutateAsync(params);
  };

  return { handleLogFood, isLogging: mutation.isPending };
}
