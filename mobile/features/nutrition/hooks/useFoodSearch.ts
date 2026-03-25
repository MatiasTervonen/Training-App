import { useState, useEffect, useRef } from "react";
import { searchFoods as searchFoodsLocal } from "@/database/nutrition/search-foods";
import { searchFoods as searchFoodsOFF } from "@/lib/open-food-facts";
import { searchFoods as searchFoodsUSDA } from "@/lib/usda-food-data";
import type { FoodSearchResult } from "@/database/nutrition/search-foods";
import type { OpenFoodFactsProduct } from "@/lib/open-food-facts";
import type { USDAFoodResult } from "@/lib/usda-food-data";

export type NutritionSearchResult = {
  id: string | null;
  name: string;
  brand: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  saturated_fat_per_100g: number | null;
  sugar_per_100g: number | null;
  fiber_per_100g: number | null;
  sodium_per_100g: number | null;
  serving_size_g: number;
  serving_description: string | null;
  image_url: string | null;
  image_nutrition_url: string | null;
  barcode: string | null;
  is_custom: boolean;
  source: "local" | "custom" | "api";
  apiSource?: "openfoodfacts" | "usda";
};

function mapLocalResult(r: FoodSearchResult): NutritionSearchResult {
  return {
    id: r.id,
    name: r.name,
    brand: r.brand,
    calories_per_100g: r.calories_per_100g,
    protein_per_100g: r.protein_per_100g,
    carbs_per_100g: r.carbs_per_100g,
    fat_per_100g: r.fat_per_100g,
    saturated_fat_per_100g: r.saturated_fat_per_100g,
    sugar_per_100g: r.sugar_per_100g,
    fiber_per_100g: r.fiber_per_100g,
    sodium_per_100g: r.sodium_per_100g,
    serving_size_g: r.serving_size_g,
    serving_description: r.serving_description,
    image_url: r.image_url,
    image_nutrition_url: r.nutrition_label_url,
    barcode: r.barcode,
    is_custom: r.is_custom,
    source: r.is_custom ? "custom" : "local",
  };
}

function mapOFFResult(r: OpenFoodFactsProduct): NutritionSearchResult {
  return {
    id: null,
    name: r.name,
    brand: r.brand,
    calories_per_100g: r.calories_per_100g,
    protein_per_100g: r.protein_per_100g,
    carbs_per_100g: r.carbs_per_100g,
    fat_per_100g: r.fat_per_100g,
    saturated_fat_per_100g: r.saturated_fat_per_100g,
    sugar_per_100g: r.sugar_per_100g,
    fiber_per_100g: r.fiber_per_100g,
    sodium_per_100g: r.sodium_per_100g,
    serving_size_g: r.serving_size_g,
    serving_description: r.serving_description,
    image_url: r.image_url,
    image_nutrition_url: r.image_nutrition_url,
    barcode: r.barcode,
    is_custom: false,
    source: "api",
    apiSource: "openfoodfacts",
  };
}

function mapUSDAResult(r: USDAFoodResult): NutritionSearchResult {
  return {
    id: null,
    name: r.name,
    brand: r.brand,
    calories_per_100g: r.calories_per_100g,
    protein_per_100g: r.protein_per_100g,
    carbs_per_100g: r.carbs_per_100g,
    fat_per_100g: r.fat_per_100g,
    saturated_fat_per_100g: r.saturated_fat_per_100g,
    sugar_per_100g: r.sugar_per_100g,
    fiber_per_100g: r.fiber_per_100g,
    sodium_per_100g: r.sodium_per_100g,
    serving_size_g: r.serving_size_g,
    serving_description: r.serving_description,
    image_url: null,
    image_nutrition_url: null,
    barcode: r.barcode,
    is_custom: false,
    source: "api",
    apiSource: "usda",
  };
}

export function useFoodSearch(query: string) {
  const [results, setResults] = useState<NutritionSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    abortRef.current = false;

    debounceRef.current = setTimeout(async () => {
      const currentQuery = query.trim();

      try {
        // Search all three sources in parallel — each handles its own errors
        const [rawLocal, rawOFF, rawUSDA] = await Promise.all([
          searchFoodsLocal(currentQuery).catch((): FoodSearchResult[] => []),
          searchFoodsOFF(currentQuery).catch((): OpenFoodFactsProduct[] => []),
          searchFoodsUSDA(currentQuery).catch((): USDAFoodResult[] => []),
        ]);

        if (abortRef.current) return;

        const localMapped = rawLocal.map(mapLocalResult);

        // Collect barcodes already in local DB to deduplicate API results
        const seenBarcodes = new Set(
          localMapped
            .filter((r) => r.barcode !== null)
            .map((r) => r.barcode),
        );

        // Open Food Facts results — dedupe against local
        const uniqueOFF = rawOFF
          .filter((r) => !seenBarcodes.has(r.barcode))
          .map(mapOFFResult);

        // Add OFF barcodes to seen set before deduping USDA
        for (const r of uniqueOFF) {
          if (r.barcode) seenBarcodes.add(r.barcode);
        }

        // USDA results — dedupe against local + OFF
        const uniqueUSDA = rawUSDA
          .filter((r) => !seenBarcodes.has(r.barcode))
          .map(mapUSDAResult);

        setResults([...localMapped, ...uniqueOFF, ...uniqueUSDA]);
      } catch {
        // All have individual .catch() so this shouldn't fire
      } finally {
        if (!abortRef.current) {
          setIsSearching(false);
        }
      }
    }, 500);

    return () => {
      abortRef.current = true;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  return { results, isSearching };
}
