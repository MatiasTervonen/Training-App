"use client";

import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { hideFeedItem } from "@/database/feed/hideFeedItem";
import { FeedData } from "@/types/session";
import { useTranslation } from "react-i18next";

export default function useHideFeedItem() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("feed");

  const handleHide = async (feedItemId: string) => {
    const queryKey = ["feed"];

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<FeedData>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      const newPages = oldData.pages.map((page) => {
        const newFeed = page.feed.filter(
          (feedItem) => feedItem.id !== feedItemId
        );
        return { ...page, feed: newFeed };
      });
      return { ...oldData, pages: newPages };
    });

    try {
      await hideFeedItem(feedItemId);
      toast.success(t("feed.hide.success"));
      queryClient.invalidateQueries({ queryKey });
    } catch {
      queryClient.setQueryData(queryKey, previousFeed);
      toast.error(t("feed.hide.error"));
    }
  };

  return { handleHide };
}
