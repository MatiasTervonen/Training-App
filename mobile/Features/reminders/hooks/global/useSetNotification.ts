import * as Notifications from "expo-notifications";
import { handleError } from "@/utils/handleError";
import { scheduleNativeAlarm } from "@/native/android/NativeAlarm";
import { t } from "i18next";

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
      // Schedule native alarm for high priority mode (Android only)
      if (mode === "alarm") {
        scheduleNativeAlarm(
          notifyAt.getTime(),
          reminderId,
          title,
          "reminder",
          notes,
          t("reminders:reminders.notification.tapToOpen"),
          t("reminders:reminders.notification.reminder"),
          t("reminders:reminders.notification.stopAlarm")
        );
      }

      // Always schedule a regular notification as backup / for iOS
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: notes,
          sound: true,
          data: {
            reminderId: reminderId,
            type: "global-reminder",
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notifyAt,
        },
      });

      return notificationId;
    } catch (error) {
      handleError(error, {
        message: "Error scheduling global notification",
        route: "/features/reminders/hooks/global/useSetNotification",
        method: "POST",
      });
    }
  }

  return {
    setNotification,
  };
}
