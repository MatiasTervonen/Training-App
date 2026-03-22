import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import { HabitLog } from "@/types/habit";

export async function getHabitLogs({
  startDate,
  endDate,
  habitId,
}: {
  startDate: string;
  endDate: string;
  habitId?: string;
}): Promise<HabitLog[]> {
  const supabase = createClient();

  let query = supabase
    .from("habit_logs")
    .select("habit_id, completed_date, accumulated_seconds")
    .gte("completed_date", startDate)
    .lte("completed_date", endDate);

  if (habitId) {
    query = query.eq("habit_id", habitId);
  }

  const { data, error } = await query;

  if (error) {
    handleError(error, {
      message: "Error getting habit logs",
      route: "/database/habits/get-habit-logs",
      method: "GET",
    });
    throw new Error("Error getting habit logs");
  }

  return (data ?? []) as HabitLog[];
}
