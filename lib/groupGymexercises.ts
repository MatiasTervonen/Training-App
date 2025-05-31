import { GymExercise } from "@/types/session";

export function groupGymExercises(
  exercises: GymExercise[]
): Record<string, { exercise: GymExercise; index: number }[]> {
  return exercises.reduce((acc, exercise, index) => {
    const key = exercise.superset_id ?? `solo-${index}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push({ exercise, index });
    return acc;
  }, {} as Record<string, { exercise: GymExercise; index: number }[]>);
}
