import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import i18n from "@/app/lib/i18n/i18n";
import type { FoodSearchResult } from "@/types/nutrition";

export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  const supabase = createClient();
  const pattern = `%${query}%`;

  const [foodsResult, customFoodsResult] = await Promise.all([
    supabase
      .from("foods")
      .select(
        "id, name, name_en, brand, serving_size_g, serving_description, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g, saturated_fat_per_100g, image_url, nutrition_label_url, barcode",
      )
      .or(`name.ilike.${pattern},name_en.ilike.${pattern}`)
      .limit(20),
    supabase
      .from("custom_foods")
      .select(
        "id, name, brand, serving_size_g, serving_description, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g, saturated_fat_per_100g, image_url, nutrition_label_url",
      )
      .ilike("name", pattern)
      .limit(20),
  ]);

  if (foodsResult.error) {
    handleError(foodsResult.error, {
      message: "Error searching foods",
      route: "/database/nutrition/search-foods",
      method: "GET",
    });
    throw new Error("Error searching foods");
  }

  if (customFoodsResult.error) {
    handleError(customFoodsResult.error, {
      message: "Error searching custom foods",
      route: "/database/nutrition/search-foods",
      method: "GET",
    });
    throw new Error("Error searching custom foods");
  }

  const isFinnish = i18n.language === "fi";

  const foods: FoodSearchResult[] = (foodsResult.data ?? []).map((f) => ({
    id: f.id,
    name: isFinnish ? f.name : (f.name_en ?? f.name),
    brand: f.brand,
    serving_size_g: f.serving_size_g ?? 100,
    serving_description: f.serving_description,
    calories_per_100g: f.calories_per_100g ?? 0,
    protein_per_100g: f.protein_per_100g ?? 0,
    carbs_per_100g: f.carbs_per_100g ?? 0,
    fat_per_100g: f.fat_per_100g ?? 0,
    fiber_per_100g: f.fiber_per_100g,
    sugar_per_100g: f.sugar_per_100g,
    sodium_per_100g: f.sodium_per_100g,
    saturated_fat_per_100g: f.saturated_fat_per_100g,
    image_url: f.image_url,
    nutrition_label_url: f.nutrition_label_url,
    is_custom: false,
    barcode: f.barcode,
  }));

  const customFoods: FoodSearchResult[] = (customFoodsResult.data ?? []).map(
    (f) => ({
      id: f.id,
      name: f.name,
      brand: f.brand,
      serving_size_g: f.serving_size_g ?? 100,
      serving_description: f.serving_description,
      calories_per_100g: f.calories_per_100g ?? 0,
      protein_per_100g: f.protein_per_100g ?? 0,
      carbs_per_100g: f.carbs_per_100g ?? 0,
      fat_per_100g: f.fat_per_100g ?? 0,
      fiber_per_100g: f.fiber_per_100g,
      sugar_per_100g: f.sugar_per_100g,
      sodium_per_100g: f.sodium_per_100g,
      saturated_fat_per_100g: f.saturated_fat_per_100g,
      image_url: f.image_url,
      nutrition_label_url: f.nutrition_label_url,
      is_custom: true,
      barcode: null,
    }),
  );

  return [...foods, ...customFoods];
}
