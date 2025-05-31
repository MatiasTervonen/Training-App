import { createClient } from "@/utils/supabase/server";
import { Notes, GymSessionFull } from "@/types/session";

type FeedItem =
  | { table: "notes"; item: Notes; pinned?: boolean }
  | { table: "gym_sessions"; item: GymSessionFull; pinned?: boolean };


export default async function GetSession(): Promise<{
  feed: FeedItem[];
  error: Error | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log("Authenication error:", authError);
    return { feed: [], error: authError || new Error("User not found") };
  }

  const [notes, gym_sessions] = await Promise.all([
    supabase.from("notes").select("*").eq("user_id", user.id),
    supabase
      .from("gym_sessions")
      .select(`*, gym_session_exercises(*, gym_exercises(*), gym_sets(*))`)
      .eq("user_id", user.id),
  ]);

  const feed: FeedItem[] = [];

  if (notes.data)
    notes.data.forEach((item) => feed.push({ table: "notes", item }));

  if (gym_sessions.data)
    gym_sessions.data.forEach((item) => feed.push({ table: "gym_sessions", item }));

  const errors = [notes.error, gym_sessions.error].filter(Boolean);

  const error = errors.length > 0 ? errors[0] : null;

  return { feed, error };
}
