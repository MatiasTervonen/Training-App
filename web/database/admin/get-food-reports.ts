"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/utils/handleError";

const PAGE_SIZE = 15;

export async function getFoodReports(offset: number, status?: string) {
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

  const { data, error } = await supabase.rpc("admin_get_food_reports", {
    p_limit: PAGE_SIZE,
    p_offset: offset,
    p_status: status ?? null,
  });

  if (error) {
    handleError(error, {
      message: "Error fetching food reports",
      route: "/database/admin/get-food-reports",
      method: "GET",
    });
    throw new Error("Error fetching food reports");
  }

  return (data ?? []) as FoodReportItem[];
}

export type FoodReportItem = {
  id: string;
  food_id: string;
  user_id: string;
  status: string;
  created_at: string;
  reported_calories_per_100g: number;
  reported_protein_per_100g: number;
  reported_carbs_per_100g: number;
  reported_fat_per_100g: number;
  reported_saturated_fat_per_100g: number | null;
  reported_sugar_per_100g: number | null;
  reported_fiber_per_100g: number | null;
  reported_sodium_per_100g: number | null;
  food_name: string;
  brand: string | null;
  barcode: string | null;
  current_calories_per_100g: number;
  current_protein_per_100g: number;
  current_carbs_per_100g: number;
  current_fat_per_100g: number;
  current_saturated_fat_per_100g: number | null;
  current_sugar_per_100g: number | null;
  current_fiber_per_100g: number | null;
  current_sodium_per_100g: number | null;
  image_url: string | null;
  nutrition_label_url: string | null;
  user_email: string | null;
  display_name: string | null;
};
