import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { handleError } from "@/utils/handleError";
import { FeedItemUI, full_reminder } from "@/types/session";
import { cancelNativeAlarm, scheduleNativeAlarm } from "@/native/android/NativeAlarm";

export default function useSetNotification({
  notifyAt,
  title,
  reminder,
  notes,
  weekdays,
  type,
  mode = "normal",
}: {
  notifyAt: Date;
  reminder: FeedItemUI | full_reminder;
  title: string;
  notes: string;
  weekdays: number[];
  type: "weekly" | "daily" | "one-time";
  mode?: "alarm" | "normal";
}) {
  const scheduleNotifications = async () => {
    try {
      if (type === "one-time") {
        if (mode === "alarm") {
          scheduleNativeAlarm(notifyAt.getTime(), (reminder as FeedItemUI).source_id, title, "reminder");
        }

        if (mode === "normal") {
          cancelNativeAlarm((reminder as FeedItemUI).source_id);
        }

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body: notes || (reminder as full_reminder).notes || "",
            sound: true,
            data: {
              reminderId:
                (reminder as FeedItemUI).source_id
            },
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
            body: notes || (reminder as full_reminder).notes || "",
            sound: true,
            data: {
              reminderId: (reminder as FeedItemUI).source_id,
            },
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
                body: notes || (reminder as full_reminder).notes || "",
                sound: true,
                data: {
                  reminderId: (reminder as FeedItemUI).source_id,
                },
              },
              trigger,
            });
          })
        );
        return notifications;
      }
    } catch (error) {
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
