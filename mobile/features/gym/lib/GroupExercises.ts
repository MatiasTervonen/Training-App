import { full_gym_exercises } from "@/types/models";

export default function GroupExercises(
  exercises: full_gym_exercises[],
): Record<string, { exercise: full_gym_exercises; index: number }[]> {
  return exercises.reduce(
    (acc, exercise, index) => {
      const groupKey =
        exercise.superset_id !== undefined
          ? String(exercise.superset_id)
          : `solo-${index}`;
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push({ exercise, index });
      return acc;
    },
    {} as Record<string, { exercise: full_gym_exercises; index: number }[]>,
  );
}
