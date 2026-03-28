import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import i18n from "@/app/i18n";

export type FoodSearchResult = {
  id: string;
  name: string;
  brand: string | null;
  serving_size_g: number | null;
  serving_description: string | null;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  fiber_per_100g: number | null;
  sugar_per_100g: number | null;
  sodium_per_100g: number | null;
  saturated_fat_per_100g: number | null;
  image_url: string | null;
  nutrition_label_url: string | null;
  is_custom: boolean;
  barcode: string | null;
  data_source: string | null;
};

export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  const pattern = `%${query}%`;

  const [foodsResult, customFoodsResult] = await Promise.all([
    supabase
      .from("foods")
      .select(
        "id, name, name_en, brand, serving_size_g, serving_description, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g, saturated_fat_per_100g, image_url, nutrition_label_url, barcode, source",
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
    serving_size_g: f.serving_size_g,
    serving_description: f.serving_description,
    calories_per_100g: f.calories_per_100g,
    protein_per_100g: f.protein_per_100g,
    carbs_per_100g: f.carbs_per_100g,
    fat_per_100g: f.fat_per_100g,
    fiber_per_100g: f.fiber_per_100g,
    sugar_per_100g: f.sugar_per_100g,
    sodium_per_100g: f.sodium_per_100g,
    saturated_fat_per_100g: f.saturated_fat_per_100g,
    image_url: f.image_url,
    nutrition_label_url: f.nutrition_label_url,
    is_custom: false,
    barcode: f.barcode,
    data_source: f.source ?? null,
  }));

  const customFoods: FoodSearchResult[] = (customFoodsResult.data ?? []).map(
    (f) => ({
      id: f.id,
      name: f.name,
      brand: f.brand,
      serving_size_g: f.serving_size_g,
      serving_description: f.serving_description,
      calories_per_100g: f.calories_per_100g,
      protein_per_100g: f.protein_per_100g,
      carbs_per_100g: f.carbs_per_100g,
      fat_per_100g: f.fat_per_100g,
      fiber_per_100g: f.fiber_per_100g,
      sugar_per_100g: f.sugar_per_100g,
      sodium_per_100g: f.sodium_per_100g,
      saturated_fat_per_100g: f.saturated_fat_per_100g,
      image_url: f.image_url,
      nutrition_label_url: f.nutrition_label_url,
      is_custom: true,
      barcode: null,
      data_source: null,
    }),
  );

  return [...foods, ...customFoods];
}
