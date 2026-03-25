import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { searchFoods as searchFoodsLocal } from "@/database/nutrition/search-foods";
import { searchFoods as searchFoodsOFF } from "@/lib/open-food-facts";
import { searchFoods as searchFoodsUSDA } from "@/lib/usda-food-data";
import type { NutritionSearchResult, FoodSearchResult } from "@/types/nutrition";
import type { OpenFoodFactsProduct } from "@/lib/open-food-facts";
import type { USDAFoodResult } from "@/lib/usda-food-data";

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

async function searchAllSources(
  query: string,
): Promise<NutritionSearchResult[]> {
  const [rawLocal, rawOFF, rawUSDA] = await Promise.all([
    searchFoodsLocal(query).catch((): FoodSearchResult[] => []),
    searchFoodsOFF(query).catch((): OpenFoodFactsProduct[] => []),
    searchFoodsUSDA(query).catch((): USDAFoodResult[] => []),
  ]);

  const localMapped = rawLocal.map(mapLocalResult);

  const seenBarcodes = new Set(
    localMapped.filter((r) => r.barcode !== null).map((r) => r.barcode),
  );

  const uniqueOFF = rawOFF
    .filter((r) => !seenBarcodes.has(r.barcode))
    .map(mapOFFResult);

  for (const r of uniqueOFF) {
    if (r.barcode) seenBarcodes.add(r.barcode);
  }

  const uniqueUSDA = rawUSDA
    .filter((r) => !seenBarcodes.has(r.barcode))
    .map(mapUSDAResult);

  return [...localMapped, ...uniqueOFF, ...uniqueUSDA];
}

const EMPTY_RESULTS: NutritionSearchResult[] = [];

export function useFoodSearch(query: string) {
  const [debouncedQuery] = useDebounce(query.trim(), 500);

  const { data, isFetching } = useQuery({
    queryKey: ["foodSearch", debouncedQuery],
    queryFn: () => searchAllSources(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  return {
    results: data ?? EMPTY_RESULTS,
    isSearching: isFetching,
  };
}
