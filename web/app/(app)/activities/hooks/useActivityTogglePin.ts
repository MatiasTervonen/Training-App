"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { FeedData } from "@/app/(app)/types/session";
import { unpinItem } from "@/app/(app)/database/pinned/unpin-items";
import { pinItem } from "@/app/(app)/database/pinned/pin-items";
import { handleError } from "@/app/(app)/utils/handleError";

export default function useActivityTogglePin() {
  const queryClient = useQueryClient();

  const togglePin = async (
    id: string,
    type: string,
    feed_context: "pinned" | "feed"
  ) => {
    const feedData = queryClient.getQueryData<FeedData>(["myActivitySessions"]);

    const pinnedFeed =
      feedData?.pages
        .flatMap((page) => page.feed)
        .filter((item) => item.feed_context === "pinned") ?? [];

    if (feed_context === "feed" && pinnedFeed.length >= 10) {
      toast.error("You can only pin 10 items. Unpin something first.");
      return;
    }

    const queryKey = ["myActivitySessions"];

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<FeedData>(["myActivitySessions"], (oldData) => {
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
        await unpinItem({ id, type, pinned_context: "activities" });
      } else {
        await pinItem({ id, type, pinned_context: "activities" });
      }

      toast.success(
        `Item has been ${
          feed_context === "pinned" ? "unpinned" : "pinned"
        } successfully.`
      );
    } catch (error) {
      queryClient.setQueryData(queryKey, previousFeed);
      handleError(error, {
        message: "Failed to toggle pin",
        route: "server-action: togglePin/activityFeed",
        method: "direct",
      });
      toast.error("Failed to toggle pin");
    }
  };

  return { togglePin };
}
