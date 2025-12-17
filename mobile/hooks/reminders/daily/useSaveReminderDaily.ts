import Toast from "react-native-toast-message";
import SaveCustomReminder from "@/database/reminders/save-custom-reminder";
import UpdateNotificationId from "@/database/reminders/update-notification-id";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

export default function useSaveReminderDaily({
  title,
  notes,
  notifyAt,
  setIsSaving,
  setNotification,
  resetReminder,
}: {
  title: string;
  notes: string;
  notifyAt: Date;
  setIsSaving: (isSaving: boolean) => void;
  setNotification: (reminderId: string) => Promise<string | undefined>;
  resetReminder: () => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const saveReminder = async () => {
    if (title.trim().length === 0) {
      Toast.show({
        type: "error",
        text1: "Title is required",
      });
      return;
    }
    if (!notifyAt) {
      Toast.show({
        type: "error",
        text1: "Notify time is required",
      });
      return;
    }

    setIsSaving(true);

    const time = `${notifyAt.getHours().toString().padStart(2, "0")}:${notifyAt.getMinutes().toString().padStart(2, "0")}`;

    try {
      const reminder = await SaveCustomReminder({
        title: title,
        notes,
        weekdays: [],
        notify_at_time: time,
        type: "daily",
        notify_date: null,
        notification_id: [],
      });

      const notificationId = await setNotification(reminder.id);

      await UpdateNotificationId(notificationId!, reminder.id);

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["feed"], exact: true }),
        queryClient.refetchQueries({
          queryKey: ["get-reminders"],
          exact: true,
        }),
      ]);
      router.push("/dashboard");
      resetReminder();
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to save reminder. Please try again.",
      });
      setIsSaving(false);
    }
  };
  return {
    saveReminder,
  };
}
