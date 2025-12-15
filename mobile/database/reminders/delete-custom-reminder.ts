import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function DeleteCustomReminder(reminderId: string) {
  const { error: remindersError } = await supabase
    .from("custom_reminders")
    .delete()
    .eq("id", reminderId);

  if (remindersError) {
    handleError(remindersError, {
      message: "Error deleting custom reminders",
      route: "/database/reminders/delete-custom-reminder",
      method: "GET",
    });
    throw new Error("Error deleting custom reminders");
  }

  return { success: true };
}
