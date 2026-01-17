import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { handleError } from "@/utils/handleError";

export default function useSetNotificationWeekly({
  notifyAt,
  title,
  notes,
  weekdays,
}: {
  notifyAt: Date;
  title: string;
  notes: string;
  weekdays: number[];
}) {
  async function setNotification(reminderId: string) {
    if (!notifyAt || weekdays.length === 0) return;

    try {
      const hour = notifyAt.getHours();
      const minute = notifyAt.getMinutes();

      const notifications = await Promise.all(
        weekdays.map((day) => {
          const trigger: any =
            Platform.OS === "android"
              ? {
                  type: "weekly",
                  weekday: day,
                  hour,
                  minute,
                }
              : {
                  type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                  weekday: day,
                  hour,
                  minute,
                };

          const id = Notifications.scheduleNotificationAsync({
            content: {
              title: title,
              body: notes,
              sound: true,
              data: { reminderId: reminderId, type: "local-reminders" },
            },
            trigger,
          });

          return id;
        })
      );

      return notifications;
    } catch (error) {
      handleError(error, {
        message: "Error scheduling notifications",
        route: "reminders/weekly-reminder/index.tsx",
        method: "POST",
      });
    }
  }
  return {
    setNotification,
  };
}
