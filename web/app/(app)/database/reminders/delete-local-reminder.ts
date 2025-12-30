import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/client";

export async function deleteLocalReminder(reminderId: string) {
  const supabase = createClient();
  
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
