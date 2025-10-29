import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function DeleteCustomReminder(reminderId: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error: remindersError } = await supabase
    .from("custom_reminders")
    .delete()
    .eq("id", reminderId)
    .eq("user_id", session.user.id);

  if (remindersError) {
    handleError(remindersError, {
      message: "Error getting reminders",
      route: "/api/reminders/get-reminders",
      method: "GET",
    });
    throw new Error(remindersError?.message);
  }

  return { success: true };
}
