const BASE_URL = "https://world.openfoodfacts.net";
const USER_AGENT = "Kurvi/1.0 (https://kurvi.app)";
const TIMEOUT_MS = 5000;

export type OpenFoodFactsProduct = {
  barcode: string;
  name: string;
  brand: string | null;
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
  image_url: string | null;
  image_nutrition_url: string | null;
};

type Nutriments = {
  "energy-kcal_100g"?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
  sugars_100g?: number;
  sodium_100g?: number;
  "saturated-fat_100g"?: number;
};

type RawProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  image_url?: string;
  image_nutrition_url?: string;
  nutriments?: Nutriments;
};

function parseServingSizeG(servingSize: string | undefined): number {
  if (!servingSize) return 100;
  const match = servingSize.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 100;
}

function parseProduct(raw: RawProduct): OpenFoodFactsProduct | null {
  if (!raw.product_name) return null;

  const nutriments = raw.nutriments ?? {};

  return {
    barcode: raw.code ?? "",
    name: raw.product_name,
    brand: raw.brands ?? null,
    serving_size_g: parseServingSizeG(raw.serving_size),
    serving_description: raw.serving_size ?? null,
    calories_per_100g: nutriments["energy-kcal_100g"] ?? 0,
    protein_per_100g: nutriments.proteins_100g ?? 0,
    carbs_per_100g: nutriments.carbohydrates_100g ?? 0,
    fat_per_100g: nutriments.fat_100g ?? 0,
    fiber_per_100g: nutriments.fiber_100g ?? null,
    sugar_per_100g: nutriments.sugars_100g ?? null,
    sodium_per_100g: nutriments.sodium_100g ?? null,
    saturated_fat_per_100g: nutriments["saturated-fat_100g"] ?? null,
    image_url: raw.image_url ?? null,
    image_nutrition_url: raw.image_nutrition_url ?? null,
  };
}

export async function lookupBarcode(
  barcode: string,
): Promise<OpenFoodFactsProduct | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(
      `${BASE_URL}/api/v2/product/${barcode}.json`,
      {
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
      },
    );

    if (!response.ok) return null;

    const json = (await response.json()) as {
      status: number;
      product?: RawProduct;
    };
    if (json.status !== 1 || !json.product) return null;

    return parseProduct(json.product);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchFoods(
  query: string,
): Promise<OpenFoodFactsProduct[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const params = new URLSearchParams({
      search_terms: query,
      json: "1",
      page_size: "20",
    });

    const response = await fetch(`${BASE_URL}/cgi/search.pl?${params}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });

    if (!response.ok) return [];

    const json = (await response.json()) as { products?: RawProduct[] };
    if (!json.products) return [];

    return json.products
      .map(parseProduct)
      .filter((p): p is OpenFoodFactsProduct => p !== null);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
