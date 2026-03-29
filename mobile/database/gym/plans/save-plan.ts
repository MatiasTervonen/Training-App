import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type PlanDayExercise = {
  exercise_id: string;
  position: number;
  superset_id: string | null;
  rest_timer_seconds: number | null;
};

type PlanDay = {
  position: number;
  label: string | null;
  rest_timer_seconds: number | null;
  exercises: PlanDayExercise[];
};

type PlanTarget = {
  day_position: number;
  exercise_position: number;
  week_number: number;
  set_number: number;
  target_weight: number | null;
  target_reps: number | null;
  target_rpe: string | null;
  notes: string | null;
};

export async function savePlan({
  name,
  totalWeeks,
  days,
  targets,
}: {
  name: string;
  totalWeeks: number | null;
  days: PlanDay[];
  targets: PlanTarget[];
}) {
  const { data, error } = await supabase.rpc("training_plan_save", {
    p_name: name,
    p_total_weeks: totalWeeks ?? undefined,
    p_days: days,
    p_targets: targets,
  });

  if (error) {
    handleError(error, {
      message: "Error saving training plan",
      route: "/database/gym/plans/save-plan",
      method: "POST",
    });
    throw new Error("Error saving training plan");
  }

  return data as string;
}
