import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";
import * as Notifications from "expo-notifications";
import setDailyNotification from "@/Features/reminders/setNotifications/setDaily";
import setWeeklyNotification from "@/Features/reminders/setNotifications/setWeekly";
import setOneTimeNotification from "@/Features/reminders/setNotifications/setOneTime";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function syncNotifications() {
  console.log("Syncing notifications");

  // 1. Clear all existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const keys = await AsyncStorage.getAllKeys();
  const reminderIds = keys.filter((key) => key.startsWith("notification:"));
  await AsyncStorage.multiRemove(reminderIds);

  const { data: localReminders, error: localRemindersError } = await supabase
    .from("local_reminders")
    .select("*")
    .eq("active", true);

  if (localRemindersError) {
    handleError(localRemindersError, {
      message: "Error getting local reminders notification ids",
      route: "/database/reminders/syncNotifications",
      method: "GET",
    });
    throw new Error("Failed to sync reminders");
  }

  await Promise.all(
    (localReminders || []).map(async (reminder) => {
      switch (reminder.type) {
        case "daily": {
          const notificationId = await setDailyNotification({
            notifyAt: new Date(reminder.notify_at_time),
            title: reminder.title,
            notes: reminder.notes,
            reminderId: reminder.id,
          });
          await AsyncStorage.setItem(
            `notification:${reminder.id}`,
            JSON.stringify([notificationId])
          );
          return;
        }

        case "weekly": {
          const notificationId = await setWeeklyNotification({
            notifyAt: new Date(reminder.notify_at_time),
            title: reminder.title,
            notes: reminder.notes,
            weekdays: reminder.weekdays,
            reminderId: reminder.id,
          });
          await AsyncStorage.setItem(
            `notification:${reminder.id}`,
            JSON.stringify(notificationId)
          );
          return;
        }

        case "one-time": {
          const notifyAt = new Date(reminder.notify_at_time);

          if (notifyAt <= new Date()) {
            return; // do NOT schedule past one-time reminders
          }

          const notificationId = await setOneTimeNotification({
            notifyAt,
            title: reminder.title,
            notes: reminder.notes,
            reminderId: reminder.id,
          });
          await AsyncStorage.setItem(
            `notification:${reminder.id}`,
            JSON.stringify([notificationId])
          );
          return;
        }
      }
    })
  );

  return true;
}
