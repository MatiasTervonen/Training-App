import { ExerciseEntry } from "@/types/session";

export function GroupGymExercises(
  exercises: ExerciseEntry[]
): Record<string, { exercise: ExerciseEntry; index: number }[]> {
  return exercises.reduce((acc, exercise, index) => {
    const groupKey = exercise.superset_id || `solo-${index}`;
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push({ exercise, index });
    return acc;
  }, {} as Record<string, { exercise: ExerciseEntry; index: number }[]>);
}