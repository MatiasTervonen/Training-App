import { ExerciseEntry } from "@/types/session";
import { CurrentPlanTarget } from "@/database/gym/plans/get-current-plan";

export function mergePlanTargets(
  exercises: ExerciseEntry[],
  targets: CurrentPlanTarget[],
): ExerciseEntry[] {
  if (!targets || targets.length === 0) return exercises;

  return exercises.map((exercise) => {
    const exerciseTargets = targets
      .filter((t) => t.exercise_id === exercise.exercise_id)
      .sort((a, b) => a.set_number - b.set_number);

    if (exerciseTargets.length === 0) return exercise;

    const sets = exerciseTargets.map((t) => ({
      weight: t.target_weight ?? 0,
      reps: t.target_reps ?? 0,
      rpe: t.target_rpe ?? "Medium",
    }));

    return { ...exercise, sets };
  });
}
