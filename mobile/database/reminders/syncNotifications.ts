import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";
import * as Notifications from "expo-notifications";
import setDailyNotification from "@/app/reminders/setNotifications.ts/setDaily";
import setWeeklyNotification from "@/app/reminders/setNotifications.ts/setWeekly";
import setOneTimeNotification from "@/app/reminders/setNotifications.ts/setOneTime";

export default async function SyncNotifications() {
  console.log("Syncing notifications");

  // 1. Clear all existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const { data: customReminders, error: customRemindersError } = await supabase
    .from("custom_reminders")
    .select("*")
    .eq("active", true);

  if (customRemindersError) {
    handleError(customRemindersError, {
      message: "Error getting custom reminders notification ids",
      route: "/database/reminders/syncNotifications",
      method: "GET",
    });
    throw new Error("Failed to sync reminders");
  }

  await Promise.all(
    (customReminders || []).map(async (reminder) => {
      switch (reminder.type) {
        case "daily":
          return setDailyNotification({
            notifyAt: new Date(reminder.notify_at_time),
            title: reminder.title,
            notes: reminder.notes,
            reminderId: reminder.id,
          });

        case "weekly":
          return setWeeklyNotification({
            notifyAt: new Date(reminder.notify_at_time),
            title: reminder.title,
            notes: reminder.notes,
            weekdays: reminder.weekdays,
            reminderId: reminder.id,
          });

        case "one-time": {
          const notifyAt = new Date(reminder.notify_at_time);

          if (notifyAt <= new Date()) {
            return; // do NOT schedule past one-time reminders
          }

          return setOneTimeNotification({
            notifyAt,
            title: reminder.title,
            notes: reminder.notes,
            reminderId: reminder.id,
          });
        }
      }
    })
  );

  return true;
}
