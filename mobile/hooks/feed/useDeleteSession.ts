import { confirmAction } from "@/lib/confirmAction";
import { useQueryClient } from "@tanstack/react-query";
import { DeleteSession } from "@/database/feed/deleteSession";
import Toast from "react-native-toast-message";
import * as Notifications from "expo-notifications";
import { FeedData } from "@/types/session";

export default function useDeleteSession() {
  const queryClient = useQueryClient();

  const handleDelete = async (
    notification_id: string[] | string | null,
    id: string,
    table: string,
  ) => {
    const confirmed = await confirmAction({
      title: "Are you sure you want to delete this session?",
    });
    if (!confirmed) return;

    const queryKey = ["feed"];

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<FeedData>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      const newPages = oldData.pages.map((page) => {
        const newFeed = page.feed.filter((feedItem) => feedItem.id !== id);
        return { ...page, feed: newFeed };
      });
      return { ...oldData, pages: newPages };
    });

    try {
      await DeleteSession(id, table);

      if (table === "weight") {
        queryClient.refetchQueries({
          queryKey: ["get-weight"],
          exact: true,
        });
      }

      if (table === "reminders" || table === "custom_reminders") {
        queryClient.refetchQueries({
          queryKey: ["get-reminders"],
          exact: true,
        });
      }

      if (table === "custom_reminders") {
        const ids = Array.isArray(notification_id)
          ? notification_id
          : typeof notification_id === "string"
            ? [notification_id]
            : [];

        for (const nid of ids) {
          await Notifications.cancelScheduledNotificationAsync(nid);
        }
      }

      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: "Item has been deleted successfully.",
      });
    } catch {
      queryClient.setQueryData(queryKey, previousFeed);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete item.",
      });
    }
  };

  return { handleDelete };
}
