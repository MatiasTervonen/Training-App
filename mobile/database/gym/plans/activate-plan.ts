import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function activatePlan(planId: string) {
  const { error } = await supabase.rpc("training_plan_activate", {
    p_plan_id: planId,
  });

  if (error) {
    handleError(error, {
      message: "Error activating training plan",
      route: "/database/gym/plans/activate-plan",
      method: "POST",
    });
    throw new Error("Error activating training plan");
  }
}
