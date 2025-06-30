import { createClient } from "@/utils/supabase/server";
import { Notes, GymSessionFull, Weight } from "@/app/(app)/types/session";

type FeedItem =
  | { table: "notes"; item: Notes; pinned?: boolean }
  | { table: "gym_sessions"; item: GymSessionFull; pinned?: boolean }
  | { table: "weight"; item: Weight; pinned?: boolean };

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
    return { feed: [], error: authError || new Error("User not found") };
  }

  // Fetch notes, weight, and gym sessions in parallel. Remember to put them in right order!!

  const [notes, weight, gym_sessions] = await Promise.all([
    supabase.from("notes").select("*").eq("user_id", user.id),
    supabase.from("weight").select("*").eq("user_id", user.id),
    supabase
      .from("gym_sessions")
      .select(`*, gym_session_exercises(*, gym_exercises(*), gym_sets(*))`)
      .eq("user_id", user.id),
  ]);

  const feed: FeedItem[] = [];

  if (notes.data)
    notes.data.forEach((item) => feed.push({ table: "notes", item }));

  if (gym_sessions.data)
    gym_sessions.data.forEach((item) =>
      feed.push({ table: "gym_sessions", item })
    );

  if (weight.data)
    weight.data.forEach((item) => feed.push({ table: "weight", item }));

  const errors = [notes.error, gym_sessions.error, weight.error].filter(
    Boolean
  );

  const error = errors.length > 0 ? errors[0] : null;

  return { feed, error };
}
