import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
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

  const mutation = useMutation({
    mutationFn: (params: LogSavedMealParams) =>
      logSavedMeal({
        ...params,
        mealTime: new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      }),
    onSuccess: async (_data, params) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["dailyLogs", params.loggedAt],
        }),
        queryClient.invalidateQueries({ queryKey: ["feed"] }),
        queryClient.invalidateQueries({ queryKey: ["recentFoods"] }),
      ]);

      router.push("/nutrition");
      toast.success(t("nutrition:savedMeals.mealLogged"));
    },
    onError: () => {
      toast.error(t("nutrition:toast.error"));
    },
  });

  return { handleLogMeal: mutation.mutateAsync, isLogging: mutation.isPending };
}
