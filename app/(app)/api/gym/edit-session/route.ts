import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { exercises, notes, duration, title, id: sessionId } = body;

  const { error: sessionError } = await supabase
    .from("gym_sessions")
    .update({
      title,
      notes,
      duration,
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (sessionError) {
    console.error("Supabase Insert Error:", sessionError);
    return new Response(JSON.stringify({ error: sessionError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: existingExercises } = await supabase
    .from("gym_session_exercises")
    .select("id")
    .eq("session_id", sessionId);

  const exerciseIds = existingExercises?.map((ex) => ex.id);

  if (exerciseIds && exerciseIds.length > 0) {
    await supabase
      .from("gym_sets")
      .delete()
      .in("session_exercise_id", exerciseIds);
  }

  await supabase
    .from("gym_session_exercises")
    .delete()
    .eq("session_id", sessionId);

  const sessionExercises = [];
  const sets = [];

  for (const [index, ex] of exercises.entries()) {
    const sessionExerciseId = crypto.randomUUID();
    const supersetId = ex.superset_id ?? null;

    sessionExercises.push({
      id: sessionExerciseId,
      session_id: sessionId,
      exercise_id: ex.exercise_id,
      position: index,
      superset_id: supersetId ?? null,
      notes: ex.notes ?? null,
    });

    for (const [setIndex, set] of ex.sets.entries()) {
      sets.push({
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

  return new Response(JSON.stringify({ succes: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
