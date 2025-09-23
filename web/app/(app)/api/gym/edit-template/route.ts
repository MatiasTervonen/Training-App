import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

type gym_template_exercises = {
  exercise_id: string;
  position: number;
  sets: number;
  reps: number;
  superset_id?: string;
};

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
  const { id, exercises, name } = body;

  if (!id) {
    return new Response("Missing template ID", { status: 400 });
  }

  const { error: templateError } = await supabase
    .from("gym_templates")
    .update({ name })
    .eq("id", id)
    .eq("user_id", user.id);

  if (templateError) {
    console.error("Supabase Insert Error:", templateError);
    return new Response(JSON.stringify({ error: templateError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Delete old exercises
  await supabase
    .from("gym_template_exercises")
    .delete()
    .eq("template_id", id)
    .eq("user_id", user.id);

  const templateExercises = exercises.map(
    (ex: gym_template_exercises, index: number) => ({
      template_id: id,
      user_id: user.id,
      exercise_id: ex.exercise_id,
      sets: ex.sets,
      reps: ex.reps,
      position: index,
      superset_id: ex.superset_id,
    })
  );

  const { error: templateExerciseError } = await supabase
    .from("gym_template_exercises")
    .insert(templateExercises);

  if (templateExerciseError) {
    console.error("Supabase Insert Error:", templateError);
    return new Response(
      JSON.stringify({ error: templateExerciseError?.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({ templateId: id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
