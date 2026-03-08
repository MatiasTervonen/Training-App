import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function markHabitDone(habitId: string, date: string) {
  const { error } = await supabase.from("habit_logs").insert({
    habit_id: habitId,
    completed_date: date,
  });

  // Ignore unique violation (23505) - already marked as done
  if (error && error.code !== "23505") {
    handleError(error, {
      message: "Error marking habit as done",
      route: "/database/habits/mark-habit-done",
      method: "POST",
    });
    throw new Error("Error marking habit as done");
  }

  // Update the feed item so the habit card reflects the new count
  await supabase.rpc("refresh_habit_feed", {
    p_date: date,
    p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}
