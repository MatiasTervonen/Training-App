import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getHabitLogs({
  startDate,
  endDate,
  habitId,
}: {
  startDate: string;
  endDate: string;
  habitId?: string;
}) {
  let query = supabase
    .from("habit_logs")
    .select("habit_id, completed_date")
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

  return data ?? [];
}
