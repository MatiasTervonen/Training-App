import type { Database } from "@/types/database.types";

export type FriendRequest = Pick<
  Database["public"]["Tables"]["friend_requests"]["Row"],
  "id" | "sender_id" | "created_at"
> & {
  sender: Pick<
    Database["public"]["Tables"]["users"]["Row"],
    "id" | "display_name"
  >;
};

export type Friends = Pick<
  Database["public"]["Tables"]["friends"]["Row"],
  "id" | "created_at"
> & {
  user: Pick<
    Database["public"]["Tables"]["users"]["Row"],
    "id" | "display_name" | "profile_picture"
  >;
};

export type feed_items = Database["public"]["Tables"]["feed_items"]["Row"];

export type pinned_items = Database["public"]["Tables"]["pinned_items"]["Row"];

export type todo_tasks = Database["public"]["Tables"]["todo_tasks"]["Row"];

export type todo_lists = Database["public"]["Tables"]["todo_lists"]["Row"];

export type full_todo_session = todo_lists & {
  todo_tasks: todo_tasks[];
};
export type global_reminders =
  Database["public"]["Tables"]["global_reminders"]["Row"];

export type local_reminders =
  Database["public"]["Tables"]["local_reminders"]["Row"];

export type timers = Database["public"]["Tables"]["timers"]["Row"];

export type users = Database["public"]["Tables"]["users"]["Row"];

export type template = Database["public"]["Tables"]["gym_templates"]["Row"];

export type notes = Database["public"]["Tables"]["notes"]["Row"];

export type weight = Database["public"]["Tables"]["weight"]["Row"];

export type gym_sessions = Database["public"]["Tables"]["gym_sessions"]["Row"];

export type gym_sets = Database["public"]["Tables"]["gym_sets"]["Row"];

export type sessions = Database["public"]["Tables"]["sessions"]["Row"];

export type gym_exercises =
  Database["public"]["Tables"]["gym_exercises"]["Row"];

export type gym_template_exercises =
  Database["public"]["Tables"]["gym_template_exercises"]["Row"];

export type ExercisePreview = Pick<
  Database["public"]["Tables"]["gym_exercises"]["Row"],
  | "id"
  | "user_id"
  | "name"
  | "equipment"
  | "muscle_group"
  | "main_group"
  | "language"
  | "created_at"
>;

export type activities = Pick<
  Database["public"]["Tables"]["activities"]["Row"],
  "id" | "name" | "category_id" | "created_at"
>;

export type activity_session = Database["public"]["Tables"]["sessions"]["Row"];

export type session_stats =
  Database["public"]["Tables"]["session_stats"]["Row"];

export type activity_gps_points =
  Database["public"]["Tables"]["activity_gps_points"]["Row"];

export type FullActivitySession = {
  session: activity_session;
  activity: activities | null;
  stats: session_stats | null;
  route:
    | {
        type: "LineString";
        coordinates: [number, number][];
      }
    | {
        type: "MultiLineString";
        coordinates: [number, number][][];
      }
    | null;
};

export type full_gym_template = template & {
  gym_template_exercises: full_gym_template_exercise[];
};

export type full_gym_template_exercise = gym_template_exercises & {
  gym_exercises: gym_exercises;
};

export type gym_session_exercises =
  Database["public"]["Tables"]["gym_session_exercises"]["Row"];

export type full_gym_exercises = gym_session_exercises & {
  gym_exercises: gym_exercises;
  gym_sets: gym_sets[];
};

export type full_gym_session = sessions & {
  gym_session_exercises: full_gym_exercises[];
};
