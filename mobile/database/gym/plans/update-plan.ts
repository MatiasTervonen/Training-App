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

export async function updatePlan({
  planId,
  name,
  totalWeeks,
  days,
  targets,
}: {
  planId: string;
  name: string;
  totalWeeks: number | null;
  days: PlanDay[];
  targets: PlanTarget[];
}) {
  const { error } = await supabase.rpc("training_plan_update", {
    p_plan_id: planId,
    p_name: name,
    p_total_weeks: totalWeeks ?? undefined,
    p_days: days,
    p_targets: targets,
  });

  if (error) {
    handleError(error, {
      message: "Error updating training plan",
      route: "/database/gym/plans/update-plan",
      method: "POST",
    });
    throw new Error("Error updating training plan");
  }
}
