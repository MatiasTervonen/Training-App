import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { activities } from "@/types/models";

export async function getRecentActivities() {
  const { data: activities, error } = await supabase
    .from("sessions")
    .select(`activity:activity_id (*)`)
    .order("id", { ascending: false })
    .limit(50);

  if (error) {
    handleError(error, {
      message: "Error fetching recent activities",
      route: "/database/activities/recent-activities",
      method: "GET",
    });
    throw new Error("Error fetching recent activities");
  }

  const uniqueActivities: activities[] = [];
  const seen = new Set<string>();

  for (const row of activities) {
    const activity = Array.isArray(row.activity)
      ? row.activity[0]
      : row.activity;
    if (activity && !seen.has(activity.id)) {
      seen.add(activity.id);
      uniqueActivities.push(activity);
    }
    if (uniqueActivities.length >= 10) break;
  }

  return uniqueActivities ?? [];
}
