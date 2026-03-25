import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { logSavedMeal } from "@/database/nutrition/log-saved-meal";

type LogSavedMealParams = {
  savedMealId: string;
  mealType: string;
  loggedAt: string;
};

export function useLogSavedMeal() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useTranslation(["nutrition", "common"]);
  const [isLogging, setIsLogging] = useState(false);

  const handleLogMeal = async (params: LogSavedMealParams) => {
    setIsLogging(true);

    try {
      await logSavedMeal(params);

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
        text2: t("nutrition:savedMeals.mealLogged"),
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

  return { handleLogMeal, isLogging };
}
