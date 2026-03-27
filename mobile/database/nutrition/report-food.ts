import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { uploadFileToStorage, getAccessToken } from "@/lib/upload-with-progress";
import * as Crypto from "expo-crypto";

type ReportFoodParams = {
  foodId: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  saturatedFatPer100g?: number | null;
  sugarPer100g?: number | null;
  fiberPer100g?: number | null;
  sodiumPer100g?: number | null;
  imageUri?: string | null;
  nutritionLabelUri?: string | null;
  explanation?: string | null;
};

async function uploadReportImage(fileUri: string): Promise<string | null> {
  try {
    const accessToken = await getAccessToken();
    const ext = fileUri.includes(".png") ? "png" : "jpg";
    const path = `reports/${Crypto.randomUUID()}.${ext}`;

    await uploadFileToStorage(
      "food-images",
      path,
      fileUri,
      `image/${ext === "png" ? "png" : "jpeg"}`,
      accessToken,
    );

    const { data: urlData } = supabase.storage
      .from("food-images")
      .getPublicUrl(path);

    return urlData.publicUrl;
  } catch {
    return null;
  }
}

export async function reportFood(params: ReportFoodParams): Promise<string> {
  const [imageUrl, nutritionLabelUrl] = await Promise.all([
    params.imageUri ? uploadReportImage(params.imageUri) : Promise.resolve(null),
    params.nutritionLabelUri ? uploadReportImage(params.nutritionLabelUri) : Promise.resolve(null),
  ]);

  const { data, error } = await supabase.rpc("nutrition_report_food", {
    p_food_id: params.foodId,
    p_calories_per_100g: params.caloriesPer100g,
    p_protein_per_100g: params.proteinPer100g,
    p_carbs_per_100g: params.carbsPer100g,
    p_fat_per_100g: params.fatPer100g,
    p_saturated_fat_per_100g: params.saturatedFatPer100g ?? null,
    p_sugar_per_100g: params.sugarPer100g ?? null,
    p_fiber_per_100g: params.fiberPer100g ?? null,
    p_sodium_per_100g: params.sodiumPer100g ?? null,
    p_report_image_url: imageUrl,
    p_report_nutrition_label_url: nutritionLabelUrl,
    p_explanation: params.explanation ?? null,
  });
  if (error) {
    handleError(error, { context: "reportFood" });
    throw error;
  }
  return data as string;
}
