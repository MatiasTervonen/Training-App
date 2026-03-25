import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type SavedMealItem = {
  id: string;
  food_id: string | null;
  custom_food_id: string | null;
  serving_size_g: number;
  quantity: number;
  sort_order: number;
  food_name: string;
  brand: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  is_custom: boolean;
  image_url: string | null;
};

export type SavedMeal = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string | null;
  items: SavedMealItem[];
};

export async function getSavedMeals(): Promise<SavedMeal[]> {
  const { data, error } = await supabase.rpc("nutrition_get_saved_meals");

  if (error) {
    handleError(error, {
      message: "Error getting saved meals",
      route: "/database/nutrition/get-saved-meals",
      method: "GET",
    });
    throw new Error("Error getting saved meals");
  }

  return (data ?? []) as SavedMeal[];
}
