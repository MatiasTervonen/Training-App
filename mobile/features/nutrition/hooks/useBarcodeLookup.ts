import { useCallback, useState } from "react";
import { lookupBarcode as lookupLocal } from "@/database/nutrition/lookup-barcode";
import { lookupBarcode as lookupAPI } from "@/lib/open-food-facts";
import { saveSharedFood } from "@/database/nutrition/save-shared-food";
import type { NutritionSearchResult } from "@/features/nutrition/hooks/useFoodSearch";
import type { FoodItem } from "@/database/nutrition/lookup-barcode";

export function mapFoodItem(f: FoodItem): NutritionSearchResult {
  return {
    id: f.id,
    name: f.name,
    brand: f.brand,
    calories_per_100g: f.calories_per_100g,
    protein_per_100g: f.protein_per_100g,
    carbs_per_100g: f.carbs_per_100g,
    fat_per_100g: f.fat_per_100g,
    saturated_fat_per_100g: f.saturated_fat_per_100g,
    sugar_per_100g: f.sugar_per_100g,
    fiber_per_100g: f.fiber_per_100g,
    sodium_per_100g: f.sodium_per_100g,
    serving_size_g: f.serving_size_g,
    serving_description: f.serving_description,
    image_url: f.image_url,
    image_nutrition_url: null,
    barcode: f.barcode,
    is_custom: false,
    source: "local",
  };
}

export function useBarcodeLookup() {
  const [isLooking, setIsLooking] = useState(false);

  const lookup = useCallback(async (barcode: string) => {
    setIsLooking(true);

    try {
      // 1. Check local DB first
      let localResult: FoodItem | null = null;
      try {
        localResult = await lookupLocal(barcode);
      } catch {
        // Local DB error — fall through to API lookup
      }
      if (localResult) {
        return mapFoodItem(localResult);
      }

      // 2. If not found, call Open Food Facts API
      const apiResult = await lookupAPI(barcode);
      if (apiResult) {
        // 3. Try to cache it locally, but don't lose the result if caching fails
        let cachedId: string | null = null;
        try {
          cachedId = await saveSharedFood({
            barcode: apiResult.barcode,
            name: apiResult.name,
            brand: apiResult.brand,
            servingSizeG: apiResult.serving_size_g,
            servingDescription: apiResult.serving_description,
            caloriesPer100g: apiResult.calories_per_100g,
            proteinPer100g: apiResult.protein_per_100g,
            carbsPer100g: apiResult.carbs_per_100g,
            fatPer100g: apiResult.fat_per_100g,
            fiberPer100g: apiResult.fiber_per_100g,
            sugarPer100g: apiResult.sugar_per_100g,
            sodiumPer100g: apiResult.sodium_per_100g,
            saturatedFatPer100g: apiResult.saturated_fat_per_100g,
            imageUrl: apiResult.image_url,
            nutritionLabelUrl: apiResult.image_nutrition_url,
          });
        } catch {
          // Cache failed — still return the API result
        }
        const mapped: NutritionSearchResult = {
          id: cachedId ?? "",
          name: apiResult.name,
          brand: apiResult.brand,
          calories_per_100g: apiResult.calories_per_100g,
          protein_per_100g: apiResult.protein_per_100g,
          carbs_per_100g: apiResult.carbs_per_100g,
          fat_per_100g: apiResult.fat_per_100g,
          saturated_fat_per_100g: apiResult.saturated_fat_per_100g,
          sugar_per_100g: apiResult.sugar_per_100g,
          fiber_per_100g: apiResult.fiber_per_100g,
          sodium_per_100g: apiResult.sodium_per_100g,
          serving_size_g: apiResult.serving_size_g,
          serving_description: apiResult.serving_description,
          image_url: apiResult.image_url,
          image_nutrition_url: apiResult.image_nutrition_url,
          barcode: apiResult.barcode,
          is_custom: false,
          source: "local",
        };
        return mapped;
      }

      return null;
    } catch {
      return null;
    } finally {
      setIsLooking(false);
    }
  }, []);

  return { isLooking, lookup };
}
