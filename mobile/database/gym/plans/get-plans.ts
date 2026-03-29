import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getPlans() {
  const { data, error } = await supabase
    .from("training_plans")
    .select("id, name, is_active, total_weeks, current_week, current_position, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    handleError(error, {
      message: "Error fetching training plans",
      route: "/database/gym/plans/get-plans",
      method: "GET",
    });
    throw new Error("Error fetching training plans");
  }

  return data;
}

export type TrainingPlanSummary = Awaited<ReturnType<typeof getPlans>>[number];
