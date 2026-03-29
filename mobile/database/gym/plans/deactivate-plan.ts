import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function deactivatePlan(planId: string) {
  const { error } = await supabase.rpc("training_plan_deactivate", {
    p_plan_id: planId,
  });

  if (error) {
    handleError(error, {
      message: "Error deactivating training plan",
      route: "/database/gym/plans/deactivate-plan",
      method: "POST",
    });
    throw new Error("Error deactivating training plan");
  }
}
