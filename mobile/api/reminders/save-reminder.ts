import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

type SaveReminderParams = {
  title: string;
  notes: string;
  notify_at: string | null;
};

export default async function SaveReminder({
  title,
  notes,
  notify_at,
}: SaveReminderParams) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error: remindersError } = await supabase
    .from("reminders")
    .insert([
      {
        user_id: session.user.id,
        title,
        notes,
        notify_at,
      },
    ])
  

  if (remindersError) {
    handleError(remindersError, {
      message: "Error saving reminders",
      route: "/api/reminders/save-reminders",
      method: "POST",
    });
    throw new Error(remindersError?.message);
  }

  return { success: true };
}
