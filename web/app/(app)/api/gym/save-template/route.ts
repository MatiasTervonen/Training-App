import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

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

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { exercises, name } = body;

  const { data: template, error: templateError } = await supabase
    .from("gym_templates")
    .insert([
      {
        user_id: user.sub,
        name,
      },
    ])
    .select()
    .single();

  if (templateError || !template) {
    handleError(templateError, {
      message: "Error creating template",
      route: "/api/gym/save-template",
      method: "POST",
    });
    return new Response(JSON.stringify({ error: templateError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const templateExercises = exercises.map(
    (ex: gym_template_exercises, index: number) => ({
      template_id: template.id,
      user_id: user.sub,
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
    handleError(templateExerciseError, {
      message: "Error inserting template exercises",
      route: "/api/gym/save-template",
      method: "POST",
    });
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
