import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

type SaveGlobalReminderParams = {
  title: string;
  notes: string;
  notify_at: string | null;
  type: "global";
  created_from_device_id?: string | null;
  mode: "alarm" | "normal";
};

export async function saveGlobalReminder({
  title,
  notes,
  notify_at,
  type,
  created_from_device_id,
  mode,
}: SaveGlobalReminderParams) {
  const { data, error } = await supabase.rpc("reminders_save_global_reminder", {
    p_title: title,
    p_notes: notes,
    p_notify_at: notify_at,
    p_type: type,
    p_mode: mode,
    p_created_from_device_id: created_from_device_id ?? null,
  });

  if (error) {
    handleError(error, {
      message: "Error saving global reminders",
      route: "/database/reminders/save-global-reminder",
      method: "POST",
    });
    throw new Error("Error saving global reminders");
  }

  return { success: true, reminderId: data as string };
}
