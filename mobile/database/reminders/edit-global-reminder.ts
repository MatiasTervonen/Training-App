import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

type EditGlobalReminderParams = {
  id: string;
  title: string;
  notes: string;
  notify_at: string;
  seen_at: string;
  updated_at: string;
  delivered: boolean;
  mode: "alarm" | "normal";
};

export async function editGlobalReminder({
  id,
  title,
  notes,
  notify_at,
  seen_at,
  updated_at,
  delivered,
  mode,
}: EditGlobalReminderParams) {
  const { data, error } = await supabase.rpc("reminders_edit_global_reminder", {
    p_id: id,
    p_title: title,
    p_notes: notes,
    p_notify_at: notify_at,
    p_seen_at: seen_at,
    p_updated_at: updated_at,
    p_delivered: delivered,
    p_mode: mode,
  });

  if (error) {
    console.log("Error editing global reminder:", error);
    handleError(error, {
      message: "Error updating global reminder",
      route: "/database/reminders/edit-global-reminder",
      method: "POST",
    });
    throw new Error("Error updating global reminder");
  }

  return data;
}
