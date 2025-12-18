import * as Notifications from "expo-notifications";
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
