import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: analytics, error: gymSessionError } = await supabase.rpc(
    "last_30d_analytics",
    { uid: user.sub }
  );

  if (gymSessionError || !analytics) {
    handleError(gymSessionError, {
      message: "Error fetching gym sessions",
      route: "/api/gym/analytics/last-30-days",
      method: "GET",
    });
    return new Response(JSON.stringify({ error: gymSessionError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: heatMap, error: heatMapError } = await supabase
    .from("gym_sessions")
    .select("title, created_at")
    .gte(
      "created_at",
      new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()
    )
    .eq("user_id", user.sub)
    .order("created_at", { ascending: true });

  if (heatMapError || !heatMap) {
    handleError(heatMapError, {
      message: "Error fetching gym sessions",
      route: "/api/gym/analytics/last-30-days",
      method: "GET",
    });
    return new Response(JSON.stringify({ error: heatMapError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      analytics,
      heatMap,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
