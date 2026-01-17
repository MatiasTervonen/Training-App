import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

type EditLocalReminderParams = {
  id: string;
  title: string | null | undefined;
  notes: string | null | undefined;
  notify_at_time: string | null;
  notify_date: Date | null;
  weekdays: number[];
  type: "weekly" | "daily" | "one-time";
  seen_at: string | null;
  updated_at: string;
  mode?: "alarm" | "normal";
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
  mode,
}: EditLocalReminderParams) {
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
    p_mode: mode,
  });

  if (error) {
    handleError(error, {
      message: "Error updating local reminder",
      route: "/database/reminders/edit-reminders",
      method: "POST",
    });
    throw new Error("Error updating local reminder");
  }

  return data;
}
