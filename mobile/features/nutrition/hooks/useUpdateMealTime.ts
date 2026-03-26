import { useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { updateMealTime } from "@/database/nutrition/update-meal-time";

type UpdateMealTimeParams = {
  loggedAt: string;
  mealType: string;
  mealTime: string;
};

export function useUpdateMealTime() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(["nutrition", "common"]);

  const mutation = useMutation({
    mutationFn: (params: UpdateMealTimeParams) => updateMealTime(params),
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({
        queryKey: ["dailyLogs", params.loggedAt],
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

  return { updateMealTime: mutation.mutateAsync, isUpdating: mutation.isPending };
}
