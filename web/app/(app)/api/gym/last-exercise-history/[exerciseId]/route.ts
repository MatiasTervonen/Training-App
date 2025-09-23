import { createClient } from "@/utils/supabase/server";

type SessionExercise = {
  id: string;
  session_id: string;
  exercise_id: string;
  gym_sessions: { created_at: string; user_id: string };
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  const supabase = await createClient();

  const { exerciseId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data, error: exerciseError } = await supabase
    .from("gym_session_exercises")
    .select(
      "id, session_id, exercise_id, gym_sessions:session_id(created_at, user_id)"
    )
    .eq("exercise_id", exerciseId)
    .eq("gym_sessions.user_id", user.id);

  const sessions = data as SessionExercise[] | null;

  if (exerciseError || !sessions || sessions.length === 0) {
    console.error("Error fetching exercises:", exerciseError?.message);
    return new Response(
      JSON.stringify({ message: "No pervious session found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const sorted = sessions.sort(
    (a, b) =>
      new Date(b.gym_sessions?.created_at).getTime() -
      new Date(a.gym_sessions?.created_at).getTime()
  );

  const allSorted = await Promise.all(
    sorted.map(async (session) => {
      const { data: sets, error: setsError } = await supabase
        .from("gym_sets")
        .select("set_number,weight, reps, rpe")
        .eq("session_exercise_id", session.id)
        .order("set_number", { ascending: true });

      if (setsError) {
        console.error("Error fetching sets:", setsError.message);
        return new Response(JSON.stringify({ error: setsError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return {
        date: session.gym_sessions?.created_at,
        sets,
      };
    })
  );

  const filteredResults = allSorted.filter(Boolean);

  return new Response(JSON.stringify(filteredResults), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
