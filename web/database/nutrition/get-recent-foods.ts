import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import type { RecentFood } from "@/types/nutrition";

type FoodJoin = {
  id: string;
  name: string;
  brand: string | null;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  serving_size_g: number | null;
  serving_description: string | null;
  image_url: string | null;
  barcode: string | null;
};

type CustomFoodJoin = {
  id: string;
  name: string;
  brand: string | null;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  serving_size_g: number | null;
  serving_description: string | null;
};

type FoodLogRow = {
  food_id: string | null;
  custom_food_id: string | null;
  foods: FoodJoin | null;
  custom_foods: CustomFoodJoin | null;
};

export async function getRecentFoods(): Promise<RecentFood[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("food_logs")
    .select(
      "food_id, custom_food_id, foods(id, name, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_size_g, serving_description, image_url, barcode), custom_foods(id, name, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_size_g, serving_description)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    handleError(error, {
      message: "Error getting recent foods",
      route: "/database/nutrition/get-recent-foods",
      method: "GET",
    });
    throw new Error("Error getting recent foods");
  }

  if (!data) return [];

  const seen = new Set<string>();
  const results: RecentFood[] = [];

  for (const row of data as unknown as FoodLogRow[]) {
    const food = row.foods;
    const customFood = row.custom_foods;

    const key = row.food_id ?? row.custom_food_id;
    if (!key || seen.has(key)) continue;
    seen.add(key);

    if (food) {
      results.push({
        food_id: row.food_id,
        custom_food_id: null,
        name: food.name,
        brand: food.brand,
        calories_per_100g: food.calories_per_100g ?? 0,
        protein_per_100g: food.protein_per_100g ?? 0,
        carbs_per_100g: food.carbs_per_100g ?? 0,
        fat_per_100g: food.fat_per_100g ?? 0,
        serving_size_g: food.serving_size_g ?? 100,
        serving_description: food.serving_description,
        image_url: food.image_url,
        barcode: food.barcode,
        is_custom: false,
      });
    } else if (customFood) {
      results.push({
        food_id: null,
        custom_food_id: row.custom_food_id,
        name: customFood.name,
        brand: customFood.brand,
        calories_per_100g: customFood.calories_per_100g ?? 0,
        protein_per_100g: customFood.protein_per_100g ?? 0,
        carbs_per_100g: customFood.carbs_per_100g ?? 0,
        fat_per_100g: customFood.fat_per_100g ?? 0,
        serving_size_g: customFood.serving_size_g ?? 100,
        serving_description: customFood.serving_description,
        image_url: null,
        barcode: null,
        is_custom: true,
      });
    }

    if (results.length >= 20) break;
  }

  return results;
}
