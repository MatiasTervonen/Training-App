import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type LogFoodParams = {
  foodId?: string;
  customFoodId?: string;
  foodName: string;
  mealType: string;
  servingSizeG: number;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string; // YYYY-MM-DD
  notes?: string;
  mealTime?: string; // HH:MM
};

export async function logFood(params: LogFoodParams): Promise<string> {
  const { data, error } = await supabase.rpc("nutrition_log_food", {
    p_food_id: params.foodId,
    p_custom_food_id: params.customFoodId,
    p_food_name: params.foodName,
    p_meal_type: params.mealType,
    p_serving_size_g: params.servingSizeG,
    p_quantity: params.quantity,
    p_calories: params.calories,
    p_protein: params.protein,
    p_carbs: params.carbs,
    p_fat: params.fat,
    p_logged_at: params.loggedAt,
    p_notes: params.notes,
    p_meal_time: params.mealTime,
  });

  if (error) {
    handleError(error, {
      message: "Error logging food",
      route: "/database/nutrition/log-food",
      method: "POST",
    });
    throw new Error("Error logging food");
  }

  return data as string;
}
