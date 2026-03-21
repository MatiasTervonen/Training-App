import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";
import * as Notifications from "expo-notifications";
import setDailyNotification from "@/features/reminders/setNotificationsForSync/setDaily";
import setWeeklyNotification from "@/features/reminders/setNotificationsForSync/setWeekly";
import setOneTimeNotification from "@/features/reminders/setNotificationsForSync/setOneTime";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceId } from "@/utils/deviceId";

export async function syncNotifications() {
  // 1. Clear notifications, AsyncStorage, get deviceId, and fetch local reminders in parallel
  const [, , deviceId, { data: localReminders, error: localRemindersError }] =
    await Promise.all([
      Notifications.cancelAllScheduledNotificationsAsync(),
      AsyncStorage.getAllKeys().then((keys) => {
        const reminderIds = keys.filter((key) =>
          key.startsWith("notification:"),
        );
        return AsyncStorage.multiRemove(reminderIds);
      }),
      getDeviceId(),
      supabase.from("local_reminders").select("*"),
    ]);

  if (localRemindersError) {
    handleError(localRemindersError, {
      message: "Error getting local reminders notification ids",
      route: "/database/reminders/syncNotifications",
      method: "GET",
    });
    throw new Error("Failed to sync reminders");
  }

  // 3. Fetch global reminders (needs deviceId)
  const { data: globalRemindersData, error: globalRemindersError } =
    await supabase
      .from("global_reminders")
      .select("*")
      .eq("created_from_device_id", deviceId);

  if (globalRemindersError) {
    handleError(globalRemindersError, {
      message: "Error getting global reminders for notification sync",
      route: "/database/reminders/syncNotifications",
      method: "GET",
    });
  }

  const globalReminders = globalRemindersData || [];

  await Promise.all(
    (localReminders || []).map(async (reminder) => {
      switch (reminder.type) {
        case "daily": {
          if (!reminder.notify_at_time) return;
          // notify_at_time is a time-only string like "14:30:00"
          const [h, m] = reminder.notify_at_time.split(":").map(Number);
          const notifyAtDate = new Date();
          notifyAtDate.setHours(h, m, 0, 0);

          const notificationId = await setDailyNotification({
            notifyAt: notifyAtDate,
            title: reminder.title,
            notes: reminder.notes,
            reminderId: reminder.id,
            mode: (reminder.mode as "alarm" | "normal") || "normal",
          });
          await AsyncStorage.setItem(
            `notification:${reminder.id}`,
            JSON.stringify([notificationId]),
          );
          return;
        }

        case "weekly": {
          if (!reminder.notify_at_time) return;
          const [h, m] = reminder.notify_at_time.split(":").map(Number);
          const notifyAtDate = new Date();
          notifyAtDate.setHours(h, m, 0, 0);

          const notificationId = await setWeeklyNotification({
            notifyAt: notifyAtDate,
            title: reminder.title,
            notes: reminder.notes,
            weekdays: reminder.weekdays as number[],
            reminderId: reminder.id,
            mode: (reminder.mode as "alarm" | "normal") || "normal",
          });
          await AsyncStorage.setItem(
            `notification:${reminder.id}`,
            JSON.stringify(notificationId),
          );
          return;
        }

        case "one-time": {
          // One-time reminders use notify_date (full timestamp), not notify_at_time
          if (!reminder.notify_date) return;
          const notifyAt = new Date(reminder.notify_date);

          if (notifyAt <= new Date()) {
            return; // do NOT schedule past one-time reminders
          }

          const notificationId = await setOneTimeNotification({
            notifyAt,
            title: reminder.title,
            notes: reminder.notes,
            reminderId: reminder.id,
            mode: (reminder.mode as "alarm" | "normal") || "normal",
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
        mode: (reminder.mode as "alarm" | "normal") || "normal",
      });
      await AsyncStorage.setItem(
        `notification:${reminder.id}`,
        JSON.stringify([notificationId]),
      );
    }),
  );

  return true;
}
