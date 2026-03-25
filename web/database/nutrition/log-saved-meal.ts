import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

type LogSavedMealParams = {
  savedMealId: string;
  mealType: string;
  loggedAt: string;
};

export async function logSavedMeal(params: LogSavedMealParams) {
  const supabase = createClient();

  const { error } = await supabase.rpc("nutrition_log_saved_meal", {
    p_saved_meal_id: params.savedMealId,
    p_meal_type: params.mealType,
    p_logged_at: params.loggedAt,
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
