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
  superset_id: string;
  gym_exercise: {
    name: string;
    equipment: string;
    muscle_group: string;
    main_group?: string;
  };
};

export type SessionSet = {
  weight?: number;
  reps?: number;
  rpe?: string;
};

export type HistoryResult = ({
  date: string;
  main_group?: string;
  sets: {
    weight: number;
    reps: number;
    rpe: string;
  }[];
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

export type FeedCardProps = {
  table:
    | "notes"
    | "gym_sessions"
    | "weight"
    | "todo_lists"
    | "reminders"
    | "custom_reminders";
  item: Feed_item;
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export type FeedResponse = {
  feed: Feed_item[];
  nextPage: number | null;
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
  notes: string;
  type: "global" | "daily" | "weekly" | "one-time";
  notify_at: string;
  notification_id: string[] | string;
  created_at: string;
  updated_at: string;
  delivered: boolean;
  weekdays?: number[];
  active: boolean;
  notify_date?: string;
  notify_at_time?: string;
};
