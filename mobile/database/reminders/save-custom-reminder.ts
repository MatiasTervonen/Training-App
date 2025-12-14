import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

type SaveReminderParams = {
  title: string;
  notes: string;
  notify_at_time: string | null;
  notify_date: Date | null;
  weekdays: number[];
  type: "weekly" | "daily" | "one-time";
  notification_id: string[] | string;
};

export default async function SaveCustomReminder({
  title,
  notes,
  notify_at_time,
  weekdays,
  notify_date,
  type,
  notification_id,
}: SaveReminderParams) {
  const { data, error } = await supabase
    .from("custom_reminders")
    .insert([
      {
        title,
        notes,
        notify_at_time,
        notify_date,
        weekdays,
        type,
        notification_id,
      },
    ])
    .select("id")
    .single();

  if (error) {
    handleError(error, {
      message: "Error saving custom reminders",
      route: "/database/reminders/save-custom-reminder",
      method: "POST",
    });
    throw new Error("Error saving custom reminders");
  }

  return data;
}
