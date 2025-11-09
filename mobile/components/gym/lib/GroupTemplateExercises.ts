type gym_template_exercises = {
  id: string;
  exercise_id: string;
  superset_id: string;
  gym_exercises: {
    name: string;
    equipment: string;
    muscle_group: string;
    main_group: string;
  };
};

export default function GroupTemplateExercises(
  exercises: gym_template_exercises[]
): Record<string, gym_template_exercises[]> {
  return exercises.reduce((acc, exercise) => {
    const key = exercise.superset_id ?? `solo-${exercise.id}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(exercise);
    return acc;
  }, {} as Record<string, gym_template_exercises[]>);
}
