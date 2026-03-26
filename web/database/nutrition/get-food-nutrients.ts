import { createClient } from "@/utils/supabase/client";

export type FoodNutrient = {
  nutrient_code: string;
  value: number;
  unit: string;
};

export async function getFoodNutrients(
  foodId: string,
): Promise<FoodNutrient[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("food_nutrients")
    .select("nutrient_code, value, unit")
    .eq("food_id", foodId);

  if (error) return [];
  return data ?? [];
}
