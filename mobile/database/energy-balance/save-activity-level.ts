import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function saveActivityLevel(date: string, level: number) {
  const { error } = await supabase.rpc("activity_level_upsert", {
    p_date: date,
    p_level: level,
  });

  if (error) {
    handleError(error, {
      message: "Error saving activity level",
      route: "/database/energy-balance/save-activity-level",
      method: "POST",
    });
    throw new Error("Error saving activity level");
  }
}
