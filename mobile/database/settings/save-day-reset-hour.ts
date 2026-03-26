import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function saveDayResetHour(hour: number) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("user_settings")
    .update({ day_reset_hour: hour })
    .eq("user_id", session.user.id);

  if (error) {
    handleError(error, {
      message: "Error updating day reset hour",
      route: "/database/settings/save-day-reset-hour.ts",
      method: "POST",
    });
    throw new Error("Error updating day reset hour");
  }

  return true;
}
