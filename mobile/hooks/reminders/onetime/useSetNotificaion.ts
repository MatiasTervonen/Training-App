import Notifications from "expo-notifications";
import { handleError } from "@/utils/handleError";

export default function useSetNotificationOnetime({
  notifyAt,
  title,
  notes,
}: {
  notifyAt: Date;
  title: string;
  notes: string;
}) {
  async function setNotification(reminderId: string, occurrenceId: string) {
    if (!notifyAt) return;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: notes,
          sound: true,
          data: {
            reminderId: reminderId,
            occurrenceId: occurrenceId,
            type: "onetime-reminder",
          },
        },
        trigger: { type: "date", date: notifyAt } as any,
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
