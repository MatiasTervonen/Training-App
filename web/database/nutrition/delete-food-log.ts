import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function deleteFoodLog({
  logId,
  loggedAt,
}: {
  logId: string;
  loggedAt: string;
}) {
  const supabase = createClient();

  const { error } = await supabase.rpc("nutrition_delete_food_log", {
    p_log_id: logId,
    p_logged_at: loggedAt,
  });

  if (error) {
    handleError(error, {
      message: "Error deleting food log",
      route: "/database/nutrition/delete-food-log",
      method: "DELETE",
    });
    throw new Error("Error deleting food log");
  }
}
