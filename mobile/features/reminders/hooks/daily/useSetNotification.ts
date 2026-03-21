import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { handleError } from "@/utils/handleError";
import { scheduleRepeatingNativeAlarm } from "@/native/android/NativeAlarm";
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
      const hour = notifyAt.getHours();
      const minute = notifyAt.getMinutes();

      // Android: use native alarm for all modes (native snooze works even when app is killed)
      if (Platform.OS === "android") {
        const now = new Date();
        const triggerDate = new Date();
        triggerDate.setHours(hour, minute, 0, 0);

        if (triggerDate.getTime() <= now.getTime()) {
          triggerDate.setDate(triggerDate.getDate() + 1);
        }

        scheduleRepeatingNativeAlarm(
          triggerDate.getTime(),
          reminderId,
          title,
          mode === "alarm" ? "reminder" : "reminder-normal",
          notes,
          "daily",
          hour,
          minute
        );

        return reminderId;
      }

      // iOS: use Expo Notifications
      const trigger: Notifications.NotificationTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: notes,
          sound: true,
          data: { reminderId: reminderId, type: "local-reminders" },
          categoryIdentifier: SNOOZE_CATEGORY_ID,
        },
        trigger,
      });

      return id;
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
