import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type UpdateMealTimeParams = {
  loggedAt: string; // YYYY-MM-DD
  mealType: string;
  mealTime: string; // HH:MM
};

export async function updateMealTime(params: UpdateMealTimeParams): Promise<void> {
  const { error } = await supabase.rpc("nutrition_update_meal_time", {
    p_logged_at: params.loggedAt,
    p_meal_type: params.mealType,
    p_meal_time: params.mealTime,
  });

  if (error) {
    handleError(error, {
      message: "Error updating meal time",
      route: "/database/nutrition/update-meal-time",
      method: "POST",
    });
    throw new Error("Error updating meal time");
  }
}
