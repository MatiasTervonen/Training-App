import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

type EditReminderParams = {
  id: string;
  title: string;
  notes: string;
  notify_at: string | null;
};

export default async function EditReminder({
  id,
  title,
  notes,
  notify_at,
}: EditReminderParams) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("reminders")
    .update({ title, notes, notify_at })
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) {
    handleError(error, {
      message: "Error updating reminder",
      route: "/api/reminders/edit-reminders",
      method: "POST",
    });
    throw new Error(error.message);
  }

  return { success: true };
}
