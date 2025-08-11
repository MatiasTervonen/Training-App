import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

type PinnedItem =
  | { table: "notes"; item_id: string }
  | { table: "gym_sessions"; item_id: string }
  | { table: "weight"; item_id: string };

export default async function GetPinned(session: Session): Promise<{
  pinned: PinnedItem[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("pinned_items")
    .select("*")
    .eq("user_id", session.user.id);

  if (error) {
    console.error("Supabase Fetch Error:", error);
    return { pinned: [], error };
  }

  const pinned = data
    .map((item) => {
      if (
        item.table === "notes" ||
        item.table === "gym_sessions" ||
        item.table === "weight"
      ) {
        return {
          table: item.table,
          item_id: item.item_id,
        } as PinnedItem;
      }

      return null;
    })
    .filter(Boolean) as PinnedItem[];

  return { pinned, error: null };
}
