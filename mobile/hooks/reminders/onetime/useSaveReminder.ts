import Toast from "react-native-toast-message";
import SaveCustomReminder from "@/database/reminders/save-custom-reminder";
import UpdateNotificationId from "@/database/reminders/update-notification-id";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

export default function useSaveReminderOnetime({
  title,
  notes,
  notifyAt,
  setIsSaving,
  resetReminder,
  setNotification,
}: {
  title: string;
  notes: string;
  notifyAt: Date;
  setIsSaving: (isSaving: boolean) => void;
  resetReminder: () => void;
  setNotification: (reminderId: string) => Promise<string | undefined>;
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

    try {
      const reminder = await SaveCustomReminder({
        title,
        notes,
        weekdays: [],
        notify_at_time: null,
        type: "one-time",
        notify_date: notifyAt ? notifyAt.toISOString() : null,
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
    } catch (error) {
      console.log("Error saving reminder:", error);
      Toast.show({
        type: "error",
        text1: "Failed to save reminder.",
        text2: "Please try again later.",
      });
      setIsSaving(false);
    }
  };
  return {
    saveReminder,
  };
}
