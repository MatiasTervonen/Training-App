import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";
import * as Notifications from "expo-notifications";
import setDailyNotification from "@/features/reminders/setNotificationsForSync/setDaily";
import setWeeklyNotification from "@/features/reminders/setNotificationsForSync/setWeekly";
import setOneTimeNotification from "@/features/reminders/setNotificationsForSync/setOneTime";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceId } from "@/utils/deviceId";

export async function syncNotifications() {
  // 1. Clear all existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const keys = await AsyncStorage.getAllKeys();
  const reminderIds = keys.filter((key) => key.startsWith("notification:"));
  await AsyncStorage.multiRemove(reminderIds);

  // 2. Get device ID for global reminders
  const deviceId = await getDeviceId();

  // 3. Fetch all local reminders
  const { data: localReminders, error: localRemindersError } = await supabase
    .from("local_reminders")
    .select("*");

  if (localRemindersError) {
    handleError(localRemindersError, {
      message: "Error getting local reminders notification ids",
      route: "/database/reminders/syncNotifications",
      method: "GET",
    });
    throw new Error("Failed to sync reminders");
  }

  // 4. Fetch global reminders created from this device
  let globalReminders: any[] = [];
  const { data, error: globalRemindersError } = await supabase
    .from("global_reminders")
    .select("*")
    .eq("created_from_device_id", deviceId);

  if (globalRemindersError) {
    handleError(globalRemindersError, {
      message: "Error getting global reminders for notification sync",
      route: "/database/reminders/syncNotifications",
      method: "GET",
    });
  } else {
    globalReminders = data || [];
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
            JSON.stringify([notificationId]),
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
            JSON.stringify(notificationId),
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
            JSON.stringify([notificationId]),
          );
          return;
        }
      }
    }),
  );

  // 6. Schedule global reminders (one-time notifications)
  await Promise.all(
    globalReminders.map(async (reminder) => {
      const notifyAt = new Date(reminder.notify_at);

      // Do NOT schedule past reminders
      if (notifyAt <= new Date()) {
        return;
      }

      const notificationId = await setOneTimeNotification({
        notifyAt,
        title: reminder.title,
        notes: reminder.notes || "",
        reminderId: reminder.id,
      });
      await AsyncStorage.setItem(
        `notification:${reminder.id}`,
        JSON.stringify([notificationId]),
      );
    }),
  );

  return true;
}
