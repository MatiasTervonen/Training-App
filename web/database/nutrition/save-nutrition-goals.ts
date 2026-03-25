import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function saveNutritionGoals({
  calorieGoal,
  proteinGoal,
  carbsGoal,
  fatGoal,
  fiberGoal,
  sugarGoal,
  sodiumGoal,
  saturatedFatGoal,
  visibleNutrients,
  customMealTypes,
}: {
  calorieGoal: number;
  proteinGoal: number | null;
  carbsGoal: number | null;
  fatGoal: number | null;
  fiberGoal: number | null;
  sugarGoal: number | null;
  sodiumGoal: number | null;
  saturatedFatGoal: number | null;
  visibleNutrients: string[] | null;
  customMealTypes: string[] | null;
}) {
  const supabase = createClient();

  const { error } = await supabase.from("nutrition_goals").upsert(
    {
      calorie_goal: calorieGoal,
      protein_goal: proteinGoal,
      carbs_goal: carbsGoal,
      fat_goal: fatGoal,
      fiber_goal: fiberGoal,
      sugar_goal: sugarGoal,
      sodium_goal: sodiumGoal,
      saturated_fat_goal: saturatedFatGoal,
      visible_nutrients: visibleNutrients,
      custom_meal_types: customMealTypes,
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
