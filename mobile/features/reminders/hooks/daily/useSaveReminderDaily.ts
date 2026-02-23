import Toast from "react-native-toast-message";
import { saveLocalReminder } from "@/database/reminders/save-local-reminder";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function useSaveReminderDaily({
  title,
  notes,
  notifyAt,
  mode,
  setIsSaving,
  setNotification,
  resetReminder,
}: {
  title: string;
  notes: string;
  notifyAt: Date;
  mode?: "alarm" | "normal";
  setIsSaving: (isSaving: boolean) => void;
  setNotification: (reminder: string) => Promise<string | undefined>;
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
      const reminder = await saveLocalReminder({
        title: title,
        notes,
        weekdays: [],
        notify_at_time: time,
        type: "daily",
        notify_date: undefined,
        mode,
      });

      const notificationId = await setNotification(reminder);

      if (notificationId) {
        await AsyncStorage.setItem(
          `notification:${reminder}`,
          JSON.stringify([notificationId]),
        );
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["feed"], exact: true }),
        queryClient.invalidateQueries({ queryKey: ["reminders"] }),
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
