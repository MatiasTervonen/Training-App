import Toast from "react-native-toast-message";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { saveLocalReminder } from "@/database/reminders/save-local-reminder";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function useSaveReminderOnetime({
  title,
  notes,
  notifyAt,
  mode,
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
  mode?: "alarm" | "normal";
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
      const reminder = await saveLocalReminder({
        title,
        notes,
        weekdays: [],
        notify_at_time: undefined,
        type: "one-time",
        notify_date: notifyAt ? notifyAt.toISOString() : undefined,
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
