import { feed_items, notes } from "./models";

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

export type FeedItemUI = feed_items & {
  feed_context: "pinned" | "feed";
};

export type FeedData = {
  pageParams: any[];
  pages: {
    feed: FeedItemUI[];
    nextPage?: number | null;
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
  weekdays?: number[];
  active?: boolean;
  notify_date?: string;
  notify_at_time?: string;
  seen_at?: string | null;
  delivered?: boolean | null;
};

export type weight = {
  created_at: string;
  id: string;
  notes: string | null;
  title: string | null;
  weight: number;
};

export type TrackPoint = {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
  isStationary: boolean;
};

export type Location = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
};

export type FeedCardProps = {
  item: FeedItemUI;
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export type NotesFeedCardProps = {
  item: notes;
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

export type LatestHistoryPerExercise = {
  exercise_id: string;
  created_at: string;
  main_group: string;
  name: string;
  equipment: string;
  sets: {
    set_number: number;
    weight: number | null;
    reps: number | null;
    rpe: string | null;
    time_min: number | null;
    distance_meters: number | null;
  }[];
};

export type full_activity_template = {
  template: {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    user_id: string;
  };
  route: {
    type: "LineString";
    coordinates: [number, number][];
  } | null;
};

export type templateSummary = {
  template: {
    id: string;
    name: string;
    notes: string | null;
    created_at: string;
    updated_at?: string | null;
    distance_meters: number | null;
  };
  activity: {
    id: string;
    name: string;
  };
  route: {
    type: "LineString";
    coordinates: [number, number][];
  } | null;
};
