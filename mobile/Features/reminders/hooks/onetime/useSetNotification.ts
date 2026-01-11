import * as Notifications from "expo-notifications";
import { handleError } from "@/utils/handleError";
import { scheduleNativeAlarm } from "@/native/android/NativeAlarm";

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
      console.log("mode", mode);
      console.log("reminderId", reminderId);
      // Schedule native alarm for high priority mode (Android only)
      if (mode === "alarm") {
        scheduleNativeAlarm(notifyAt.getTime(), reminderId, title, "reminder");
      }

      // Always schedule a regular notification as backup / for iOS
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: notes,
          sound: true,
          data: {
            reminderId: reminderId,
            type: "local-reminders",
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notifyAt,
        },
      });

      return notificationId;
    } catch (error) {
      console.log("Error scheduling notifications:", error);
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
