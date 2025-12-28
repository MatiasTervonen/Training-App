import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

type SaveGlobalReminderParams = {
  title: string;
  notes: string;
  notify_at: string | null;
  type: "global";
};

export default async function SaveGlobalReminder({
  title,
  notes,
  notify_at,
  type,
}: SaveGlobalReminderParams) {
  const { error } = await supabase.rpc("reminders_save_global_reminder", {
    p_title: title,
    p_notes: notes,
    p_notify_at: notify_at,
    p_type: type,
  });

  if (error) {
    console.log(error);
    handleError(error, {
      message: "Error saving global reminders",
      route: "/database/reminders/save-global-reminder",
      method: "POST",
    });
    throw new Error("Error saving global reminders");
  }

  return { success: true };
}
