export type GymSessionFull = {
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
    main_group?: string;
  };
  exercise_id: string;
  name: string;
  notes?: string;
  superset_id?: string | null;
  gym_sets: GymSet[];
};

export type GymSet = {
  weight: number;
  reps: number;
  rpe: string;
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
  superset_id?: string | null;
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
    };
