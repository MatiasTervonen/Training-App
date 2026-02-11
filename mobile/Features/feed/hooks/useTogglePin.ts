import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { FeedData } from "@/types/session";
import { unpinItem } from "@/database/pinned/unpin-items";
import { pinItem } from "@/database/pinned/pin-items";
import { useTranslation } from "react-i18next";

export default function useTogglePin(queryKey: string[] = ["feed"]) {
  const queryClient = useQueryClient();
  const { t } = useTranslation("feed");

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
        text1: t("common:common.error"),
        text2: t("feed.togglePin.maxPinned"),
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
        text1: feed_context === "pinned" ? t("feed.togglePin.unpinned") : t("feed.togglePin.pinned"),
        text2: feed_context === "pinned" ? t("feed.togglePin.unpinnedMessage") : t("feed.togglePin.pinnedMessage"),
      });
    } catch {
      queryClient.setQueryData(queryKey, previousFeed);
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("feed.togglePin.errorMessage"),
      });
    }
  };

  return { togglePin };
}
