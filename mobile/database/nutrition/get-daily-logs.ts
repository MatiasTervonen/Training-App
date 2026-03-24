import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type DailyFoodLog = {
  id: string;
  food_name: string;
  brand: string | null;
  meal_type: string;
  serving_size_g: number;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes: string | null;
  is_custom: boolean;
  food_id: string | null;
  custom_food_id: string | null;
  created_at: string;
};

export async function getDailyLogs(date: string): Promise<DailyFoodLog[]> {
  const { data, error } = await supabase.rpc("nutrition_get_daily_logs", {
    p_date: date,
  });

  if (error) {
    handleError(error, {
      message: "Error getting daily logs",
      route: "/database/nutrition/get-daily-logs",
      method: "GET",
    });
    throw new Error("Error getting daily logs");
  }

  return (data ?? []) as DailyFoodLog[];
}
