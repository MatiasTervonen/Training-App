import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleError } from "@/utils/handleError";
import { HABIT_CATEGORY_ID } from "@/features/push-notifications/constants";

const NOTIF_KEY_PREFIX = "habit-notif-";

export function useHabitNotifications() {
  async function scheduleHabitReminder(
    habitId: string,
    habitName: string,
    reminderTime: string, // "HH:MM:SS" or "HH:MM"
    body: string,
    frequencyDays?: number[] | null, // null/undefined = daily, [1..7] = specific days
  ) {
    try {
      const [hourStr, minuteStr] = reminderTime.split(":");
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      const content: Notifications.NotificationContentInput = {
        title: habitName,
        body,
        sound: true,
        data: { habitId, type: "habit" },
        categoryIdentifier: HABIT_CATEGORY_ID,
        ...(Platform.OS === "android" && { channelId: "reminders" }),
      };

      if (frequencyDays && frequencyDays.length > 0) {
        // Schedule one notification per selected weekday
        const notifIds: string[] = [];
        for (const weekday of frequencyDays) {
          const trigger: Notifications.NotificationTriggerInput =
            Platform.OS === "android"
              ? {
                  type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                  hour,
                  minute,
                  weekday,
                }
              : {
                  type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                  hour,
                  minute,
                  weekday,
                  repeats: true,
                };

          const notifId = await Notifications.scheduleNotificationAsync({
            content,
            trigger,
          });
          notifIds.push(notifId);
        }
        await AsyncStorage.setItem(
          `${NOTIF_KEY_PREFIX}${habitId}`,
          JSON.stringify(notifIds),
        );
      } else {
        // Daily notification
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

        const notifId = await Notifications.scheduleNotificationAsync({
          content,
          trigger,
        });
        await AsyncStorage.setItem(`${NOTIF_KEY_PREFIX}${habitId}`, notifId);
      }
    } catch (error) {
      handleError(error, {
        message: "Error scheduling habit notification",
        route: "features/habits/hooks/useHabitNotifications",
        method: "POST",
      });
    }
  }

  async function cancelHabitReminder(habitId: string) {
    try {
      const stored = await AsyncStorage.getItem(`${NOTIF_KEY_PREFIX}${habitId}`);
      if (stored) {
        // Handle both single ID (string) and multiple IDs (JSON array)
        if (stored.startsWith("[")) {
          const notifIds: string[] = JSON.parse(stored);
          for (const id of notifIds) {
            await Notifications.cancelScheduledNotificationAsync(id);
          }
        } else {
          await Notifications.cancelScheduledNotificationAsync(stored);
        }
        await AsyncStorage.removeItem(`${NOTIF_KEY_PREFIX}${habitId}`);
      }
    } catch (error) {
      handleError(error, {
        message: "Error cancelling habit notification",
        route: "features/habits/hooks/useHabitNotifications",
        method: "DELETE",
      });
    }
  }

  return { scheduleHabitReminder, cancelHabitReminder };
}
