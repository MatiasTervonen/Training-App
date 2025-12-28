import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { handleError } from "@/utils/handleError";
import { FeedItemUI } from "@/types/session";

export default function useSetNotification({
  notifyAt,
  title,
  reminder,
  notes,
  weekdays,
  type,
}: {
  notifyAt: Date;
  reminder: FeedItemUI;
  title: string;
  notes: string;
  weekdays: number[];
  type: "weekly" | "daily" | "one-time";
}) {
  const scheduleNotifications = async () => {
    try {
      if (type === "one-time") {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body: notes || "",
            sound: true,
            data: { reminderId: reminder.id },
          },
          trigger: { type: "date", date: notifyAt } as any,
        });
        return id;
      } else if (type === "daily") {
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
            title,
            body: notes || "",
            sound: true,
            data: { reminderId: reminder.id },
          },
          trigger,
        });
        return id;
      } else if (type === "weekly") {
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

            return Notifications.scheduleNotificationAsync({
              content: {
                title,
                body: notes || "",
                sound: true,
                data: { reminderId: reminder.id },
              },
              trigger,
            });
          })
        );
        return notifications;
      }
    } catch (error) {
      console.log("Error scheduling notifications:", error);
      handleError(error, {
        message: "Error scheduling notifications",
        route: "/components/editSession/editCustomReminder",
        method: "scheduleNotifications",
      });
      throw error;
    }
  };
  return {
    scheduleNotifications,
  };
}
