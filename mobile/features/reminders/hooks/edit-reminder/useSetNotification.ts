import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { handleError } from "@/utils/handleError";
import { FeedItemUI, full_reminder } from "@/types/session";
import { scheduleNativeAlarm, scheduleRepeatingNativeAlarm } from "@/native/android/NativeAlarm";
import { t } from "i18next";
import { SNOOZE_CATEGORY_ID } from "@/features/push-notifications/constants";

type ReminderInput = FeedItemUI | full_reminder;

function getReminderId(reminder: ReminderInput): string {
  if ("source_id" in reminder && reminder.source_id) {
    return reminder.source_id;
  }
  return reminder.id;
}

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
  reminder: ReminderInput;
  title: string;
  notes: string;
  weekdays: number[];
  type: "weekly" | "daily" | "one-time";
  mode?: "alarm" | "normal";
}) {
  const reminderId = getReminderId(reminder);

  const scheduleNotifications = async () => {
    try {
      const bodyText = notes || (reminder as full_reminder).notes || "";
      const soundType = mode === "alarm" ? "reminder" : "reminder-normal";

      // Android: use native alarm for all modes (native snooze works even when app is killed)
      if (Platform.OS === "android") {
        if (type === "one-time") {
          scheduleNativeAlarm(
            notifyAt.getTime(),
            reminderId,
            title,
            soundType,
            bodyText,
            t("reminders:reminders.notification.tapToOpen"),
            t("reminders:reminders.notification.reminder"),
            t("reminders:reminders.notification.stopAlarm"),
            t("reminders:reminders.notification.snooze")
          );
        } else if (type === "daily") {
          const hour = notifyAt.getHours();
          const minute = notifyAt.getMinutes();
          const now = new Date();
          const triggerDate = new Date();
          triggerDate.setHours(hour, minute, 0, 0);
          if (triggerDate.getTime() <= now.getTime()) {
            triggerDate.setDate(triggerDate.getDate() + 1);
          }
          scheduleRepeatingNativeAlarm(
            triggerDate.getTime(), reminderId, title, soundType, bodyText,
            "daily", hour, minute
          );
        } else if (type === "weekly") {
          const hour = notifyAt.getHours();
          const minute = notifyAt.getMinutes();
          const now = new Date();
          const currentDay = now.getDay() + 1;
          let daysToAdd = 7;
          for (let i = 0; i <= 7; i++) {
            const checkDay = ((currentDay - 1 + i) % 7) + 1;
            if (weekdays.includes(checkDay)) {
              if (i === 0) {
                const todayTrigger = new Date();
                todayTrigger.setHours(hour, minute, 0, 0);
                if (todayTrigger.getTime() > now.getTime()) { daysToAdd = 0; break; }
              } else { daysToAdd = i; break; }
            }
          }
          const triggerDate = new Date();
          triggerDate.setDate(triggerDate.getDate() + daysToAdd);
          triggerDate.setHours(hour, minute, 0, 0);
          scheduleRepeatingNativeAlarm(
            triggerDate.getTime(), reminderId, title, soundType, bodyText,
            "weekly", hour, minute, weekdays
          );
        }
        return reminderId;
      }

      // iOS: use Expo Notifications
      if (type === "one-time") {
        return await Notifications.scheduleNotificationAsync({
          content: { title, body: bodyText, sound: true, data: { reminderId }, categoryIdentifier: SNOOZE_CATEGORY_ID },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifyAt },
        });
      } else if (type === "daily") {
        const hour = notifyAt.getHours();
        const minute = notifyAt.getMinutes();
        return await Notifications.scheduleNotificationAsync({
          content: { title, body: bodyText, sound: true, data: { reminderId }, categoryIdentifier: SNOOZE_CATEGORY_ID },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, hour, minute, repeats: true },
        });
      } else if (type === "weekly") {
        const hour = notifyAt.getHours();
        const minute = notifyAt.getMinutes();
        return await Promise.all(
          weekdays.map((day) =>
            Notifications.scheduleNotificationAsync({
              content: { title, body: bodyText, sound: true, data: { reminderId }, categoryIdentifier: SNOOZE_CATEGORY_ID },
              trigger: { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, weekday: day, hour, minute },
            })
          )
        );
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
