import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

type SaveReminderParams = {
  title: string;
  notes: string;
  notify_at_time: string | null;
  notify_date: Date | string | null;
  weekdays: number[];
  type: "weekly" | "daily" | "one-time";
};

export default async function SaveLocalReminder({
  title,
  notes,
  notify_at_time,
  weekdays,
  notify_date,
  type,
}: SaveReminderParams) {
  const { data, error } = await supabase
    .from("local_reminders")
    .insert([
      {
        title,
        notes,
        notify_at_time,
        notify_date,
        weekdays,
        type,
      },
    ])
    .select("id")
    .single();

  console.log("save local reminder data", data);

  if (error) {
    console.log("save local reminder error", error);
    handleError(error, {
      message: "Error saving local reminders",
      route: "/database/reminders/save-local-reminder",
      method: "POST",
    });
    throw new Error("Error saving local reminders");
  }

  return data;
}
