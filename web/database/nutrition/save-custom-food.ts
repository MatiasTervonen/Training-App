import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

type CustomFoodInput = {
  name: string;
  brand: string | null;
  servingSizeG: number;
  servingDescription: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
  sugarPer100g: number | null;
  sodiumPer100g: number | null;
  saturatedFatPer100g: number | null;
};

export async function saveCustomFood(input: CustomFoodInput) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("custom_foods")
    .insert({
      name: input.name,
      brand: input.brand,
      serving_size_g: input.servingSizeG,
      serving_description: input.servingDescription,
      calories_per_100g: input.caloriesPer100g,
      protein_per_100g: input.proteinPer100g,
      carbs_per_100g: input.carbsPer100g,
      fat_per_100g: input.fatPer100g,
      fiber_per_100g: input.fiberPer100g,
      sugar_per_100g: input.sugarPer100g,
      sodium_per_100g: input.sodiumPer100g,
      saturated_fat_per_100g: input.saturatedFatPer100g,
    })
    .select()
    .single();

  if (error) {
    handleError(error, {
      message: "Error saving custom food",
      route: "/database/nutrition/save-custom-food",
      method: "POST",
    });
    throw new Error("Error saving custom food");
  }

  return data;
}
