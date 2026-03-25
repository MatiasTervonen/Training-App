import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { deleteFoodLog } from "@/database/nutrition/delete-food-log";

export function useDeleteFoodLog() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(["nutrition", "common"]);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (logId: string, loggedAt: string) => {
    setIsDeleting(true);

    try {
      await deleteFoodLog({ logId, loggedAt });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["dailyLogs", loggedAt],
        }),
        queryClient.invalidateQueries({ queryKey: ["feed"] }),
      ]);

      toast.success(t("nutrition:toast.deleted"));
    } catch {
      toast.error(t("nutrition:toast.error"));
    } finally {
      setIsDeleting(false);
    }
  };

  return { handleDelete, isDeleting };
}
