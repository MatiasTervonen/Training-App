import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getActivities(search: string) {
  let query = supabase
    .from("activities")
    .select("*, activity_categories(id, name, slug)");

  if (search.trim() !== "") {
    query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%`);
  }

  const { data, error } = await query;

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
