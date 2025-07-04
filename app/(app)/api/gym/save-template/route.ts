import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

type gym_template_exercises = {
  template_id: string;
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

  if (user?.email === "guest@example.com") {
    return new Response(JSON.stringify({ error: "demo_mode" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { exercises, name } = body;

  const { data: template, error: templateError } = await supabase
    .from("gym_templates")
    .insert([
      {
        user_id: user.id,
        name,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (templateError || !template) {
    console.error("Supabase Insert Error:", templateError);
    return new Response(JSON.stringify({ error: templateError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const templateExercises = exercises.map(
    (ex: gym_template_exercises, index: number) => ({
      template_id: template.id,
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

  return new Response(JSON.stringify({ templateId: template.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
