import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export async function last30DaysAnalyticsRPC() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase.rpc("last_30d_analytics");

  if (error || !data) {
    handleError(error, {
      message: "Error fetching gym sessions",
      route: "/database/gym/analytics/last-30-days",
      method: "GET",
    });
    throw new Error("Error fetching gym sessions");
  }

  return data;
}
