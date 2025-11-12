import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("id");

  if (!sessionId) {
    return new Response("Missing session ID", { status: 400 });
  }

  const { data: gymSession, error: gymSessionError } = await supabase
    .from("gym_sessions")
    .select(`*, gym_session_exercises(*, gym_exercises(*), gym_sets(*))`)
    .order("position", {
      referencedTable: "gym_session_exercises",
      ascending: true,
    })
    .eq("user_id", user.sub)
    .eq("id", sessionId)
    .single();

  gymSession?.gym_session_exercises?.forEach((exercise) => {
    if (Array.isArray(exercise.gym_sets)) {
      exercise.gym_sets.sort((a, b) => a.set_number - b.set_number);
    }
  });

  if (gymSessionError || !gymSession) {
    handleError(gymSessionError, {
      message: "Error fetching gym session",
      route: "/api/gym/get-full-gym-session",
      method: "GET",
    });
    return new Response(JSON.stringify({ error: gymSessionError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(gymSession), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
