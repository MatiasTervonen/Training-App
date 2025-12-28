import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function DeleteLocalReminder(reminderId: string) {
  const { error } = await supabase.rpc("reminders_delete_local_reminder", {
    p_id: reminderId,
  });

  if (error) {
    handleError(error, {
      message: "Error deleting local reminder",
      route: "/database/reminders/delete-local-reminder",
      method: "DELETE",
    });
    throw new Error("Error deleting local reminder");
  }

  return { success: true };
}
