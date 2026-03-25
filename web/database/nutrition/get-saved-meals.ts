import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import type { SavedMeal } from "@/types/nutrition";

export async function getSavedMeals(): Promise<SavedMeal[]> {
  const supabase = createClient();

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
