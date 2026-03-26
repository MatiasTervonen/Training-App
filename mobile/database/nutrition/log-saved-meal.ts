import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type LogSavedMealParams = {
  savedMealId: string;
  mealType: string;
  loggedAt: string;
  mealTime?: string; // HH:MM
};

export async function logSavedMeal(params: LogSavedMealParams): Promise<void> {
  const { error } = await supabase.rpc("nutrition_log_saved_meal", {
    p_saved_meal_id: params.savedMealId,
    p_meal_type: params.mealType,
    p_logged_at: params.loggedAt,
    p_meal_time: params.mealTime,
  });

  if (error) {
    handleError(error, {
      message: "Error logging saved meal",
      route: "/database/nutrition/log-saved-meal",
      method: "POST",
    });
    throw new Error("Error logging saved meal");
  }
}
