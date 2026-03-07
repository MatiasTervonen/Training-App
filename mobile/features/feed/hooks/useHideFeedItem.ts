import { useQueryClient } from "@tanstack/react-query";
import { hideFeedItem } from "@/database/feed/hideFeedItem";
import Toast from "react-native-toast-message";
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

      const newPages = oldData.pages.map((page) => ({
        ...page,
        feed: page.feed.filter((feedItem) => feedItem.id !== feedItemId),
      }));
      return { ...oldData, pages: newPages };
    });

    try {
      await hideFeedItem(feedItemId);

      Toast.show({
        type: "success",
        text1: t("feed.hide.success"),
      });
    } catch {
      queryClient.setQueryData(queryKey, previousFeed);
      Toast.show({
        type: "error",
        text1: t("feed.hide.error"),
      });
    }
  };

  return { handleHide };
}
