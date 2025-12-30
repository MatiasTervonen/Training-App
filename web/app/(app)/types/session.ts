import type { Json } from "./database.types";
import { feed_items } from "./models";

export type Template = {
  id: string;
  name: string;
  created_at: string;
  gym_template_exercises: TemplateExercise[];
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
  time_min: number | null;
  distance_meters: number | null;
};

export type HistoryResult = {
  date: string;
  main_group?: string;
  name: string;
  equipment: string;
  sets: SessionSet[];
}[];

export type ExerciseSet = {
  weight?: number;
  reps?: number;
  rpe?: string;
  sets?: number;
  time_min?: number;
  distance_meters?: number;
};

export type ExerciseEntry = {
  exercise_id: string;
  template_id: string;
  name: string;
  equipment: string; // Optional, can be used to display equipment type
  main_group?: string; // Optional, can be used to display main muscle group
  sets: ExerciseSet[];
  notes?: string;
  superset_id?: string; // For super-sets
  muscle_group?: string; // Optional, can be used to display muscle group
  position: number;
};

export const emptyExerciseEntry: ExerciseEntry = {
  exercise_id: "",
  template_id: "",
  name: "",
  equipment: "",
  sets: [],
  notes: "",
  superset_id: "",
  muscle_group: "",
  position: 0,
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
    | "global_reminders"
    | "local_reminders";
  created_at: string;
  notes?: string | null;
  title?: string | null;
  weight?: number | null;
  duration?: number | null;
  user_id: string;
  pinned: boolean;
  pinned_at?: string | null;
  notify_at?: string | Date | null;
  seen_at?: string | null;
  notify_date?: string | Date | null;
  notify_at_time?: string | null;
  delivered?: boolean | null;
};

export type FeedResponse = {
  feed: Feed_item[];
  nextPage: number | null;
};

export type Last30DaysAnalytics = {
  analytics: {
    total_sessions: number;
    avg_duration: number;
    muscle_groups: { group: string; count: number }[];
    sets_per_muscle_group: { group: string; count: number }[];
  };
  heatMap: {
    title: string;
    created_at: string;
  }[];
};

export type full_reminder = {
  id: string;
  title: string;
  notes: string | null;
  type: string;
  notify_at?: string;
  created_at: string;
  updated_at?: string | null;
  seen_at?: string | null;
  weekdays?: Json;
  active?: boolean | null;
  notify_date?: string | null;
  notify_at_time?: string | null;
  delivered?: boolean | null;
};

export type FeedData = {
  pageParams: number[] | null;
  pages: {
    feed: FeedItemUI[];
    nextPage?: number | null;
  }[];
};

export type FeedItemUI = feed_items & {
  feed_context: "pinned" | "feed";
};

export type FeedCardProps = {
  item: FeedItemUI;
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

// For editing todo sessions
export type full_todo_session_optional_id = {
  created_at: string;
  id: string;
  title: string;
  updated_at: string | null;
  user_id: string;
} & {
  todo_tasks: {
    created_at: string;
    id?: string;
    tempId?: string;
    is_completed: boolean;
    list_id: string;
    notes: string | null;
    position: number | null;
    task: string;
    updated_at: string | null;
    user_id: string;
  }[];
};
