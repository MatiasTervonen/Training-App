import { useState, useEffect, useRef } from "react";
import { searchFoods as searchFoodsLocal } from "@/database/nutrition/search-foods";
import { searchFoods as searchFoodsAPI } from "@/lib/open-food-facts";
import type { FoodSearchResult } from "@/database/nutrition/search-foods";
import type { OpenFoodFactsProduct } from "@/lib/open-food-facts";

export type NutritionSearchResult = {
  id: string | null;
  name: string;
  brand: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_size_g: number;
  serving_description: string | null;
  image_url: string | null;
  barcode: string | null;
  is_custom: boolean;
  source: "local" | "custom" | "api";
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
    serving_size_g: r.serving_size_g,
    serving_description: r.serving_description,
    image_url: r.image_url,
    barcode: r.barcode,
    is_custom: r.is_custom,
    source: r.is_custom ? "custom" : "local",
  };
}

function mapApiResult(r: OpenFoodFactsProduct): NutritionSearchResult {
  return {
    id: null,
    name: r.name,
    brand: r.brand,
    calories_per_100g: r.calories_per_100g,
    protein_per_100g: r.protein_per_100g,
    carbs_per_100g: r.carbs_per_100g,
    fat_per_100g: r.fat_per_100g,
    serving_size_g: r.serving_size_g,
    serving_description: r.serving_description,
    image_url: r.image_url,
    barcode: r.barcode,
    is_custom: false,
    source: "api",
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

    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    abortRef.current = false;

    debounceRef.current = setTimeout(async () => {
      const currentQuery = query.trim();

      try {
        const localPromise = searchFoodsLocal(currentQuery);
        const apiPromise = searchFoodsAPI(currentQuery);

        // Show local results first
        const rawLocal = await localPromise;
        if (abortRef.current) return;
        const localMapped = rawLocal.map(mapLocalResult);
        setResults(localMapped);

        // Merge API results after
        try {
          const rawApi = await apiPromise;
          if (abortRef.current) return;

          const localBarcodes = new Set(
            localMapped
              .filter((r) => r.barcode !== null)
              .map((r) => r.barcode),
          );

          const uniqueApi = rawApi
            .filter((r) => !localBarcodes.has(r.barcode))
            .map(mapApiResult);

          setResults([...localMapped, ...uniqueApi]);
        } catch {
          // API failure is non-fatal — local results are already shown
        }
      } catch {
        if (!abortRef.current) {
          setResults([]);
        }
      } finally {
        if (!abortRef.current) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      abortRef.current = true;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  return { results, isSearching };
}
