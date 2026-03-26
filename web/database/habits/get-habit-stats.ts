import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import { getTrackingDate } from "@/lib/formatDate";
import { HabitStats } from "@/types/habit";

export async function getHabitStats(habitId: string): Promise<HabitStats> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("habit_get_stats", {
    p_habit_id: habitId,
    p_date: getTrackingDate(),
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
