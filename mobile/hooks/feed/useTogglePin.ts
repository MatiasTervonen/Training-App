import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { FeedData } from "@/types/session";
import { unpinItem } from "@/database/pinned/unpin-items";
import { pinItem } from "@/database/pinned/pin-items";

export default function useTogglePin() {
  const queryClient = useQueryClient();

  const togglePin = async (
    id: string,
    table:
      | "notes"
      | "gym_sessions"
      | "weight"
      | "todo_lists"
      | "global_reminders"
      | "local_reminders"
      | "activity_session",
    isPinned: boolean
  ) => {
    const feedData = queryClient.getQueryData<FeedData>(["feed"]);

    const pinnedFeed =
      feedData?.pages
        .flatMap((page) => page.feed)
        .filter((item) => item.pinned) ?? [];

    if (!isPinned && pinnedFeed.length >= 10) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "You can only pin 10 items. Unpin something first.",
      });
      return;
    }
    const queryKey = ["feed"];

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<FeedData>(["feed"], (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          feed: page.feed.map((feedItem) =>
            feedItem.id === id ? { ...feedItem, pinned: !isPinned } : feedItem
          ),
        })),
      };
    });

    try {
      if (isPinned) {
        await unpinItem({ id, table });
      } else {
        await pinItem({ id, table });
      }

      Toast.show({
        type: "success",
        text1: isPinned ? "Unpinned" : "Pinned",
        text2: `Item has been ${
          isPinned ? "unpinned" : "pinned"
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
