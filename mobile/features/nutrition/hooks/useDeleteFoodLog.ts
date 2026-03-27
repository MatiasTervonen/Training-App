import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { deleteFoodLog } from "@/database/nutrition/delete-food-log";

export function useDeleteFoodLog() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(["nutrition", "common"]);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (logId: string, loggedAt: string) => {
    setIsDeleting(true);

    try {
      await deleteFoodLog(logId, loggedAt);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["dailyLogs", loggedAt],
        }),
        queryClient.invalidateQueries({ queryKey: ["feed"] }),
        queryClient.invalidateQueries({ queryKey: ["energyBalance", loggedAt] }),
      ]);

      Toast.show({
        type: "success",
        text1: t("common:common.success"),
        text2: t("nutrition:toast.deleted"),
      });
    } catch {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("nutrition:toast.error"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return { handleDelete, isDeleting };
}
