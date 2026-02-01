import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getActivityCategories() {
  const { data, error } = await supabase
    .from("activity_categories")
    .select("name, id, slug")
    .order("name", { ascending: true });

  if (error) {
    handleError(error, {
      message: "Error getting activity categories",
      route: "/database/activities/get-activity-categories",
      method: "GET",
    });
    throw new Error("Error getting activity categories");
  }

  return data;
}
