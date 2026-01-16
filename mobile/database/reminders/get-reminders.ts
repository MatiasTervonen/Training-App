import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export async function getReminders() {
  const { data: GlobalReminders, error: GlobalRemindersError } = await supabase
    .from("global_reminders")
    .select("");

  if (GlobalRemindersError) {
    handleError(GlobalRemindersError, {
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

  const combinedReminders = [...GlobalReminders, ...localReminders];

  return combinedReminders;
}
