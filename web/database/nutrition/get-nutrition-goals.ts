import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import type { NutritionGoals } from "@/types/nutrition";

export async function getNutritionGoals(): Promise<NutritionGoals | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("nutrition_goals")
    .select(
      "calorie_goal, protein_goal, carbs_goal, fat_goal, fiber_goal, sugar_goal, sodium_goal, saturated_fat_goal, visible_nutrients, custom_meal_types, updated_at"
    )
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    handleError(error, {
      message: "Error getting nutrition goals",
      route: "/database/nutrition/get-nutrition-goals",
      method: "GET",
    });
    throw new Error("Error getting nutrition goals");
  }

  return data as NutritionGoals;
}
