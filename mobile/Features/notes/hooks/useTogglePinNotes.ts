import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { notes } from "@/types/models";
import { unpinNotes } from "@/database/notes/unpin-notes";
import { pinNotes } from "@/database/notes/pin-notes";

type FeedData = {
  pageParams: number[];
  pages: {
    feed: notes[];
    nextPage?: number | null;
  }[];
};

export default function useTogglePinNotes() {
  const queryClient = useQueryClient();

  const togglePin = async (id: string, isPinned: boolean) => {
    const feedData = queryClient.getQueryData<FeedData>(["myNotes"]);

    const pinnedNotes =
      feedData?.pages
        .flatMap((page) => page.feed)
        .filter((item) => item.pinned) ?? [];

    if (!isPinned && pinnedNotes.length >= 10) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "You can only pin 10 items. Unpin something first.",
      });
      return;
    }

    const queryKey = ["myNotes"];

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<FeedData>(["myNotes"], (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          feed: page.feed.map((feedItem) =>
            feedItem.id === id
              ? {
                  ...feedItem,
                  pinned: !isPinned,
                }
              : feedItem
          ),
        })),
      };
    });

    try {
      if (isPinned) {
        await unpinNotes(id);
      } else {
        await pinNotes(id);
      }

      Toast.show({
        type: "success",
        text1: isPinned ? "Unpinned" : "Pinned",
        text2: `Note has been ${isPinned ? "unpinned" : "pinned"} successfully.`,
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
