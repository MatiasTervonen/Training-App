export type DayExercise = {
  exercise_id: string;
  name: string;
  equipment: string;
  muscle_group: string | null;
  main_group: string | null;
  position: number;
  superset_id: string | null;
  rest_timer_seconds: number | null;
};

export type DayEntry = {
  position: number;
  label: string;
  rest_timer_seconds: number | null;
  exercises: DayExercise[];
};

export type TargetSet = {
  id: number;
  target_weight: string;
  target_reps: string;
  target_rpe: string;
};

export type TargetEntry = {
  day_position: number;
  week_number: number;
  exercise_id: string;
  exercise_name: string;
  exercise_position: number;
  sets: TargetSet[];
};

export type ExerciseSelection = {
  id: string;
  name: string;
  equipment: string;
  muscle_group: string;
  main_group: string;
};
