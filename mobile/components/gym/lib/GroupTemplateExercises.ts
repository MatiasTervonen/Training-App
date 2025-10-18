import { full_gym_template_exercise } from "@/types/models";

export default function GroupTemplateExercises(
  exercises: full_gym_template_exercise[]
): Record<string, full_gym_template_exercise[]> {
  return exercises.reduce((acc, exercise) => {
    const key = exercise.superset_id ?? `solo-${exercise.id}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(exercise);
    return acc;
  }, {} as Record<string, full_gym_template_exercise[]>);
}
