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
  const { error: remindersError } = await supabase
    .from("global_reminders")
    .insert([
      {
        title,
        notes,
        notify_at,
        type,
      },
    ]);

  if (remindersError) {
    console.log(remindersError);
    handleError(remindersError, {
      message: "Error saving global reminders",
      route: "/database/reminders/save-global-reminder",
      method: "POST",
    });
    throw new Error("Error saving global reminders");
  }

  return { success: true };
}
