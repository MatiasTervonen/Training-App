import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function GetReminders() {
  const { data: reminders, error: remindersError } = await supabase
    .from("reminders")
    .select("*");

  if (remindersError) {
    handleError(remindersError, {
      message: "Error getting reminders",
      route: "/api/reminders/get-reminders",
      method: "GET",
    });
    throw new Error("Error getting reminders");
  }

  const { data: customReminders, error: customRemindersError } = await supabase
    .from("custom_reminders")
    .select("*");

  if (customRemindersError) {
    handleError(customRemindersError, {
      message: "Error getting custom reminders",
      route: "/database/reminders/get-reminders",
      method: "GET",
    });
    throw new Error("Error getting custom reminders");
  }

  const combinedReminders = [...reminders, ...customReminders];

  return combinedReminders;
}
