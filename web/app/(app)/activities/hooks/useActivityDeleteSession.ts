"use client";

import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { deleteSession } from "@/app/(app)/database/feed/deleteSession";
import { FeedData } from "@/app/(app)/types/session";
import { useTranslation } from "react-i18next";

export default function useActivityDeleteSession() {
  const { t } = useTranslation("feed");
  const queryClient = useQueryClient();

  const handleDelete = async (id: string, type: string) => {
    const confirmDelete = confirm(t("feed.deleteSession.confirmTitle"));
    if (!confirmDelete) return;

    const queryKey = ["myActivitySessions"];

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<FeedData>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      const newPages = oldData.pages.map((page) => {
        const newFeed = page.feed.filter((feedItem) => feedItem.id !== id);
        return { ...page, feed: newFeed };
      });
      return { ...oldData, pages: newPages };
    });

    try {
      await deleteSession(id, type);

      toast.success(t("feed.deleteSession.successMessage"));
      queryClient.invalidateQueries({ queryKey });
      // Also invalidate the main feed
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    } catch {
      queryClient.setQueryData(queryKey, previousFeed);
      toast.error(t("feed.deleteSession.errorMessage"));
    }
  };

  return { handleDelete };
}
