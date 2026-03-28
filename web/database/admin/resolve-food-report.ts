"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/utils/handleError";

type ResolveFoodReportParams = {
  reportId: string;
  action: "accepted" | "rejected" | "pending";
  servingSizeG?: number | null;
  caloriesPer100g?: number | null;
  proteinPer100g?: number | null;
  carbsPer100g?: number | null;
  fatPer100g?: number | null;
  saturatedFatPer100g?: number | null;
  sugarPer100g?: number | null;
  fiberPer100g?: number | null;
  sodiumPer100g?: number | null;
  imageUrl?: string | null;
  nutritionLabelUrl?: string | null;
};

export async function resolveFoodReport(params: ResolveFoodReportParams) {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const user = authData?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const role = user.app_metadata?.role;
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const { error } = await supabase.rpc("admin_resolve_food_report", {
    p_report_id: params.reportId,
    p_action: params.action,
    p_serving_size_g: params.servingSizeG ?? undefined,
    p_calories_per_100g: params.caloriesPer100g ?? undefined,
    p_protein_per_100g: params.proteinPer100g ?? undefined,
    p_carbs_per_100g: params.carbsPer100g ?? undefined,
    p_fat_per_100g: params.fatPer100g ?? undefined,
    p_saturated_fat_per_100g: params.saturatedFatPer100g ?? undefined,
    p_sugar_per_100g: params.sugarPer100g ?? undefined,
    p_fiber_per_100g: params.fiberPer100g ?? undefined,
    p_sodium_per_100g: params.sodiumPer100g ?? undefined,
    p_image_url: params.imageUrl !== undefined ? (params.imageUrl ?? undefined) : "__KEEP__",
    p_nutrition_label_url: params.nutritionLabelUrl !== undefined ? (params.nutritionLabelUrl ?? undefined) : "__KEEP__",
  });

  if (error) {
    handleError(error, {
      message: "Error resolving food report",
      route: "/database/admin/resolve-food-report",
      method: "POST",
    });
    throw new Error("Error resolving food report");
  }
}
