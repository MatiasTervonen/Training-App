import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type gym_template_exercises = {
  template_id: string;
  exercise_id: string;
  position: number;
  superset_id?: string;
  rest_timer_seconds?: number | null;
};

type TemplatePhasePayload = {
  phase_type: string;
  activity_id: string;
};

export async function saveTemplate({
  exercises,
  name,
  phases = [],
  restTimerSeconds,
}: {
  exercises: gym_template_exercises[];
  name: string;
  phases?: TemplatePhasePayload[];
  restTimerSeconds?: number | undefined;
}) {
  const { error } = await supabase.rpc("gym_save_template", {
    p_exercises: exercises,
    p_name: name,
    p_phases: phases,
    p_rest_timer_seconds: restTimerSeconds ?? undefined,
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
