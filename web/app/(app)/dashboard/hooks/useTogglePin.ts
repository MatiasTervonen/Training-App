"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FeedData } from "@/app/(app)/types/session";
import { unpinItem } from "@/app/(app)/database/pinned/unpin-items";
import { pinItem } from "@/app/(app)/database/pinned/pin-items";
import { handleError } from "@/app/(app)/utils/handleError";

export default function useTogglePin(queryKey: string[] = ["feed"]) {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();

  const togglePin = async (
    id: string,
    type: string,
    feed_context: "pinned" | "feed",
    pinned_context: string
  ) => {
    const feedData = queryClient.getQueryData<FeedData>(queryKey);

    const pinnedFeed =
      feedData?.pages
        .flatMap((page) => page.feed)
        .filter((item) => item.feed_context === "pinned") ?? [];

    if (feed_context === "feed" && pinnedFeed.length >= 10) {
      toast.error(t("common.pinLimitReached", { max: 10 }));
      return;
    }

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<FeedData>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          feed: page.feed.map((feedItem) =>
            feedItem.id === id
              ? {
                  ...feedItem,
                  feed_context: feed_context === "pinned" ? "feed" : "pinned",
                }
              : feedItem
          ),
        })),
      };
    });

    try {
      if (feed_context === "pinned") {
        await unpinItem({ id, type, pinned_context });
      } else {
        await pinItem({ id, type, pinned_context });
      }

      toast.success(
        feed_context === "pinned"
          ? t("common.unpinnedSuccess")
          : t("common.pinnedSuccess")
      );
    } catch (error) {
      queryClient.setQueryData(queryKey, previousFeed);
      handleError(error, {
        message: "Failed to toggle pin",
        route: "server-action: togglePin/sessionFeed",
        method: "direct",
      });
      toast.error(t("common.pinToggleFailed"));
    }
  };

  return { togglePin };
}
