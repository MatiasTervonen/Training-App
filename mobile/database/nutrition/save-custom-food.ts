import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import * as Crypto from "expo-crypto";

type SaveCustomFoodParams = {
  name: string;
  brand: string | null;
  servingSizeG: number;
  servingDescription: string | null;
  caloriesPer100g: number;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  fiberPer100g: number | null;
  sugarPer100g: number | null;
  sodiumPer100g: number | null;
  saturatedFatPer100g: number | null;
  imageUri: string | null;
};

export type CustomFood = {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  serving_size_g: number;
  serving_description: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number | null;
  sugar_per_100g: number | null;
  sodium_per_100g: number | null;
  saturated_fat_per_100g: number | null;
  image_url: string | null;
  created_at: string;
};

async function uploadCustomFoodImage(uri: string): Promise<string | null> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const ext = uri.includes(".png") ? "png" : "jpg";
    const path = `custom/${Crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("food-images")
      .upload(path, blob, { contentType: `image/${ext === "png" ? "png" : "jpeg"}` });

    if (error) return null;

    const { data: urlData } = supabase.storage
      .from("food-images")
      .getPublicUrl(path);

    return urlData.publicUrl;
  } catch {
    return null;
  }
}

export async function saveCustomFood(
  params: SaveCustomFoodParams,
): Promise<CustomFood> {
  let imageUrl: string | null = null;
  if (params.imageUri) {
    imageUrl = await uploadCustomFoodImage(params.imageUri);
  }

  const { data, error } = await supabase
    .from("custom_foods")
    .insert({
      name: params.name,
      brand: params.brand,
      serving_size_g: params.servingSizeG,
      serving_description: params.servingDescription,
      calories_per_100g: params.caloriesPer100g,
      protein_per_100g: params.proteinPer100g,
      carbs_per_100g: params.carbsPer100g,
      fat_per_100g: params.fatPer100g,
      fiber_per_100g: params.fiberPer100g,
      sugar_per_100g: params.sugarPer100g,
      sodium_per_100g: params.sodiumPer100g,
      saturated_fat_per_100g: params.saturatedFatPer100g,
      image_url: imageUrl,
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

  return data as CustomFood;
}
