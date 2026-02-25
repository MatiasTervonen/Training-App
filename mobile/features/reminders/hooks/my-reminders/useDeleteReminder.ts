import { useConfirmAction } from "@/lib/confirmAction";
import { full_reminder } from "@/types/session";
import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { deleteGlobalReminder } from "@/database/reminders/delete-global-reminder";
import { deleteLocalReminder } from "@/database/reminders/delete-local-reminder";
import Toast from "react-native-toast-message";
import { cancelNativeAlarm } from "@/native/android/NativeAlarm";
import { useTranslation } from "react-i18next";

export default function useDeleteReminder() {
  const { t } = useTranslation("reminders");
  const queryClient = useQueryClient();

  const confirmAction = useConfirmAction();

  const handleDeleteReminder = async (reminder: full_reminder) => {
    const confirmDelete = await confirmAction({
      message: t("reminders.deleteConfirm.message"),
      title: t("reminders.deleteConfirm.title"),
    });
    if (!confirmDelete) return;

    try {
      const ids = Array.isArray(reminder.notification_id)
        ? reminder.notification_id
        : typeof reminder.notification_id === "string"
          ? [reminder.notification_id]
          : [];

      await Promise.all(
        ids.map((nid) => Notifications.cancelScheduledNotificationAsync(nid)),
      );

      // Cancel native Android alarm if it was a high-priority reminder
      cancelNativeAlarm(reminder.id);

      if (reminder.type === "global") {
        await deleteGlobalReminder(reminder.id);
      } else {
        await deleteLocalReminder(reminder.id);
      }

      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["feed"], exact: true });

      Toast.show({
        type: "success",
        text1: t("reminders.success.deleted"),
      });
    } catch {
      Toast.show({
        type: "error",
        text1: t("reminders.errors.deleteFailed"),
        text2: t("reminders.errors.tryAgainShort"),
      });
    }
  };
  return {
    handleDeleteReminder,
  };
}
