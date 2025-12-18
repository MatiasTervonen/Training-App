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
  seen_at?: string | null;
  updated_at: string;
};

export default async function EditLocalReminder({
  id,
  title,
  notes,
  notify_at_time,
  notify_date,
  weekdays,
  type,
  updated_at,
}: EditLocalReminderParams) {
  const { error } = await supabase
    .from("local_reminders")
    .update({
      title,
      notes,
      notify_at_time,
      notify_date,
      weekdays,
      type,
      updated_at,
    })
    .eq("id", id);

  if (error) {
    handleError(error, {
      message: "Error updating local reminder",
      route: "/database/reminders/edit-reminders",
      method: "POST",
    });
    throw new Error("Error updating local reminder");
  }

  return { success: true };
}
