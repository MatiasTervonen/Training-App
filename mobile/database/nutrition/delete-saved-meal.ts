import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function deleteSavedMeal(mealId: string): Promise<void> {
  const { error } = await supabase.rpc("nutrition_delete_saved_meal", {
    p_meal_id: mealId,
  });

  if (error) {
    handleError(error, {
      message: "Error deleting saved meal",
      route: "/database/nutrition/delete-saved-meal",
      method: "DELETE",
    });
    throw new Error("Error deleting saved meal");
  }
}
