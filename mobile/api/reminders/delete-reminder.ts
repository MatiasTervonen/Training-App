import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function DeleteReminders(reminderId: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error: remindersError } = await supabase
    .from("reminders")
    .delete()
    .eq("id", reminderId)
    .eq("user_id", session.user.id);

  if (remindersError) {
    handleError(remindersError, {
      message: "Error deleting reminders",
      route: "/database/reminders/delete-reminders",
      method: "DELETE",
    });
  throw new Error("Error deleting reminders");
  }

  return { success: true };
}
