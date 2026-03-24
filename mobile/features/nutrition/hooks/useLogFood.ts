import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { logFood } from "@/database/nutrition/log-food";

type LogFoodParams = {
  foodId: string | null;
  customFoodId: string | null;
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
  const [isLogging, setIsLogging] = useState(false);

  const handleLogFood = async (params: LogFoodParams) => {
    if (!params.foodName.trim() || params.servingSizeG <= 0) {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("nutrition:toast.error"),
      });
      return;
    }

    setIsLogging(true);

    try {
      await logFood({
        foodId: params.foodId ?? undefined,
        customFoodId: params.customFoodId ?? undefined,
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
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["dailyLogs", params.loggedAt],
        }),
        queryClient.invalidateQueries({ queryKey: ["feed"] }),
        queryClient.invalidateQueries({ queryKey: ["recentFoods"] }),
      ]);

      router.back();
      Toast.show({
        type: "success",
        text1: t("common:common.success"),
        text2: t("nutrition:toast.logged"),
      });
    } catch {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("nutrition:toast.error"),
      });
    } finally {
      setIsLogging(false);
    }
  };

  return { handleLogFood, isLogging };
}
