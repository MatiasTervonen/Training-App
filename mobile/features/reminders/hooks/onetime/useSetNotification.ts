import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { handleError } from "@/utils/handleError";
import { scheduleNativeAlarm } from "@/native/android/NativeAlarm";
import { t } from "i18next";
import { SNOOZE_CATEGORY_ID } from "@/features/push-notifications/constants";

export default function useSetNotification({
  notifyAt,
  title,
  notes,
  mode = "normal",
}: {
  notifyAt: Date;
  title: string;
  notes: string;
  mode?: "alarm" | "normal";
}) {
  async function setNotification(reminderId: string) {
    if (!notifyAt) return;

    try {
      // Android: use native alarm for all modes (native snooze works even when app is killed)
      if (Platform.OS === "android") {
        scheduleNativeAlarm(
          notifyAt.getTime(),
          reminderId,
          title,
          mode === "alarm" ? "reminder" : "reminder-normal",
          notes,
          t("reminders:reminders.notification.tapToOpen"),
          t("reminders:reminders.notification.reminder"),
          t("reminders:reminders.notification.stopAlarm"),
          t("reminders:reminders.notification.snooze")
        );
        return reminderId;
      }

      // iOS: use Expo Notifications
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: notes,
          sound: true,
          data: {
            reminderId: reminderId,
            type: "local-reminders",
          },
          categoryIdentifier: SNOOZE_CATEGORY_ID,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notifyAt,
        },
      });

      return notificationId;
    } catch (error) {
      handleError(error, {
        message: "Error scheduling notifications",
        route: "/api/reminders/schedule-notifications",
        method: "POST",
      });
    }
  }
  return {
    setNotification,
  };
}
