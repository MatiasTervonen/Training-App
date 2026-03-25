const BASE_URL = "https://api.nal.usda.gov/fdc/v1";
const TIMEOUT_MS = 5000;

const API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY ?? "";

export type USDAFoodResult = {
  fdcId: number;
  name: string;
  brand: string | null;
  barcode: string;
  serving_size_g: number;
  serving_description: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number | null;
  sugar_per_100g: number | null;
  sodium_per_100g: number | null;
  saturated_fat_per_100g: number | null;
};

type RawNutrient = {
  nutrientId: number;
  value?: number;
};

type RawFood = {
  fdcId: number;
  description?: string;
  brandName?: string;
  brandOwner?: string;
  gtinUpc?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: RawNutrient[];
};

function getNutrient(
  nutrients: RawNutrient[],
  nutrientId: number
): number | null {
  const match = nutrients.find((n) => n.nutrientId === nutrientId);
  return match?.value ?? null;
}

function parseFood(raw: RawFood): USDAFoodResult | null {
  if (!raw.description) return null;

  const nutrients = raw.foodNutrients ?? [];
  const calories = getNutrient(nutrients, 1008);

  if (calories === null) return null;

  // USDA returns sodium in mg — convert to g for consistency with our per_100g schema
  const sodiumMg = getNutrient(nutrients, 1093);

  return {
    fdcId: raw.fdcId,
    name: raw.description,
    brand: raw.brandName || raw.brandOwner || null,
    barcode: raw.gtinUpc || `usda:${raw.fdcId}`,
    serving_size_g: raw.servingSize ?? 100,
    serving_description: raw.servingSize
      ? `${raw.servingSize}${raw.servingSizeUnit ?? "g"}`
      : null,
    calories_per_100g: calories,
    protein_per_100g: getNutrient(nutrients, 1003) ?? 0,
    carbs_per_100g: getNutrient(nutrients, 1005) ?? 0,
    fat_per_100g: getNutrient(nutrients, 1004) ?? 0,
    fiber_per_100g: getNutrient(nutrients, 1079),
    sugar_per_100g: getNutrient(nutrients, 1063),
    sodium_per_100g: sodiumMg !== null ? sodiumMg / 1000 : null,
    saturated_fat_per_100g: getNutrient(nutrients, 1258),
  };
}

export async function searchFoods(
  query: string
): Promise<USDAFoodResult[]> {
  if (!API_KEY) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const params = new URLSearchParams({
      query,
      api_key: API_KEY,
      pageSize: "20",
    });

    const response = await fetch(`${BASE_URL}/foods/search?${params}`, {
      signal: controller.signal,
    });

    if (!response.ok) return [];

    const json = (await response.json()) as { foods?: RawFood[] };
    if (!json.foods) return [];

    return json.foods
      .map(parseFood)
      .filter((f): f is USDAFoodResult => f !== null);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
