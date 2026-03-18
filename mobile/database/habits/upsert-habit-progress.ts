import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function upsertHabitProgress(
  habitId: string,
  date: string,
  accumulatedSeconds: number,
) {
  const { error } = await supabase.from("habit_logs").upsert(
    {
      habit_id: habitId,
      completed_date: date,
      accumulated_seconds: accumulatedSeconds,
    },
    { onConflict: "habit_id,completed_date" },
  );

  if (error) {
    console.error("Error updating habit progress:", error);
    handleError(error, {
      message: "Error updating habit progress",
      route: "/database/habits/upsert-habit-progress",
      method: "POST",
    });
    throw new Error("Error updating habit progress");
  }
}
