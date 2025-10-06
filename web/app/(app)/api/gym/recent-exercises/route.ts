import { createClient } from "@/utils/supabase/server";
import { ExercisePreview } from "@/app/(app)/types/models";
import { handleError } from "@/app/(app)/utils/handleError";

export async function GET() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: exercises, error } = await supabase
    .from("gym_session_exercises")
    .select(
      `exercise:exercise_id ( id, user_id, name, equipment, muscle_group, main_group, language)`
    )
    .order("id", { ascending: false })
    .limit(10);

  if (error) {
    handleError(error, {
      message: "Error fetching recent exercises",
      route: "/api/gym/recent-exercises",
      method: "GET",
    });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const uniqueExercises: ExercisePreview[] = [];
  const seen = new Set<number>();

  for (const row of exercises) {
    const ex = Array.isArray(row.exercise) ? row.exercise[0] : row.exercise;
    if (ex && !seen.has(ex.id)) {
      seen.add(ex.id);
      uniqueExercises.push(ex);
    }
  }

  return new Response(JSON.stringify(uniqueExercises), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
