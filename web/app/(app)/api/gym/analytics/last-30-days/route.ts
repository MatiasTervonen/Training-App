import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: gymSession, error: gymSessionError } = await supabase
    .from("gym_sessions")
    .select(`*, gym_session_exercises(*, gym_exercises(*), gym_sets(*))`)
    .gte(
      "created_at",
      new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()
    )
    .eq("user_id", user.sub);

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
