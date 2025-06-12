export type GymSessionFull = {
  name?: string;
  id: string;
  title: string;
  user_id: string;
  pinned: boolean;
  notes: string;
  created_at: string;
  duration: number;
  gym_session_exercises: GymExercise[];
};

export type GymExercise = {
  gym_exercises: {
    id: string;
    name: string;
    equipment: string;
    muscle_group: string;
    main_group?: string;
  };
  exercise_id: string;
  name: string;
  notes?: string;
  superset_id?: string | null;
  gym_sets: GymSet[];
};

export type GymSet = {
  weight?: number;
  reps?: number;
  rpe?: string;
  sets?: number;
};

export type Exercises = {
  id: number;
  user_id: string | null;
  name: string;
  equipment: string;
  muscle_group: string;
  main_group: string;
  superset_id?: string | null;
};

export type Exercise = {
  exercise_id: string;
  name: string;
  equipment: string;
  superset_id?: string;
  muscle_group?: string;
  sets: GymSet[];
};

export type Notes = {
  id: string;
  user_id: string;
  title: string;
  notes: string;
  created_at: string;
  pinned: boolean;
};

export type Weight = {
  id: string;
  title: string;
  user_id: string;
  weight: number;
  created_at: string;
  notes: string;
};

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

export type FeedCardProps =
  | {
      table: "notes";
      item: Notes;
      pinned: boolean;
      onTogglePin: () => void;
      onDelete: () => void;
      onExpand: () => void;
      onEdit: () => void;
    }
  | {
      table: "gym_sessions";
      item: GymSessionFull;
      pinned: boolean;
      onTogglePin: () => void;
      onDelete: () => void;
      onExpand: () => void;
      onEdit: () => void;
    }
  | {
      table: "weight";
      item: Weight;
      pinned: boolean;
      onTogglePin: () => void;
      onDelete: () => void;
      onExpand: () => void;
      onEdit: () => void;
    };

export type Template = {
  id: string;
  name: string;
  created_at: string;
  gym_template_exercises: TemplateExercise[];
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
