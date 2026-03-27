import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export type DailyTotal = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorie_goal: number;
};

export type TopFood = {
  food_name: string;
  log_count: number;
  total_calories: number;
};

export type NutritionAnalytics = {
  daily_totals: DailyTotal[];
  top_foods: TopFood[];
};

export async function getNutritionAnalytics(
  startDate: string,
  endDate: string,
): Promise<NutritionAnalytics> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("nutrition_get_analytics", {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    handleError(error, {
      message: "Error getting nutrition analytics",
      route: "/database/nutrition/get-analytics",
      method: "GET",
    });
    throw new Error("Error getting nutrition analytics");
  }

  return (data ?? { daily_totals: [], top_foods: [] }) as NutritionAnalytics;
}
