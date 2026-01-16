import { confirmAction } from "@/lib/confirmAction";
import { full_reminder } from "@/types/session";
import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { deleteGlobalReminder } from "@/database/reminders/delete-global-reminder";
import { deleteLocalReminder } from "@/database/reminders/delete-local-reminder";
import Toast from "react-native-toast-message";
import { cancelNativeAlarm } from "@/native/android/NativeAlarm";

export default function useDeleteReminder() {
  const queryClient = useQueryClient();

  const handleDeleteReminder = async (reminder: full_reminder) => {
    const confirmDelete = await confirmAction({
      message: "Delete Reminder",
      title: "Are you sure you want to delete this reminder?",
    });
    if (!confirmDelete) return;

    const queryKey = ["get-reminders"];

    const previousFeed = queryClient.getQueryData<full_reminder[]>(queryKey);

    queryClient.setQueryData<full_reminder[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      return oldData.filter((item) => item.id !== reminder.id);
    });

    try {
      const ids = Array.isArray(reminder.notification_id)
        ? reminder.notification_id
        : typeof reminder.notification_id === "string"
          ? [reminder.notification_id]
          : [];

      for (const nid of ids) {
        await Notifications.cancelScheduledNotificationAsync(nid);
      }

      // Cancel native Android alarm if it was a high-priority reminder
      cancelNativeAlarm(reminder.id);

      if (reminder.type === "global") {
        await deleteGlobalReminder(reminder.id);
      } else {
        await deleteLocalReminder(reminder.id);
      }

      queryClient.refetchQueries({ queryKey: ["feed"], exact: true });

      Toast.show({
        type: "success",
        text1: "Reminder deleted successfully",
      });
    } catch {
      queryClient.setQueryData(queryKey, previousFeed);
      Toast.show({
        type: "error",
        text1: "Failed to delete reminder",
        text2: "Please try again.",
      });
    }
  };
  return {
    handleDeleteReminder,
  };
}
