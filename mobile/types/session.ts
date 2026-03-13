import { feed_items, notes, activities_with_category } from "./models";

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
};

export type HistoryResult = ({
  date: string;
  main_group?: string;
  name: string;
  equipment: string;
  sets: SessionSet[];
} | null)[];

export type ExerciseSet = {
  weight?: number | null;
  reps?: number | null;
  rpe?: string | null;
};

export type ExerciseEntry = {
  exercise_id: string;
  name: string;
  equipment: string;
  main_group?: string | null;
  sets: ExerciseSet[];
  notes?: string | null;
  superset_id?: string | null;
  muscle_group?: string | null;
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
};

export type FeedItemUI = feed_items & {
  feed_context: "pinned" | "feed";
};

export type FeedData = {
  pageParams: number[];
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
  notify_at: string | null;
  notification_id?: string[] | string;
  created_at: string;
  updated_at?: string | null;
  weekdays?: number[] | null;
  active?: boolean;
  notify_date?: string | null;
  notify_at_time?: string | null;
  seen_at?: string | null;
  delivered?: boolean | null;
  mode?: string | null;
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
  isBadSignal?: boolean;
  confidence?: number;
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
  onMoveToFolder?: () => void;
  onHide?: () => void;
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
    draftRecordings?: DraftRecording[];
    draftImages?: DraftImage[];
    draftVideos?: DraftVideo[];
    existingVoice?: { id: string; uri: string; storage_path: string; duration_ms: number | null }[];
    existingImages?: { id: string; uri: string; storage_path: string }[];
    existingVideos?: {
      id: string;
      uri: string;
      thumbnailUri: string;
      storage_path: string;
      thumbnail_storage_path: string | null;
      duration_ms: number | null;
    }[];
  }[];
  feed_context: "pinned" | "feed";
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
    slug: string | null;
    base_met: number;
  };
  route: {
    type: "LineString";
    coordinates: [number, number][];
  } | null;
};

export type editMyNotes = {
  id: string;
  title: string;
  notes: string;
  updated_at: string;
};

export type DraftRecording = {
  id: string;
  uri: string;
  createdAt: number;
  durationMs?: number;
};

export type DraftImage = {
  id: string;
  uri: string;
  isLoading?: boolean;
};

export type DraftVideo = {
  id: string;
  uri: string;
  thumbnailUri: string;
  durationMs: number;
  isCompressing?: boolean;
};

export type TemplateHistorySession = {
  session_id: string;
  title: string;
  start_time: string;
  duration: number;
  distance_meters: number | null;
  moving_time_seconds: number | null;
  avg_pace: number | null;
  avg_speed: number | null;
  calories: number | null;
  steps: number | null;
};

export type TemplateHistoryMetric = "avg_pace" | "duration" | "avg_speed" | "calories" | "steps";

export type PhaseType = "warmup" | "cooldown";

export type PhaseInputMode = "live" | "manual" | "pending";

export type PhaseData = {
  phase_type: PhaseType;
  activity_id: string;
  activity_name: string;
  activity_slug: string | null;
  activity_met: number;
  is_step_relevant: boolean;
  is_calories_relevant: boolean;
  input_mode: PhaseInputMode;
  duration_seconds: number;
  steps: number | null;
  distance_meters: number | null;
  is_manual: boolean;
  is_tracking: boolean;
  tracking_started_at?: number | null;
};

export type TemplatePhaseData = {
  phase_type: PhaseType;
  activity_id: string;
  activity_name: string;
  activity_slug: string | null;
  activity_met: number;
};
