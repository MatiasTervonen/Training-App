import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type AdvanceResult = {
  completed: boolean;
  current_week?: number;
  current_position?: number;
};

export async function advancePlan(planId: string): Promise<AdvanceResult> {
  const { data, error } = await supabase.rpc("training_plan_advance", {
    p_plan_id: planId,
  });

  if (error) {
    handleError(error, {
      message: "Error advancing training plan",
      route: "/database/gym/plans/advance-plan",
      method: "POST",
    });
    throw new Error("Error advancing training plan");
  }

  return data as AdvanceResult;
}
