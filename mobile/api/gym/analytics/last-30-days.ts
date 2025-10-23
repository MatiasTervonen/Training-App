import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function Last30DaysAnalytics() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("No session");
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
      route: "/api/gym/analytics/last-30-days",
      method: "GET",
    });
    throw new Error(gymSessionError?.message || "Error fetching gym sessions");
  }

  return gymSession;
}
