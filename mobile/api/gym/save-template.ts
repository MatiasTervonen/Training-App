import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type gym_template_exercises = {
  template_id: string;
  exercise_id: string;
  position: number;
  superset_id?: string;
};

export async function saveTemplate({
  exercises,
  name,
}: {
  exercises: gym_template_exercises[];
  name: string;
}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("No session");
  }

  const { data: template, error: templateError } = await supabase
    .from("gym_templates")
    .insert([
      {
        user_id: session.user.id,
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
    throw new Error(templateError?.message || "Error creating template");
  }

  const templateExercises = exercises.map(
    (ex: gym_template_exercises, index: number) => ({
      template_id: template.id,
      user_id: session.user.id,
      exercise_id: ex.exercise_id,
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
    throw new Error(
      templateExerciseError?.message || "Error inserting template exercises"
    );
  }

  return template.id;
}
