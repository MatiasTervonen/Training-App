import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

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
    .eq("user_id", user.id)
    .eq("id", sessionId)
    .single();

  if (gymSessionError || !gymSession) {
    console.error("Supabase Insert Error:", gymSessionError);
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
