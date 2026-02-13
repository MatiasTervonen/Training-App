import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import { activities_with_category } from "@/types/models";

export async function getRecentActivities() {
  const supabase = createClient();

  const { data: activities, error } = await supabase
    .from("sessions")
    .select(`activity:activity_id (*, activity_categories(id, name, slug))`)
    .order("id", { ascending: false })
    .limit(50);

  if (error) {
    handleError(error, {
      message: "Error fetching recent activities",
      route: "/database/activities/get-recent-activities",
      method: "GET",
    });
    throw new Error("Error fetching recent activities");
  }

  const uniqueActivities: activities_with_category[] = [];
  const seen = new Set<string>();

  for (const row of activities) {
    const activity = Array.isArray(row.activity)
      ? row.activity[0]
      : row.activity;
    if (activity && !seen.has(activity.id)) {
      seen.add(activity.id);
      uniqueActivities.push(activity as activities_with_category);
    }
    if (uniqueActivities.length >= 10) break;
  }

  return uniqueActivities ?? [];
}
