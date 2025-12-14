import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function UpdateNotificationId(
  notificationId: string | string[],
  reminderId: string
) {
  const notificationIds = Array.isArray(notificationId)
    ? notificationId
    : typeof notificationId === "string"
    ? [notificationId]
    : [];

  const { data, error } = await supabase
    .from("custom_reminders")
    .update({ notification_id: notificationIds })
    .eq("id", reminderId)
    .select("id")
    .single();

  if (error) {
    handleError(error, {
      message: "Error updating notification id",
      route: "/database/reminders/update-notification-id",
      method: "GET",
    });
    throw new Error("Error updating notification id");
  }

  return data;
}
