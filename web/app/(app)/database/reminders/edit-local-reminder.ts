import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/client";

type EditLocalReminderParams = {
  id: string;
  title: string;
  notes: string;
  notify_at_time: string;
  notify_date: string;
  weekdays: number[];
  type: "weekly" | "daily" | "one-time";
  seen_at: string;
  updated_at: string;
};

export async function editLocalReminder({
  id,
  title,
  notes,
  notify_at_time,
  notify_date,
  weekdays,
  type,
  updated_at,
  seen_at,
}: EditLocalReminderParams) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("reminders_edit_local_reminder", {
    p_id: id,
    p_title: title,
    p_notes: notes,
    p_notify_at_time: notify_at_time,
    p_notify_date: notify_date,
    p_weekdays: weekdays,
    p_type: type,
    p_updated_at: updated_at,
    p_seen_at: seen_at,
  });

  if (error) {
    console.log("error updating local reminder", error);
    handleError(error, {
      message: "Error updating local reminder",
      route: "/database/reminders/edit-reminders",
      method: "POST",
    });
    throw new Error("Error updating local reminder");
  }

  return data;
}
