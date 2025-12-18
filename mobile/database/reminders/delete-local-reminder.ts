import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function DeleteCustomReminder(reminderId: string) {
  const { error: remindersError } = await supabase
    .from("local_reminders")
    .delete()
    .eq("id", reminderId);

  if (remindersError) {
    handleError(remindersError, {
      message: "Error deleting local reminders",
      route: "/database/reminders/delete-reminder",
      method: "GET",
    });
    throw new Error("Error deleting local reminders");
  }

  return { success: true };
}
