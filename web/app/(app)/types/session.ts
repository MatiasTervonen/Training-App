export type OptimisticWeight = {
  id: string;
  title: string;
  weight: number;
  notes: string;
  created_at: string;
};

export type OptimisticGymSession = {
  id: string;
  title: string;
  notes: string;
  created_at: string;
  duration: number;
};

export type OptimisticNotes = {
  id: string;
  title: string;
  notes: string;
  created_at: string;
};

export type Template = {
  id: string;
  name: string;
  created_at: string;
  gym_template_exercises: TemplateExercise[];
};

export type OptimisticTemplate = {
  id: string;
  name: string;
};

export type TemplateExercise = {
  id: string;
  sets: number;
  reps: number;
  superset_id: string;
  gym_exercise: {
    name: string;
    equipment: string;
    muscle_group: string;
    main_group?: string;
  };
};

export type SessionSet = {
  set_number?: number;
  weight?: number;
  reps?: number;
  rpe?: string;
};

export type HistoryResult = {
  date: string;
  sets: SessionSet[];
};

export type ExerciseSet = {
  weight?: number;
  reps?: number;
  rpe?: string;
  sets?: number;
};

export type ExerciseEntry = {
  exercise_id: string;
  name: string;
  equipment: string; // Optional, can be used to display equipment type
  main_group?: string; // Optional, can be used to display main muscle group
  sets: ExerciseSet[];
  notes?: string;
  superset_id?: string; // For super-sets
  muscle_group?: string; // Optional, can be used to display muscle group
};

export const emptyExerciseEntry: ExerciseEntry = {
  exercise_id: "",
  name: "",
  equipment: "",
  sets: [],
  notes: "",
  superset_id: "",
  muscle_group: "",
};

export type ExerciseInput = {
  weight: string;
  reps: string;
  rpe: string;
};

export type FeedItem = {
  table: "gym_sessions";
  item: OptimisticGymSession;
  pinned: boolean;
};

export type feed_view = {
  pinned: boolean;
  id: string;
  item_id?: string;
  type: "notes" | "weight" | "gym_sessions" | "todo_lists";
  created_at?: string;
  notes?: string;
  title?: string;
  weight?: number;
  duration?: number;
  user_id?: string;
};

export type FeedCardProps = {
  table: "notes" | "gym_sessions" | "weight" | "todo_lists";
  item: feed_view;
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};
