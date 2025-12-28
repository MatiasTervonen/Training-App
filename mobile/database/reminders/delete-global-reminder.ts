import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function DeleteGlobalReminder(reminderId: string) {
  const { error } = await supabase.rpc("reminders_delete_global_reminder", {
    p_id: reminderId,
  });

  if (error) {
    console.log("error deleting global reminder", error);
    handleError(error, {
      message: "Error deleting global reminder",
      route: "/database/reminders/delete-global-reminder",
      method: "DELETE",
    });
    throw new Error("Error deleting global reminders");
  }

  return { success: true };
}
