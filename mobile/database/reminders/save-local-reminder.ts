import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

type SaveReminderParams = {
  title: string;
  notes: string;
  notify_at_time: string | null;
  notify_date: Date | string | null;
  weekdays: number[];
  type: "weekly" | "daily" | "one-time";
  mode?: "alarm" | "normal";
};

export async function saveLocalReminder({
  title,
  notes,
  notify_at_time,
  weekdays,
  notify_date,
  type,
  mode,
}: SaveReminderParams) {
  const { data, error } = await supabase.rpc("reminders_save_local_reminder", {
    p_title: title,
    p_notes: notes,
    p_notify_at_time: notify_at_time,
    p_weekdays: weekdays,
    p_notify_date: notify_date,
    p_type: type,
    p_mode: mode,
  });

  if (error) {
    console.log("save local reminder error", error);
    handleError(error, {
      message: "Error saving local reminders",
      route: "/database/reminders/save-local-reminder",
      method: "POST",
    });
    throw new Error("Error saving local reminders");
  }

  console.log("data", data);
  return data;
}
