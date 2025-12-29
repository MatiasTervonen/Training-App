import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import SaveLocalReminder from "@/database/reminders/save-local-reminder";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function useSaveReminderWeekly({
  title,
  notes,
  notifyAt,
  weekdays,
  setIsSaving,
  setNotification,
  resetReminder,
}: {
  title: string;
  notes: string;
  notifyAt: Date;
  weekdays: number[];
  setIsSaving: (isSaving: boolean) => void;
  setNotification: (reminderId: string) => Promise<string[] | undefined>;
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
      const reminder = await SaveLocalReminder({
        title: title,
        notes,
        weekdays,
        notify_at_time: time,
        type: "weekly",
        notify_date: null,
      });

      const notificationId = await setNotification(reminder.id);

      if (notificationId) {
        await AsyncStorage.setItem(
          `notification:${reminder.id}`,
          JSON.stringify(notificationId)
        );
      }

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
