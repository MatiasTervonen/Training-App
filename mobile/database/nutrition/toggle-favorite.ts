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

  const { data, error } = await supabase.rpc("nutrition_toggle_favorite", {
    p_food_id: foodId ?? undefined,
    p_custom_food_id: customFoodId ?? undefined,
  });

  if (error) {
    handleError(error, {
      message: "Error toggling favorite",
      route: "/database/nutrition/toggle-favorite",
      method: "POST",
    });
    throw new Error("Error toggling favorite");
  }

  return data as boolean;
}
