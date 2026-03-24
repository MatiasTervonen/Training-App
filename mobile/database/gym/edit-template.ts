import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type gym_template_exercises = {
  exercise_id: string;
  position: number;
  superset_id?: string;
  rest_timer_seconds?: number | null;
};

type TemplatePhasePayload = {
  phase_type: string;
  activity_id: string;
};

export async function editTemplate({
  id,
  exercises,
  name,
  phases = [],
  restTimerSeconds,
}: {
  id: string;
  exercises: gym_template_exercises[];
  name: string;
  phases?: TemplatePhasePayload[];
  restTimerSeconds?: number | null;
}) {
  const { error } = await supabase.rpc("gym_edit_template", {
    p_id: id,
    p_exercises: exercises,
    p_name: name,
    p_phases: phases,
    p_rest_timer_seconds: restTimerSeconds ?? null,
  });

  if (error) {
    handleError(error, {
      message: "Error editing template",
      route: "/database/gym/edit-template",
      method: "POST",
    });
    throw new Error("Error editing template");
  }

  return { success: true };
}
