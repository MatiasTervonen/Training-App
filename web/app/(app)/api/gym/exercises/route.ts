import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: exercises, error } = await supabase
    .from("gym_exercises")
    .select("id, user_id, name, equipment, muscle_group, main_group")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching exercises:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(exercises), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
