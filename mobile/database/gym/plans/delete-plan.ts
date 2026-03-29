import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function deletePlan(planId: string) {
  const { error } = await supabase
    .from("training_plans")
    .delete()
    .eq("id", planId);

  if (error) {
    handleError(error, {
      message: "Error deleting training plan",
      route: "/database/gym/plans/delete-plan",
      method: "POST",
    });
    throw new Error("Error deleting training plan");
  }

  return { success: true };
}
