import { handleError } from "@/utils/handleError";
import { Last30DaysAnalytics } from "@/types/session";
import { createClient } from "@/utils/supabase/client";

export async function get30dAnalytics() {
  const supabase = createClient();

  const [
    { data: analytics, error: gymSessionError },
    { data: heatMap, error: heatMapError },
  ] = await Promise.all([
    supabase.rpc("last_30d_analytics"),
    supabase
      .from("sessions")
      .select("title, created_at")
      .gte(
        "created_at",
        new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
      )
      .eq("activity_id", "3de3db15-6b0a-4338-a276-396782c12c63")
      .order("created_at", { ascending: true }),
  ]);

  if (gymSessionError || !analytics) {
    handleError(gymSessionError, {
      message: "Error fetching gym sessions",
      route: "server-actions: get30dAnalytics",
      method: "direct",
    });
    throw new Error("Error fetching gym sessions");
  }

  if (heatMapError || !heatMap) {
    handleError(heatMapError, {
      message: "Error fetching gym sessions",
      route: "server-actions: get30dAnalytics",
      method: "direct",
    });
    throw new Error("Error fetching gym sessions");
  }

  return {
    analytics: analytics as Last30DaysAnalytics["analytics"],
    heatMap: heatMap as Last30DaysAnalytics["heatMap"],
  };
}
