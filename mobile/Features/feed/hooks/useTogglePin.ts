import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { FeedData } from "@/types/session";
import { unpinItem } from "@/database/pinned/unpin-items";
import { pinItem } from "@/database/pinned/pin-items";

export default function useTogglePin(queryKey: string[] = ["feed"]) {
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
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "You can only pin 10 items. Unpin something first.",
      });
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

      Toast.show({
        type: "success",
        text1: feed_context === "pinned" ? "Unpinned" : "Pinned",
        text2: `Item has been ${
          feed_context === "pinned" ? "unpinned" : "pinned"
        } successfully.`,
      });
    } catch {
      queryClient.setQueryData(queryKey, previousFeed);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to toggle pin status.",
      });
    }
  };

  return { togglePin };
}
