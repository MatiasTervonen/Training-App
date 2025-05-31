import { createClient } from "@/utils/supabase/server";
import { Notes, GymSessionFull } from "@/types/session";

type FeedItem =
  | { table: "notes"; item: Notes }
  | { table: "gym_sessions"; item: GymSessionFull };


export default async function GetPinned(): Promise<{
  pinned: FeedItem[];
  error: Error | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log("Authentication error:", authError);
    return { pinned: [], error: authError || new Error("User not found") };
  }

  const { data, error } = await supabase
    .from("pinned_items")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("Supabase Fetch Error:", error);
    return { pinned: [], error };
  }

  const pinned = data.map((item) => ({
    table: item.table,
    item: item.item_id,
  }));

  return { pinned, error: null };
}
