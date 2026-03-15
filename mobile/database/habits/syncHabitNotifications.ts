import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { HABIT_CATEGORY_ID } from "@/features/push-notifications/constants";

const NOTIF_KEY_PREFIX = "habit-notif-";

export async function syncHabitNotifications() {
  // 1. Cancel all existing habit notifications and clear their AsyncStorage keys
  const allKeys = await AsyncStorage.getAllKeys();
  const habitKeys = allKeys.filter((key) => key.startsWith(NOTIF_KEY_PREFIX));

  await Promise.all(
    habitKeys.map(async (key) => {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        if (stored.startsWith("[")) {
          const ids: string[] = JSON.parse(stored);
          for (const id of ids) {
            await Notifications.cancelScheduledNotificationAsync(id);
          }
        } else {
          await Notifications.cancelScheduledNotificationAsync(stored);
        }
      }
    }),
  );
  await AsyncStorage.multiRemove(habitKeys);

  // 2. Fetch active habits with reminders from Supabase
  const { data: habits, error } = await supabase
    .from("habits")
    .select("id, name, reminder_time, frequency_days")
    .eq("is_active", true)
    .not("reminder_time", "is", null);

  if (error) {
    handleError(error, {
      message: "Error fetching habits for notification sync",
      route: "database/habits/syncHabitNotifications",
      method: "GET",
    });
    throw new Error("Failed to sync habit notifications");
  }

  if (!habits || habits.length === 0) return;

  // 3. Schedule notifications for each habit
  await Promise.all(
    habits.map(async (habit) => {
      if (!habit.reminder_time) return;

      const [hourStr, minuteStr] = habit.reminder_time.split(":");
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      const content: Notifications.NotificationContentInput = {
        title: habit.name,
        body: "Time for your habit",
        sound: true,
        data: { habitId: habit.id, type: "habit" },
        categoryIdentifier: HABIT_CATEGORY_ID,
        ...(Platform.OS === "android" && { channelId: "reminders" }),
      };

      if (habit.frequency_days && habit.frequency_days.length > 0) {
        const notifIds: string[] = [];
        for (const weekday of habit.frequency_days) {
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
          `${NOTIF_KEY_PREFIX}${habit.id}`,
          JSON.stringify(notifIds),
        );
      } else {
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
        await AsyncStorage.setItem(`${NOTIF_KEY_PREFIX}${habit.id}`, notifId);
      }
    }),
  );
}
