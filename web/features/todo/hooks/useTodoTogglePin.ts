"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { FeedData } from "@/types/session";
import { unpinItem } from "@/database/pinned/unpin-items";
import { pinItem } from "@/database/pinned/pin-items";
import { handleError } from "@/utils/handleError";

export default function useTodoTogglePin() {
  const queryClient = useQueryClient();

  const togglePin = async (
    id: string,
    type: string,
    feed_context: "pinned" | "feed"
  ) => {
    const feedData = queryClient.getQueryData<FeedData>(["myTodoLists"]);

    const pinnedFeed =
      feedData?.pages
        .flatMap((page) => page.feed)
        .filter((item) => item.feed_context === "pinned") ?? [];

    if (feed_context === "feed" && pinnedFeed.length >= 10) {
      toast.error("You can only pin 10 items. Unpin something first.");
      return;
    }

    const queryKey = ["myTodoLists"];

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<FeedData>(["myTodoLists"], (oldData) => {
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
        await unpinItem({ id, type, pinned_context: "todo" });
      } else {
        await pinItem({ id, type, pinned_context: "todo" });
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
        route: "server-action: togglePin/todoFeed",
        method: "direct",
      });
      toast.error("Failed to toggle pin");
    }
  };

  return { togglePin };
}
