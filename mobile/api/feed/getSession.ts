import { supabase } from "@/lib/supabase";
import { notes, full_gym_session, weight } from "@/types/models";
import { Session } from "@supabase/supabase-js";

type FeedItem =
  | { table: "notes"; item: notes; pinned?: boolean }
  | { table: "gym_sessions"; item: full_gym_session; pinned?: boolean }
  | { table: "weight"; item: weight; pinned?: boolean };

export default async function getSession(
  session: Session
): Promise<{ feed: FeedItem[]; error: Error | null }> {
  const [notes, weight, gym_sessions] = await Promise.all([
    supabase.from("notes").select("*").eq("user_id", session.user.id),
    supabase.from("weight").select("*").eq("user_id", session.user.id),
    supabase.from("gym_sessions").select("*").eq("user_id", session.user.id),
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
