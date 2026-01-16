import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export async function last30DaysAnalytics() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { data: gymSession, error: gymSessionError } = await supabase
    .from("gym_sessions")
    .select(`*, gym_session_exercises(*, gym_exercises(*), gym_sets(*))`)
    .gte(
      "created_at",
      new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()
    )
    .eq("user_id", session.user.id);

  if (gymSessionError || !gymSession) {
    handleError(gymSessionError, {
      message: "Error fetching gym sessions",
      route: "/database/gym/analytics/last-30-days",
      method: "GET",
    });
    throw new Error("Error fetching gym sessions");
  }

  return gymSession;
}
