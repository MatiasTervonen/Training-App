import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type FoodItem = {
  id: string;
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
  nutrition_label_url: string | null;
  source: string | null;
  created_at: string;
};

export async function lookupBarcode(
  barcode: string,
): Promise<FoodItem | null> {
  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .eq("barcode", barcode)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;

    handleError(error, {
      message: "Error looking up barcode",
      route: "/database/nutrition/lookup-barcode",
      method: "GET",
    });
    throw new Error("Error looking up barcode");
  }

  return data as FoodItem;
}
