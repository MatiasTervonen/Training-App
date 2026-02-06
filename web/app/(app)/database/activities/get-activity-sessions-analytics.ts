import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/client";

export type ActivitySessionAnalytics = {
  id: string;
  created_at: string;
  activity_name: string | null;
  activity_slug: string | null;
};

export async function getActivitySessionsAnalytics(
  days: number = 90
): Promise<ActivitySessionAnalytics[]> {
  const supabase = createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("sessions")
    .select("id, created_at, activities(name, slug)")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    handleError(error, {
      message: "Error fetching activity sessions for analytics",
      route: "/database/activities/get-activity-sessions-analytics",
      method: "getActivitySessionsAnalytics",
    });
    throw new Error("Failed to fetch activity sessions.");
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    activity_name: (row.activities as { name: string; slug: string } | null)?.name ?? null,
    activity_slug: (row.activities as { name: string; slug: string } | null)?.slug ?? null,
  }));
}
