import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function toggleHabitLog({
  habitId,
  date,
}: {
  habitId: string;
  date: string;
}) {
  const { data, error } = await supabase.rpc("habit_toggle_log", {
    p_habit_id: habitId,
    p_date: date,
    p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  if (error) {
    handleError(error, {
      message: "Error toggling habit log",
      route: "/database/habits/toggle-habit-log",
      method: "POST",
    });
    throw new Error("Error toggling habit log");
  }

  return data as boolean;
}
