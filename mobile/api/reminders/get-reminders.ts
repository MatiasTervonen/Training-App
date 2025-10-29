import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function GetReminders() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { data: reminders, error: remindersError } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", session.user.id);

  if (remindersError) {
    handleError(remindersError, {
      message: "Error getting reminders",
      route: "/api/reminders/get-reminders",
      method: "GET",
    });
    throw new Error(remindersError?.message);
  }

  const { data: customReminders, error: customRemindersError } = await supabase
    .from("custom_reminders")
    .select("*")
    .eq("user_id", session.user.id);

  if (customRemindersError) {
    handleError(customRemindersError, {
      message: "Error getting custom reminders",
      route: "/api/reminders/get-reminders",
      method: "GET",
    });
    throw new Error(customRemindersError?.message);
  }

  const combinedReminders = [...reminders, ...customReminders];

  return combinedReminders;
}
