import { createClient } from "@/utils/supabase/client";
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
  nutritionLabelUrl: string | null;
  source?: "openfoodfacts" | "usda" | "manual";
};

export async function saveSharedFood(params: CacheFoodParams): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "nutrition_upsert_food_from_barcode",
    {
      p_barcode: params.barcode,
      p_name: params.name,
      p_brand: params.brand ?? undefined,
      p_serving_size_g: params.servingSizeG,
      p_serving_description: params.servingDescription ?? undefined,
      p_calories_per_100g: params.caloriesPer100g,
      p_protein_per_100g: params.proteinPer100g,
      p_carbs_per_100g: params.carbsPer100g,
      p_fat_per_100g: params.fatPer100g,
      p_fiber_per_100g: params.fiberPer100g ?? undefined,
      p_sugar_per_100g: params.sugarPer100g ?? undefined,
      p_sodium_per_100g: params.sodiumPer100g ?? undefined,
      p_saturated_fat_per_100g: params.saturatedFatPer100g ?? undefined,
      p_image_url: params.imageUrl ?? undefined,
      p_nutrition_label_url: params.nutritionLabelUrl ?? undefined,
      p_source: params.source ?? "openfoodfacts",
    },
  );

  if (error) {
    handleError(error, {
      message: "Error saving shared food",
      route: "/database/nutrition/save-shared-food",
      method: "POST",
    });
    throw new Error("Error saving shared food");
  }

  return data as string;
}
