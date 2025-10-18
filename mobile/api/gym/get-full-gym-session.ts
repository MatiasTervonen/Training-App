import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getFullGymSession(sessionId: string) {

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("No session");
  }

  if (!sessionId) {
    throw new Error("Missing session ID");
  }

  const { data: gymSession, error: gymSessionError } = await supabase
    .from("gym_sessions")
    .select(`*, gym_session_exercises(*, gym_exercises(*), gym_sets(*))`)
    .eq("user_id", session.user.id)
    .eq("id", sessionId)
    .single();

  if (gymSessionError || !gymSession) {
    handleError(gymSessionError, {
      message: "Error fetching gym session",
      route: "/api/gym/get-full-gym-session",
      method: "GET",
    });
    throw new Error(JSON.stringify({ error: gymSessionError?.message }));
  }

  return gymSession;
}
