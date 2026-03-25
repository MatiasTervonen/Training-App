import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

type SaveMealItem = {
  food_id: string | null;
  custom_food_id: string | null;
  serving_size_g: number;
  quantity: number;
  sort_order: number;
};

type SaveMealParams = {
  mealId?: string;
  name: string;
  items: SaveMealItem[];
};

export async function saveMeal(params: SaveMealParams): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("nutrition_save_meal", {
    p_meal_id: params.mealId ?? undefined,
    p_name: params.name,
    p_items: params.items,
  });

  if (error) {
    handleError(error, {
      message: "Error saving meal",
      route: "/database/nutrition/save-meal",
      method: "POST",
    });
    throw new Error("Error saving meal");
  }

  return data as string;
}
