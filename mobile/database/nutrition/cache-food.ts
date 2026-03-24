import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type CacheFoodParams = {
  barcode: string;
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
  imageUrl: string | null;
};

export async function cacheFood(params: CacheFoodParams): Promise<string> {
  const { data, error } = await supabase.rpc(
    "nutrition_upsert_food_from_barcode",
    {
      p_barcode: params.barcode,
      p_name: params.name,
      p_brand: params.brand,
      p_serving_size_g: params.servingSizeG,
      p_serving_description: params.servingDescription,
      p_calories_per_100g: params.caloriesPer100g,
      p_protein_per_100g: params.proteinPer100g,
      p_carbs_per_100g: params.carbsPer100g,
      p_fat_per_100g: params.fatPer100g,
      p_fiber_per_100g: params.fiberPer100g,
      p_sugar_per_100g: params.sugarPer100g,
      p_sodium_per_100g: params.sodiumPer100g,
      p_saturated_fat_per_100g: params.saturatedFatPer100g,
      p_image_url: params.imageUrl,
    },
  );

  if (error) {
    handleError(error, {
      message: "Error caching food",
      route: "/database/nutrition/cache-food",
      method: "POST",
    });
    throw new Error("Error caching food");
  }

  return data as string;
}
