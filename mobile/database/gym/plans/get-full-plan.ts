import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type FullPlanExercise = {
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

export type FullPlanTarget = {
  plan_day_exercise_id: string;
  exercise_id: string;
  exercise_position: number;
  week_number: number;
  set_number: number;
  target_weight: number | null;
  target_reps: number | null;
  target_rpe: string | null;
  notes: string | null;
};

export type FullPlanDay = {
  id: string;
  position: number;
  label: string | null;
  rest_timer_seconds: number | null;
  exercises: FullPlanExercise[];
  targets: FullPlanTarget[];
};

export type FullPlan = {
  id: string;
  name: string;
  total_weeks: number | null;
  current_week: number;
  current_position: number;
  is_active: boolean;
  created_at: string;
  days: FullPlanDay[];
};

export async function getFullPlan(planId: string): Promise<FullPlan | null> {
  const { data, error } = await supabase.rpc("training_plan_get_full", {
    p_plan_id: planId,
  });

  if (error) {
    handleError(error, {
      message: "Error fetching full plan",
      route: "/database/gym/plans/get-full-plan",
      method: "GET",
    });
    throw new Error("Error fetching full plan");
  }

  return data as FullPlan | null;
}
