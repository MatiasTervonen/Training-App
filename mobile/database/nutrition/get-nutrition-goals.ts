import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type NutritionGoals = {
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  custom_meal_types: string[] | null;
  updated_at: string;
};

export async function getNutritionGoals(): Promise<NutritionGoals | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("nutrition_goals")
    .select("*")
    .eq("user_id", user.id)
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
