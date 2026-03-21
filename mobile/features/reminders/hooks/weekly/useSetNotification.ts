import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { handleError } from "@/utils/handleError";
import { scheduleRepeatingNativeAlarm } from "@/native/android/NativeAlarm";
import { SNOOZE_CATEGORY_ID } from "@/features/push-notifications/constants";

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

      // Android: use native alarm for all modes (native snooze works even when app is killed)
      if (Platform.OS === "android") {
        const now = new Date();
        const currentDay = now.getDay() + 1;

        let daysToAdd = 7;
        for (let i = 0; i <= 7; i++) {
          const checkDay = ((currentDay - 1 + i) % 7) + 1;
          if (weekdays.includes(checkDay)) {
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
          mode === "alarm" ? "reminder" : "reminder-normal",
          notes,
          "weekly",
          hour,
          minute,
          weekdays
        );

        return reminderId;
      }

      // iOS: use Expo Notifications
      const notifications = await Promise.all(
        weekdays.map((day) => {
          const trigger: Notifications.NotificationTriggerInput = {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            weekday: day,
            hour,
            minute,
          };

          return Notifications.scheduleNotificationAsync({
            content: {
              title: title,
              body: notes,
              sound: true,
              data: { reminderId: reminderId, type: "local-reminders" },
              categoryIdentifier: SNOOZE_CATEGORY_ID,
            },
            trigger,
          });
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
