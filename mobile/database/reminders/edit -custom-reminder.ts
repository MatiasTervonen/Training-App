import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

type EditReminderParams = {
  id: string;
  title: string | null | undefined;
  notes: string | null | undefined;
  notify_at_time: string | null;
  notify_date: Date | null;
  weekdays: number[];
  type: "weekly" | "daily" | "one-time";
  notification_id: string[] | string;
  delivered?: boolean;
  updated_at: string;
};

export default async function EditCustomReminderData({
  id,
  title,
  notes,
  notify_at_time,
  notify_date,
  weekdays,
  type,
  notification_id,
  updated_at,
}: EditReminderParams) {


  const { error } = await supabase
    .from("custom_reminders")
    .update({ title, notes, notify_at_time, notify_date, weekdays, type, notification_id, updated_at })
    .eq("id", id)


  if (error) {
    handleError(error, {
      message: "Error updating reminder",
      route: "/database/reminders/edit-reminders",
      method: "POST",
    });
    throw new Error("Error updating reminder");
  }

  return { success: true };
}