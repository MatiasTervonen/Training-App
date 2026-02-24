import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { saveLocalReminder } from "@/database/reminders/save-local-reminder";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

export default function useSaveReminderWeekly({
  title,
  notes,
  notifyAt,
  weekdays,
  mode,
  setIsSaving,
  setNotification,
  resetReminder,
}: {
  title: string;
  notes: string;
  notifyAt: Date;
  weekdays: number[];
  mode?: "alarm" | "normal";
  setIsSaving: (isSaving: boolean) => void;
  setNotification: (reminderId: string) => Promise<string | string[] | undefined>;
  resetReminder: () => void;
}) {
  const { t } = useTranslation("reminders");
  const queryClient = useQueryClient();
  const router = useRouter();

  const saveReminder = async () => {
    if (title.trim().length === 0) {
      Toast.show({
        type: "error",
        text1: t("reminders.validation.titleRequired"),
      });
      return;
    }
    if (!notifyAt) {
      Toast.show({
        type: "error",
        text1: t("reminders.validation.notifyTimeRequired"),
      });
      return;
    }

    setIsSaving(true);

    const time = `${notifyAt.getHours().toString().padStart(2, "0")}:${notifyAt.getMinutes().toString().padStart(2, "0")}`;

    try {
      const reminder = await saveLocalReminder({
        title: title,
        notes,
        weekdays,
        notify_at_time: time,
        type: "weekly",
        notify_date: undefined,
        mode,
      });

      const notificationId = await setNotification(reminder);

      if (notificationId) {
        await AsyncStorage.setItem(
          `notification:${reminder}`,
          JSON.stringify(notificationId)
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
        text1: t("reminders.errors.saveFailed"),
        text2: t("reminders.errors.tryAgainLaterGeneric"),
      });
      setIsSaving(false);
    }
  };
  return {
    saveReminder,
  };
}
