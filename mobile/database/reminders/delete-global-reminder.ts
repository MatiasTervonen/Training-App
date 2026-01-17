import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export async function deleteGlobalReminder(reminderId: string) {
  const { error } = await supabase.rpc("reminders_delete_global_reminder", {
    p_id: reminderId,
  });

  if (error) {
    handleError(error, {
      message: "Error deleting global reminder",
      route: "/database/reminders/delete-global-reminder",
      method: "DELETE",
    });
    throw new Error("Error deleting global reminders");
  }

  return { success: true };
}
