import { handleError } from "@/app/(app)/utils/handleError";
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
    .select("id, user_id, name, equipment, muscle_group, main_group, language")
    .order("name", { ascending: true })
    .eq("user_id", user.sub);

  if (error) {
    handleError(error, {
      message: "Error fetching exercises",
      route: "/api/gym/exercises",
      method: "GET",
    });
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
