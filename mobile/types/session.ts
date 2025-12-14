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
  superset_id: string;
  gym_exercise: {
    name: string;
    equipment: string;
    muscle_group: string;
    main_group?: string;
  };
};

type SessionSet = {
  weight: number | null;
  reps: number | null;
  rpe: string | null;
  set_number: number;
  time_min: number;
  distance_meters: number;
};

export type HistoryResult = ({
  date: string;
  main_group?: string;
  name: string;
  equipment: string;
  sets: SessionSet[];
} | null)[];

export type ExerciseSet = {
  weight?: number;
  reps?: number;
  rpe?: string;
  time_min?: number;
  distance_meters?: number;
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
  weight?: string;
  reps?: string;
  rpe?: string;
  time_min?: string;
  distance_meters?: string;
};

export type Feed_item = {
  id: string;
  item_id?: string;
  type:
    | "notes"
    | "weight"
    | "gym_sessions"
    | "todo_lists"
    | "reminders"
    | "custom_reminders";
  created_at: string;
  notes?: string | null;
  title?: string | null;
  weight?: number | null;
  duration?: number | null;
  user_id: string;
  pinned: boolean;
  pinned_at?: string | null;
  notify_at?: string | Date | null;
  delivered?: boolean;
  notify_date?: string | Date | null;
  notify_at_time?: string | null;
  notification_id?: string[] | string | null;
};

export type FeedData = {
  pageParams: any[];
  pages: {
    feed: Feed_item[];
    nextPage?: number;
  }[];
};

export type optimisticNote = {
  id: string;
  type: "notes";
  title: string;
  notes: string;
  created_at: string;
};

export type full_reminder = {
  id: string;
  title: string;
  notes: string | null;
  type: string;
  notify_at: string;
  notification_id?: string[] | string;
  created_at: string;
  updated_at?: string | null;
  delivered: boolean;
  weekdays?: number[];
  active?: boolean;
  notify_date?: string;
  notify_at_time?: string;
};

export type weight = {
  created_at: string;
  id: string;
  notes: string | null;
  title: string | null;
  weight: number;
};
