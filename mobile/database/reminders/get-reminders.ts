import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function GetReminders() {
  const { data: reminders, error: remindersError } = await supabase
    .from("global_reminders")
    .select("*");

  if (remindersError) {
    handleError(remindersError, {
      message: "Error getting global reminders",
      route: "/database/reminders/get-global-reminders",
      method: "GET",
    });
    throw new Error("Error getting global reminders");
  }

  const { data: localReminders, error: localRemindersError } = await supabase
    .from("local_reminders")
    .select("*");

  if (localRemindersError) {
    handleError(localRemindersError, {
      message: "Error getting local reminders",
      route: "/database/reminders/get-local-reminders",
      method: "GET",
    });
    throw new Error("Error getting local reminders");
  }

  const combinedReminders = [...reminders, ...localReminders];

  return combinedReminders;
}
