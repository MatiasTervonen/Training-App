import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type FavoriteFood = {
  id: string;
  food_id: string | null;
  custom_food_id: string | null;
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
  is_custom: boolean;
};

type FoodJoin = {
  id: string;
  name: string;
  brand: string | null;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  saturated_fat_per_100g: number | null;
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
  saturated_fat_per_100g: number | null;
  serving_size_g: number | null;
  serving_description: string | null;
};

type FavoriteRow = {
  id: string;
  food_id: string | null;
  custom_food_id: string | null;
  foods: FoodJoin | null;
  custom_foods: CustomFoodJoin | null;
};

export async function getFavorites(): Promise<FavoriteFood[]> {
  const { data, error } = await supabase
    .from("favorite_foods")
    .select(
      "id, food_id, custom_food_id, foods(id, name, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, saturated_fat_per_100g, serving_size_g, serving_description, image_url, barcode), custom_foods(id, name, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, saturated_fat_per_100g, serving_size_g, serving_description)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    handleError(error, {
      message: "Error getting favorites",
      route: "/database/nutrition/get-favorites",
      method: "GET",
    });
    throw new Error("Error getting favorites");
  }

  if (!data) return [];

  return (data as unknown as FavoriteRow[])
    .map((row): FavoriteFood | null => {
      const food = row.foods;
      const customFood = row.custom_foods;

      if (food) {
        return {
          id: row.id,
          food_id: row.food_id,
          custom_food_id: null,
          name: food.name,
          brand: food.brand,
          calories_per_100g: food.calories_per_100g,
          protein_per_100g: food.protein_per_100g,
          carbs_per_100g: food.carbs_per_100g,
          fat_per_100g: food.fat_per_100g,
          serving_size_g: food.serving_size_g,
          serving_description: food.serving_description,
          image_url: food.image_url,
          barcode: food.barcode,
          is_custom: false,
        };
      }

      if (customFood) {
        return {
          id: row.id,
          food_id: null,
          custom_food_id: row.custom_food_id,
          name: customFood.name,
          brand: customFood.brand,
          calories_per_100g: customFood.calories_per_100g,
          protein_per_100g: customFood.protein_per_100g,
          carbs_per_100g: customFood.carbs_per_100g,
          fat_per_100g: customFood.fat_per_100g,
          serving_size_g: customFood.serving_size_g,
          serving_description: customFood.serving_description,
          image_url: null,
          barcode: null,
          is_custom: true,
        };
      }

      return null;
    })
    .filter((item): item is FavoriteFood => item !== null);
}
