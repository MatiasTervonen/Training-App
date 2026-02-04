import { FullGymTemplate } from "@/app/(app)/database/gym/templates/full-gym-template";

type FullGymTemplateExercise =
  FullGymTemplate["gym_template_exercises"][number];

export function GroupTemplateExercises(
  exercises: FullGymTemplateExercise[],
): Record<string, FullGymTemplateExercise[]> {
  return exercises.reduce(
    (acc, exercise) => {
      const key = exercise.superset_id ?? `solo-${exercise.id}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(exercise);
      return acc;
    },
    {} as Record<string, FullGymTemplateExercise[]>,
  );
}
