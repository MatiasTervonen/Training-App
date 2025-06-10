import { TemplateExercise } from "@/types/session";

export default function GroupTemplateExercises(
  exercises: TemplateExercise[]
): Record<string, TemplateExercise[]> {
  return exercises.reduce((acc, exercise) => {
    const key = exercise.superset_id ?? `solo-${exercise.id}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(exercise);
    return acc;
  }, {} as Record<string, TemplateExercise[]>);
}
