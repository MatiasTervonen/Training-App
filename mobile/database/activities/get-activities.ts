import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getActivities() {
  const { data, error } = await supabase
    .from("activities")
    .select("*, activity_categories(id, name, slug)");

  if (error) {
    handleError(error, {
      message: "Error getting activities",
      route: "/database/activities/get-activities",
      method: "GET",
    });
    throw new Error("Error getting activities");
  }

  return data ?? [];
}
