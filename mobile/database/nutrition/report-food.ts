import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type ReportFoodParams = {
  foodId: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  saturatedFatPer100g?: number | null;
  sugarPer100g?: number | null;
  fiberPer100g?: number | null;
  sodiumPer100g?: number | null;
};

export async function reportFood(params: ReportFoodParams): Promise<string> {
  const { data, error } = await supabase.rpc("nutrition_report_food", {
    p_food_id: params.foodId,
    p_calories_per_100g: params.caloriesPer100g,
    p_protein_per_100g: params.proteinPer100g,
    p_carbs_per_100g: params.carbsPer100g,
    p_fat_per_100g: params.fatPer100g,
    p_saturated_fat_per_100g: params.saturatedFatPer100g ?? null,
    p_sugar_per_100g: params.sugarPer100g ?? null,
    p_fiber_per_100g: params.fiberPer100g ?? null,
    p_sodium_per_100g: params.sodiumPer100g ?? null,
  });
  if (error) {
    handleError(error, { context: "reportFood" });
    throw error;
  }
  return data as string;
}
