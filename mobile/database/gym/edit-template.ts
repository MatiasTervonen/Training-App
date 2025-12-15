import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type gym_template_exercises = {
  exercise_id: string;
  position: number;
  superset_id?: string;
};

export async function editTemplate({
  id,
  exercises,
  name,
  updated_at,
}: {
  id: string;
  exercises: gym_template_exercises[];
  name: string;
  updated_at: string;
}) {
  if (!id) {
    throw new Error("Missing template ID");
  }

  const { error: templateError } = await supabase
    .from("gym_templates")
    .update({ name, updated_at })
    .eq("id", id);

  if (templateError) {
    handleError(templateError, {
      message: "Error updating template",
      route: "/database/gym/edit-template",
      method: "POST",
    });
    throw new Error(templateError?.message || "Error updating template");
  }

  // 2. Delete old exercises
  await supabase.from("gym_template_exercises").delete().eq("template_id", id);

  const templateExercises = exercises.map(
    (ex: gym_template_exercises, index: number) => ({
      template_id: id,
      exercise_id: ex.exercise_id,
      position: index,
      superset_id: ex.superset_id,
    }),
  );

  const { error: templateExerciseError } = await supabase
    .from("gym_template_exercises")
    .insert(templateExercises)
    .select();

  if (templateExerciseError) {
    handleError(templateExerciseError, {
      message: "Error inserting template exercises",
      route: "/database/gym/edit-template",
      method: "POST",
    });
    throw new Error("Error inserting template exercises");
  }

  return { success: true };
}
