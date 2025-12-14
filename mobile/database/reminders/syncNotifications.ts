import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";
import * as Notifications from "expo-notifications";

export default async function SyncNotifications() {
  console.log("Syncing notifications");

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  const { data, error: customRemindersError } = await supabase
    .from("custom_reminders")
    .select("notification_id");

  if (customRemindersError) {
    handleError(customRemindersError, {
      message: "Error getting custom reminders notification ids",
      route: "/database/reminders/syncNotifications",
      method: "GET",
    });
    throw false;
  }

  const validIds = new Set(
    data?.flatMap((r) => {
      const id = r.notification_id;

      if (Array.isArray(id)) return id;
      if (typeof id === "string") return [id];
      return [];
    })
  );

  for (const notification of scheduled) {
    if (!validIds.has(notification.identifier)) {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier
      );
    }
  }

  return true;
}
