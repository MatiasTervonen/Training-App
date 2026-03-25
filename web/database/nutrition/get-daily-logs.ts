import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import type { DailyFoodLog } from "@/types/nutrition";

export async function getDailyLogs(date: string): Promise<DailyFoodLog[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("nutrition_get_daily_logs", {
    p_date: date,
  });

  if (error) {
    handleError(error, {
      message: "Error getting daily food logs",
      route: "/database/nutrition/get-daily-logs",
      method: "GET",
    });
    throw new Error("Error getting daily food logs");
  }

  return (data ?? []) as DailyFoodLog[];
}
