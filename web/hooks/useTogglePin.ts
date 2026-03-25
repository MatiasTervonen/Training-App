"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FeedData } from "@/types/session";
import { unpinItem } from "@/database/pinned/unpin-items";
import { pinItem } from "@/database/pinned/pin-items";
import { handleError } from "@/utils/handleError";

export default function useTogglePin(
  queryKey: string[] = ["feed"],
  defaultPinnedContext?: string,
) {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();

  const togglePin = async (
    id: string,
    type: string,
    feed_context: "pinned" | "feed",
    pinned_context?: string,
  ) => {
    const context = pinned_context ?? defaultPinnedContext;
    if (!context) return;

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

      if (feed_context === "pinned") {
        // UNPINNING: remove from pinned, insert at correct chronological position
        const targetItem = oldData.pages
          .flatMap((p) => p.feed)
          .find((item) => item.id === id);
        if (!targetItem) return oldData;

        const unpinnedItem = {
          ...targetItem,
          feed_context: "feed" as const,
        };
        const itemTime = new Date(
          unpinnedItem.activity_at ?? unpinnedItem.created_at,
        ).getTime();

        // Remove item from all pages
        const newPages = oldData.pages.map((page) => ({
          ...page,
          feed: page.feed.filter((item) => item.id !== id),
        }));

        // Find the correct position among unpinned items across all pages
        let inserted = false;
        for (let p = 0; p < newPages.length; p++) {
          const pageFeed = newPages[p].feed;
          for (let i = 0; i < pageFeed.length; i++) {
            if (pageFeed[i].feed_context === "pinned") continue;
            const compareTime = new Date(
              pageFeed[i].activity_at ?? pageFeed[i].created_at,
            ).getTime();
            if (itemTime >= compareTime) {
              newPages[p] = {
                ...newPages[p],
                feed: [
                  ...pageFeed.slice(0, i),
                  unpinnedItem,
                  ...pageFeed.slice(i),
                ],
              };
              inserted = true;
              break;
            }
          }
          if (inserted) break;
        }

        // If not inserted and no more pages to load, append to last page.
        // If there ARE more pages, the item is older than all loaded items — drop it.
        if (!inserted) {
          const lastPageIdx = newPages.length - 1;
          const hasMore = oldData.pages[lastPageIdx]?.nextPage != null;
          if (!hasMore) {
            newPages[lastPageIdx] = {
              ...newPages[lastPageIdx],
              feed: [...newPages[lastPageIdx].feed, unpinnedItem],
            };
          }
        }

        return { ...oldData, pages: newPages };
      }

      // PINNING: flip feed_context to "pinned"
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          feed: page.feed.map((feedItem) =>
            feedItem.id === id
              ? { ...feedItem, feed_context: "pinned" as const }
              : feedItem,
          ),
        })),
      };
    });

    try {
      if (feed_context === "pinned") {
        await unpinItem({ id, type, pinned_context: context });
      } else {
        await pinItem({ id, type, pinned_context: context });
      }

      toast.success(
        feed_context === "pinned"
          ? t("common.unpinnedSuccess")
          : t("common.pinnedSuccess"),
      );
    } catch (error) {
      queryClient.setQueryData(queryKey, previousFeed);
      handleError(error, {
        message: "Failed to toggle pin",
        route: "server-action: togglePin",
        method: "direct",
      });
      toast.error(t("common.pinToggleFailed"));
    }
  };

  return { togglePin };
}
