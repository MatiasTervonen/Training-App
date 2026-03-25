import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type ToggleFavoriteParams = {
  foodId: string | null;
  customFoodId: string | null;
};

export async function toggleFavorite(
  params: ToggleFavoriteParams,
): Promise<boolean> {
  const { foodId, customFoodId } = params;

  if (!foodId && !customFoodId) {
    throw new Error("Either foodId or customFoodId must be provided");
  }

  // Check if favorite already exists
  let query = supabase.from("favorite_foods").select("id");

  if (foodId) {
    query = query.eq("food_id", foodId);
  } else if (customFoodId) {
    query = query.eq("custom_food_id", customFoodId);
  }

  const { data: existing, error: checkError } = await query.maybeSingle();

  if (checkError) {
    handleError(checkError, {
      message: "Error checking favorite status",
      route: "/database/nutrition/toggle-favorite",
      method: "GET",
    });
    throw new Error("Error checking favorite status");
  }

  if (existing) {
    // Remove favorite
    const { error: deleteError } = await supabase
      .from("favorite_foods")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      handleError(deleteError, {
        message: "Error removing favorite",
        route: "/database/nutrition/toggle-favorite",
        method: "DELETE",
      });
      throw new Error("Error removing favorite");
    }

    return false; // No longer a favorite
  }

  // Add favorite
  const { error: insertError } = await supabase
    .from("favorite_foods")
    .insert({
      food_id: foodId ?? null,
      custom_food_id: customFoodId ?? null,
    });

  if (insertError) {
    handleError(insertError, {
      message: "Error adding favorite",
      route: "/database/nutrition/toggle-favorite",
      method: "POST",
    });
    throw new Error("Error adding favorite");
  }

  return true; // Now a favorite
}
