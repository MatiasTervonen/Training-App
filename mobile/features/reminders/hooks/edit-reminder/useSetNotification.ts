import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { handleError } from "@/utils/handleError";
import { FeedItemUI, full_reminder } from "@/types/session";
import { cancelNativeAlarm, scheduleNativeAlarm } from "@/native/android/NativeAlarm";
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
      if (type === "one-time") {
        if (mode === "alarm") {
          scheduleNativeAlarm(
            notifyAt.getTime(),
            reminderId,
            title,
            "reminder",
            notes || (reminder as full_reminder).notes || "",
            t("reminders:reminders.notification.tapToOpen"),
            t("reminders:reminders.notification.reminder"),
            t("reminders:reminders.notification.stopAlarm"),
            t("reminders:reminders.notification.snooze")
          );
        }

        if (mode === "normal") {
          cancelNativeAlarm(reminderId);
        }

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body: notes || (reminder as full_reminder).notes || "",
            sound: true,
            data: {
              reminderId:
                reminderId
            },
            ...(mode === "normal" && {
              categoryIdentifier: SNOOZE_CATEGORY_ID,
            }),
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifyAt },
        });
        return id;
      } else if (type === "daily") {
        const hour = notifyAt.getHours();
        const minute = notifyAt.getMinutes();

        const trigger: Notifications.NotificationTriggerInput =
          Platform.OS === "android"
            ? {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
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
              reminderId: reminderId,
            },
            ...(mode === "normal" && {
              categoryIdentifier: SNOOZE_CATEGORY_ID,
            }),
          },
          trigger,
        });
        return id;
      } else if (type === "weekly") {
        const hour = notifyAt.getHours();
        const minute = notifyAt.getMinutes();

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

            return Notifications.scheduleNotificationAsync({
              content: {
                title,
                body: notes || (reminder as full_reminder).notes || "",
                sound: true,
                data: {
                  reminderId: reminderId,
                },
                ...(mode === "normal" && {
                  categoryIdentifier: SNOOZE_CATEGORY_ID,
                }),
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
