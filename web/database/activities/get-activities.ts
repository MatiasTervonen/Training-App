import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function getActivities() {
  const supabase = createClient();

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
