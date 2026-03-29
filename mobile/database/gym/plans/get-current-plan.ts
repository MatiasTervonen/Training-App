import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type CurrentPlanExercise = {
  id: string;
  exercise_id: string;
  position: number;
  superset_id: string | null;
  rest_timer_seconds: number | null;
  name: string;
  equipment: string;
  muscle_group: string | null;
  main_group: string | null;
};

export type CurrentPlanTarget = {
  plan_day_exercise_id: string;
  exercise_id: string;
  exercise_position: number;
  set_number: number;
  target_weight: number | null;
  target_reps: number | null;
  target_rpe: string | null;
  notes: string | null;
};

export type CurrentPlan = {
  plan_id: string;
  plan_name: string;
  total_weeks: number | null;
  current_week: number;
  current_position: number;
  day_count: number;
  day_label: string | null;
  day_rest_timer_seconds: number | null;
  exercises: CurrentPlanExercise[];
  targets: CurrentPlanTarget[];
};

export async function getCurrentPlan(): Promise<CurrentPlan | null> {
  const { data, error } = await supabase.rpc("training_plan_get_current");

  if (error) {
    handleError(error, {
      message: "Error fetching current plan",
      route: "/database/gym/plans/get-current-plan",
      method: "GET",
    });
    throw new Error("Error fetching current plan");
  }

  return data as CurrentPlan | null;
}
