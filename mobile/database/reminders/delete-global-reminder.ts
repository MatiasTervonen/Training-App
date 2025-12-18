import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function DeleteGlobalReminder(reminderId: string) {
  const { error: remindersError } = await supabase
    .from("global_reminders")
    .delete()
    .eq("id", reminderId);

  if (remindersError) {
    handleError(remindersError, {
      message: "Error deleting global reminders",
      route: "/database/reminders/delete-global-reminder",
      method: "DELETE",
    });
    throw new Error("Error deleting global reminders");
  }

  return { success: true };
}
