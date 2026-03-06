import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { HabitStats } from "@/types/habit";

export async function getHabitStats(habitId: string): Promise<HabitStats> {
  const { data, error } = await supabase.rpc("habit_get_stats", {
    p_habit_id: habitId,
  });

  if (error || !data) {
    handleError(error, {
      message: "Error getting habit stats",
      route: "/database/habits/get-habit-stats",
      method: "GET",
    });
    throw new Error("Error getting habit stats");
  }

  return data as HabitStats;
}
