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
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error: remindersError } = await supabase
    .from("custom_reminders")
    .insert([
      {
        user_id: session.user.id,
        title,
        notes,
        notify_at_time,
        notify_date,
        weekdays,
        type,
        notification_id,
      },
    ]);

  if (remindersError) {
    handleError(remindersError, {
      message: "Error saving reminders",
      route: "/database/reminders/save-reminders",
      method: "POST",
    });
  throw new Error("Error saving reminders");
  }

  return { success: true };
}
