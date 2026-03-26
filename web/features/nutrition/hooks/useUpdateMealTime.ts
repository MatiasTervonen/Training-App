"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
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
      toast.error(t("nutrition:toast.error"));
    },
  });

  return { updateMealTime: mutation.mutateAsync, isUpdating: mutation.isPending };
}
