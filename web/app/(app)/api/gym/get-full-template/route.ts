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

  const { data: template, error: templateError } = await supabase
    .from("gym_templates")
    .select(
      "id, name, created_at, gym_template_exercises(id, exercise_id, sets, reps, superset_id, gym_exercises:exercise_id(name, equipment, muscle_group, main_group))"
    )
    .eq("user_id", user.sub)
    .eq("id", sessionId)
    .single();

  if (templateError || !template) {
    console.error("Supabase Insert Error:", templateError);
    return new Response(JSON.stringify({ error: templateError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(template), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
