import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type NutritionGoals = {
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  fiber_goal: number | null;
  sugar_goal: number | null;
  sodium_goal: number | null;
  saturated_fat_goal: number | null;
  visible_nutrients: string[] | null;
  custom_meal_types: string[] | null;
  calorie_ring_target: "goal" | "tdee";
  updated_at: string;
};

export async function getNutritionGoals(): Promise<NutritionGoals | null> {
  const { data, error } = await supabase
    .from("nutrition_goals")
    .select("*")
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;

    handleError(error, {
      message: "Error getting nutrition goals",
      route: "/database/nutrition/get-nutrition-goals",
      method: "GET",
    });
    throw new Error("Error getting nutrition goals");
  }

  return data as NutritionGoals;
}
