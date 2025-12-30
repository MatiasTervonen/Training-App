import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";

type gym_template_exercises = {
  exercise_id: string;
  position: number;
  superset_id?: string;
};

export async function editTemplate({
  id,
  exercises,
  name,
}: {
  id: string;
  exercises: gym_template_exercises[];
  name: string;
}) {
  const supabase = createClient();

  const { error } = await supabase.rpc("gym_edit_template", {
    p_id: id,
    p_exercises: exercises,
    p_name: name,
  });

  if (error) {
    handleError(error, {
      message: "Error editing template",
      route: "/database/gym/templates/edit-template",
      method: "POST",
    });
    throw new Error("Error editing template");
  }

  return { success: true };
}
