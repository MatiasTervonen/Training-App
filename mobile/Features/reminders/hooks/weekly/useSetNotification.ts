import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { handleError } from "@/utils/handleError";
import { scheduleRepeatingNativeAlarm } from "@/native/android/NativeAlarm";

export default function useSetNotificationWeekly({
  notifyAt,
  title,
  notes,
  weekdays,
  mode = "normal",
}: {
  notifyAt: Date;
  title: string;
  notes: string;
  weekdays: number[];
  mode?: "alarm" | "normal";
}) {
  async function setNotification(reminderId: string) {
    if (!notifyAt || weekdays.length === 0) return;

    try {
      const hour = notifyAt.getHours();
      const minute = notifyAt.getMinutes();

      // Use native alarm for high-priority mode
      if (mode === "alarm" && Platform.OS === "android") {
        // Calculate first trigger time based on next matching weekday
        const now = new Date();
        const currentDay = now.getDay() + 1; // JS: 0=Sun, convert to 1=Sun like our weekdays

        // Find the next weekday that matches
        let daysToAdd = 7;
        for (let i = 0; i <= 7; i++) {
          const checkDay = ((currentDay - 1 + i) % 7) + 1;
          if (weekdays.includes(checkDay)) {
            // If it's today, check if the time has passed
            if (i === 0) {
              const todayTrigger = new Date();
              todayTrigger.setHours(hour, minute, 0, 0);
              if (todayTrigger.getTime() > now.getTime()) {
                daysToAdd = 0;
                break;
              }
            } else {
              daysToAdd = i;
              break;
            }
          }
        }

        const triggerDate = new Date();
        triggerDate.setDate(triggerDate.getDate() + daysToAdd);
        triggerDate.setHours(hour, minute, 0, 0);

        scheduleRepeatingNativeAlarm(
          triggerDate.getTime(),
          reminderId,
          title,
          "reminder",
          notes,
          "weekly",
          hour,
          minute,
          weekdays
        );

        return reminderId;
      }

      // Use Expo Notifications for normal mode
      const notifications = await Promise.all(
        weekdays.map((day) => {
          const trigger: Notifications.NotificationTriggerInput =
            Platform.OS === "android"
              ? {
                  type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
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
