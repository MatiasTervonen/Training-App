import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { exercises, notes, duration, title } = body;

  const { data: sessionData, error: sessionError } = await supabase
    .from("gym_sessions")
    .insert([
      {
        user_id: user.sub,
        title,
        notes,
        duration,
      },
    ])
    .select()
    .single();

  if (sessionError || !sessionData) {
    console.error("Supabase Insert Error:", sessionError);
    return new Response(JSON.stringify({ error: sessionError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sessionId = sessionData.id;

  const sessionExercises = [];
  const sets = [];

  for (const [index, ex] of exercises.entries()) {
    const supersetId = ex.superset_id ?? null;

    const sessionExerciseId = crypto.randomUUID();

    sessionExercises.push({
      id: sessionExerciseId,
      user_id: user.sub,
      session_id: sessionId,
      exercise_id: ex.exercise_id,
      position: index,
      superset_id: supersetId ?? null,
      notes: ex.notes ?? null,
    });

    for (const [setIndex, set] of ex.sets.entries()) {
      sets.push({
        user_id: user.sub,
        session_exercise_id: sessionExerciseId,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
        set_number: setIndex,
      });
    }
  }

  const { error: seError } = await supabase
    .from("gym_session_exercises")
    .insert(sessionExercises);

  if (seError) {
    console.error("Supabase Session Exercises Insert Error:", seError);
    return new Response(JSON.stringify({ error: seError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: setsError } = await supabase.from("gym_sets").insert(sets);

  if (setsError) {
    console.error("Supabase Sets Insert Error:", setsError);
    return new Response(JSON.stringify({ error: setsError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ session: sessionData }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
