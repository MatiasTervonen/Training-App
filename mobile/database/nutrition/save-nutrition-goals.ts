import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type SaveNutritionGoalsParams = {
  calorieGoal: number;
  proteinGoal: number | null;
  carbsGoal: number | null;
  fatGoal: number | null;
  fiberGoal: number | null;
  sugarGoal: number | null;
  sodiumGoal: number | null;
  saturatedFatGoal: number | null;
  visibleNutrients: string[];
  customMealTypes: string[];
};

export async function saveNutritionGoals(params: SaveNutritionGoalsParams) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.from("nutrition_goals").upsert(
    {
      user_id: user.id,
      calorie_goal: params.calorieGoal,
      protein_goal: params.proteinGoal,
      carbs_goal: params.carbsGoal,
      fat_goal: params.fatGoal,
      fiber_goal: params.fiberGoal,
      sugar_goal: params.sugarGoal,
      sodium_goal: params.sodiumGoal,
      saturated_fat_goal: params.saturatedFatGoal,
      visible_nutrients: params.visibleNutrients,
      custom_meal_types: params.customMealTypes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    handleError(error, {
      message: "Error saving nutrition goals",
      route: "/database/nutrition/save-nutrition-goals",
      method: "POST",
    });
    throw new Error("Error saving nutrition goals");
  }
}
