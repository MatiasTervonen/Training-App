import { Platform } from "react-native";
import Notifications from "expo-notifications";
import { handleError } from "@/utils/handleError";

export default function useSetNotification({
  notifyAt,
  title,
  notes,
}: {
  notifyAt: Date;
  title: string;
  notes: string;
}) {
  async function setNotification(reminderId: string) {
    if (!notifyAt) return;

    try {
      const hour = notifyAt.getHours();
      const minute = notifyAt.getMinutes();

      const trigger: any =
        Platform.OS === "android"
          ? {
              type: "daily",
              hour,
              minute,
              repeat: true,
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
          data: { reminderId: reminderId },
        },
        trigger,
      });

      return id;
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
