import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { handleError } from "@/utils/handleError";
import { scheduleRepeatingNativeAlarm } from "@/native/android/NativeAlarm";

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

      // Use native alarm for high-priority mode
      if (mode === "alarm" && Platform.OS === "android") {
        // Calculate first trigger time (today or tomorrow at the specified time)
        const now = new Date();
        const triggerDate = new Date();
        triggerDate.setHours(hour, minute, 0, 0);

        // If the time has already passed today, schedule for tomorrow
        if (triggerDate.getTime() <= now.getTime()) {
          triggerDate.setDate(triggerDate.getDate() + 1);
        }

        scheduleRepeatingNativeAlarm(
          triggerDate.getTime(),
          reminderId,
          title,
          "reminder",
          notes,
          "daily",
          hour,
          minute
        );

        return reminderId;
      }

      // Use Expo Notifications for normal mode
      const trigger: Notifications.NotificationTriggerInput =
        Platform.OS === "android"
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour,
              minute,
            }
          : {
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
