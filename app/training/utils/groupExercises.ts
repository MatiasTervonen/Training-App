import { Exercises } from "@/types/session";

export function groupExercises(
  exercises: Exercises[]
): Record<string, { exercise: Exercises; index: number }[]> {
  return exercises.reduce((acc, exercise, index) => {
    const groupKey =
      exercise.superset_id !== undefined
        ? String(exercise.superset_id)
        : `solo-${index}`;
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push({ exercise, index });
    return acc;
  }, {} as Record<string, { exercise: Exercises; index: number }[]>);
}
