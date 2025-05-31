import { Exercise } from "@/types/session";

export function groupExercises(
  exercises: Exercise[]
): Record<string, { exercise: Exercise; index: number }[]> {
  return exercises.reduce((acc, exercise, index) => {
    const groupKey =
      exercise.superset_id !== undefined
        ? String(exercise.superset_id)
        : `solo-${index}`;
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push({ exercise, index });
    return acc;
  }, {} as Record<string, { exercise: Exercise; index: number }[]>);
}
