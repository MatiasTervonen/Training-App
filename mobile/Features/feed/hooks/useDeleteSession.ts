import { useConfirmAction } from "@/lib/confirmAction";
import { useQueryClient } from "@tanstack/react-query";
import { deleteSession } from "@/database/feed/deleteSession";
import Toast from "react-native-toast-message";
import * as Notifications from "expo-notifications";
import { FeedData } from "@/types/session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

export default function useDeleteSession() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("feed");

  const confirmAction = useConfirmAction();

  const handleDelete = async (id: string, type: string) => {
    const confirmed = await confirmAction({
      title: t("feed.deleteSession.confirmTitle"),
    });
    if (!confirmed) return;

    const queryKey = ["feed"];

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<FeedData>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      const newPages = oldData.pages.map((page) => {
        const newFeed = page.feed.filter(
          (feedItem) => feedItem.source_id !== id,
        );
        return { ...page, feed: newFeed };
      });
      return { ...oldData, pages: newPages };
    });

    try {
      if (type === "local_reminders") {
        const stored = await AsyncStorage.getItem(`notification:${id}`);

        if (stored) {
          const ids: string[] = JSON.parse(stored);

          for (const nid of ids) {
            await Notifications.cancelScheduledNotificationAsync(nid);
          }

          await AsyncStorage.removeItem(`notification:${id}`);
        }
      }

      await deleteSession(id, type);

      if (type === "weight") {
        queryClient.invalidateQueries({
          queryKey: ["get-weight"],
          exact: true,
        });
      }

      if (type === "global_reminders" || type === "local_reminders") {
        queryClient.invalidateQueries({
          queryKey: ["reminders"],
        });
      }

      Toast.show({
        type: "success",
        text1: t("feed.deleteSession.successTitle"),
        text2: t("feed.deleteSession.successMessage"),
      });
    } catch {
      queryClient.setQueryData(queryKey, previousFeed);
      Toast.show({
        type: "error",
        text1: t("feed.deleteSession.errorTitle"),
        text2: t("feed.deleteSession.errorMessage"),
      });
    }
  };

  return { handleDelete };
}
