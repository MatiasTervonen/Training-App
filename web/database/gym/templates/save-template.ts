import { createClient } from "@/utils/supabase/client";
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
  const supabase = createClient();

  const { error } = await supabase.rpc("gym_save_template", {
    p_exercises: exercises,
    p_name: name,
  });

  if (error) {
    console.log("error saving template", error);
    handleError(error, {
      message: "Error saving template",
      route: "/database/gym/templates/save-template",
      method: "POST",
    });
    throw new Error("Error saving template");
  }

  return { success: true };
}
