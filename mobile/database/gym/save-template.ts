import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type gym_template_exercises = {
  template_id: string;
  exercise_id: string;
  position: number;
  superset_id?: string;
};

type TemplatePhasePayload = {
  phase_type: string;
  activity_id: string;
};

export async function saveTemplate({
  exercises,
  name,
  phases = [],
}: {
  exercises: gym_template_exercises[];
  name: string;
  phases?: TemplatePhasePayload[];
}) {
  const { error } = await supabase.rpc("gym_save_template", {
    p_exercises: exercises,
    p_name: name,
    p_phases: phases,
  });

  if (error) {
    handleError(error, {
      message: "Error saving template",
      route: "/database/gym/save-template",
      method: "POST",
    });
    throw new Error("Error saving template");
  }

  return { success: true };
}
